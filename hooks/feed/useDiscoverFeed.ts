import { useEffect } from 'react';
import {
  type InfiniteData,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/auth/useSession';

const PAGE_SIZE = 20;

export type FeedDish = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  ingredients: unknown;
  group_id: string;
  group_name: string;
  chef_id: string;
  chef_username: string;
  chef_avatar_url: string | null;
  created_at: string;
  likes_count: number;
  liked_by_me: boolean;
};

export type FeedPage = {
  items: FeedDish[];
  nextOffset: number | null;
};

export const discoverFeedKey = ['discover-feed'] as const;

async function fetchPage(
  offset: number,
  userId: string | undefined,
): Promise<FeedPage> {
  const { data, error } = await supabase
    .from('dishes')
    .select(
      `
      id, name, description, price, image_url, ingredients, group_id, created_at,
      menu_groups!inner (id, name, is_private, chef_id, profiles!inner (id, username, avatar_url))
    `,
    )
    .eq('menu_groups.is_private', false)
    .not('image_url', 'is', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) throw error;

  const rows = data ?? [];
  if (rows.length === 0) {
    return { items: [], nextOffset: null };
  }

  const dishIds = rows.map((r) => r.id);

  const [{ data: allLikes, error: likesErr }, { data: myLikes, error: myErr }] =
    await Promise.all([
      supabase.from('dish_likes').select('dish_id').in('dish_id', dishIds),
      userId
        ? supabase
            .from('dish_likes')
            .select('dish_id')
            .eq('user_id', userId)
            .in('dish_id', dishIds)
        : Promise.resolve({ data: [] as { dish_id: string }[], error: null }),
    ]);

  if (likesErr) throw likesErr;
  if (myErr) throw myErr;

  const counts = new Map<string, number>();
  for (const row of allLikes ?? []) counts.set(row.dish_id, (counts.get(row.dish_id) ?? 0) + 1);
  const mineSet = new Set((myLikes ?? []).map((l) => l.dish_id));

  const items: FeedDish[] = rows.map((r) => {
    const mg = r.menu_groups as unknown as {
      id: string;
      name: string;
      chef_id: string;
      profiles: { id: string; username: string; avatar_url: string | null };
    };
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      price: Number(r.price),
      image_url: r.image_url,
      ingredients: r.ingredients,
      group_id: mg.id,
      group_name: mg.name,
      chef_id: mg.chef_id,
      chef_username: mg.profiles.username,
      chef_avatar_url: mg.profiles.avatar_url,
      created_at: r.created_at,
      likes_count: counts.get(r.id) ?? 0,
      liked_by_me: mineSet.has(r.id),
    };
  });

  return {
    items,
    nextOffset: rows.length < PAGE_SIZE ? null : offset + PAGE_SIZE,
  };
}

export function useDiscoverFeed() {
  const { user } = useSession();
  const qc = useQueryClient();

  const query = useInfiniteQuery<FeedPage, Error, InfiniteData<FeedPage>, typeof discoverFeedKey, number>({
    queryKey: discoverFeedKey,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchPage(pageParam, user?.id),
    getNextPageParam: (last) => last.nextOffset ?? undefined,
  });

  // Realtime: when ANY dish_likes change happens to a dish in the cache,
  // patch the count locally rather than refetching the whole feed.
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`dish_likes:feed:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dish_likes' },
        (payload) => {
          const row = (payload.new ?? payload.old) as { dish_id?: string; user_id?: string } | undefined;
          const dishId = row?.dish_id;
          if (!dishId) return;
          qc.setQueryData<InfiniteData<FeedPage> | undefined>(discoverFeedKey, (prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              pages: prev.pages.map((page) => ({
                ...page,
                items: page.items.map((d) => {
                  if (d.id !== dishId) return d;
                  const delta = payload.eventType === 'INSERT' ? 1 : payload.eventType === 'DELETE' ? -1 : 0;
                  const isMine = row?.user_id === user.id;
                  return {
                    ...d,
                    likes_count: Math.max(0, d.likes_count + delta),
                    liked_by_me: isMine
                      ? payload.eventType === 'INSERT'
                      : d.liked_by_me,
                  };
                }),
              })),
            };
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);

  return query;
}
