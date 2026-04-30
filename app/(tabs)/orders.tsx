import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MessageSquare, ThumbsUp, User } from 'lucide-react-native';

import { AppContainer } from '@/components/ui/AppContainer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { showToast } from '@/components/ui/Toast';
import { OrderListItem } from '@/components/orders/OrderListItem';
import { SketchBox, SketchPill, SketchUnderline } from '@/components/ui/sketch';
import { useChefOrders, useDeleteOrder, useUpdateOrderStatus, nextStatus } from '@/hooks/chef/useChefOrders';
import { useChefOrderHistory } from '@/hooks/chef/useChefOrderHistory';
import { useChefRecentComments } from '@/hooks/dish/useChefRecentComments';
import { useChefWishlists } from '@/hooks/wishlist/useChefWishlists';
import { useMenuGroups } from '@/hooks/chef/useMenuGroups';
import { useRealtimeOrders } from '@/hooks/realtime/useRealtimeOrders';
import type { OrderStatus } from '@/types/domain';
import tw from '@/lib/tw';

type Section = 'orders' | 'wishlist' | 'feedback' | 'history';

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'orders', label: '订单' },
  { key: 'wishlist', label: '愿望' },
  { key: 'feedback', label: '反馈' },
  { key: 'history', label: '历史' },
];

const ALL_CARTE = '__all__';

export default function OrdersTab() {
  const [section, setSection] = useState<Section>('orders');
  const [carteFilter, setCarteFilter] = useState<string>(ALL_CARTE);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const groups = useMenuGroups();
  const orders = useChefOrders();
  const wishlist = useChefWishlists();
  const feedback = useChefRecentComments(20);
  const history = useChefOrderHistory(50);
  const update = useUpdateOrderStatus();
  const del = useDeleteOrder();

  const groupIds = useMemo(
    () => Array.from(new Set((orders.data ?? []).map((o) => o.menu_group_id))),
    [orders.data],
  );
  useRealtimeOrders(groupIds);

  const onAdvance = async (id: string, status: OrderStatus) => {
    try {
      await update.mutateAsync({ id, status });
    } catch (e: any) {
      showToast.error(e?.message ?? 'Failed');
    }
  };

  const onConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await del.mutateAsync(deletingId);
    } catch (e: any) {
      showToast.error(e?.message ?? 'Failed');
    } finally {
      setDeletingId(null);
    }
  };

  // Apply carte filter to whichever section is active.
  const filteredOrders = useMemo(
    () =>
      (orders.data ?? []).filter(
        (o) => carteFilter === ALL_CARTE || o.menu_group_id === carteFilter,
      ),
    [orders.data, carteFilter],
  );
  const filteredWishlist = useMemo(
    () =>
      (wishlist.data ?? []).filter(
        (w) => carteFilter === ALL_CARTE || w.group_id === carteFilter,
      ),
    [wishlist.data, carteFilter],
  );
  const filteredFeedback = useMemo(
    () =>
      (feedback.data ?? []).filter((c) => {
        if (carteFilter === ALL_CARTE) return true;
        const g = groups.data?.find((g) => g.id === carteFilter);
        return g ? c.group_name === g.name : true;
      }),
    [feedback.data, groups.data, carteFilter],
  );
  const filteredHistory = useMemo(
    () =>
      (history.data ?? []).filter(
        (o) => carteFilter === ALL_CARTE || o.menu_group_id === carteFilter,
      ),
    [history.data, carteFilter],
  );

  const isLoading =
    section === 'orders'
      ? orders.isLoading
      : section === 'wishlist'
        ? wishlist.isLoading
        : section === 'feedback'
          ? feedback.isLoading
          : history.isLoading;

  return (
    <AppContainer bottomInset={false}>
      {/* Header */}
      <View style={tw`px-4 pt-3 pb-1`}>
        <Text style={tw`text-3xl text-gray-900`}>后厨</Text>
        <SketchUnderline width={70} seed={1} />
      </View>

      {/* Section sub-tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tw`px-4 mt-2 gap-2`}
      >
        {SECTIONS.map((s, i) => (
          <SketchPill
            key={s.key}
            active={section === s.key}
            seed={i + 2}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setSection(s.key);
            }}
          >
            {s.label}
          </SketchPill>
        ))}
      </ScrollView>

      {/* Carte filter chip row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tw`px-4 mt-2 gap-2`}
      >
        <SketchPill
          active={carteFilter === ALL_CARTE}
          seed={11}
          onPress={() => setCarteFilter(ALL_CARTE)}
          style={{ paddingTop: 3, paddingBottom: 3 }}
        >
          <Text
            style={[
              tw`text-xs`,
              { fontWeight: carteFilter === ALL_CARTE ? '700' : '400', color: '#171717' },
            ]}
          >
            全部 carte
          </Text>
        </SketchPill>
        {(groups.data ?? []).map((g, i) => (
          <SketchPill
            key={g.id}
            active={carteFilter === g.id}
            seed={i + 13}
            onPress={() => setCarteFilter(g.id)}
            style={{ paddingTop: 3, paddingBottom: 3 }}
          >
            <Text
              style={[
                tw`text-xs`,
                { fontWeight: carteFilter === g.id ? '700' : '400', color: '#171717' },
              ]}
            >
              {g.name}
            </Text>
          </SketchPill>
        ))}
      </ScrollView>

      {/* Body */}
      {isLoading ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="small" color="#737373" />
        </View>
      ) : section === 'orders' ? (
        filteredOrders.length === 0 ? (
          <EmptyState title="暂无活跃订单" />
        ) : (
          <ScrollView contentContainerStyle={tw`px-4 mt-3 pb-20 gap-2`}>
            {filteredOrders.map((o) => {
              const next = nextStatus(o.status);
              return (
                <OrderListItem
                  key={o.id}
                  status={o.status}
                  dishName={o.dish_name}
                  dishImageUrl={o.dish_image_url}
                  quantity={o.quantity}
                  price={o.price_at_order}
                  groupName={o.group_name}
                  partyLabel={o.diner_username}
                  createdAt={o.created_at}
                  ingredients={o.dish_ingredients}
                  onAdvance={
                    next
                      ? { label: nextStatusLabel(next), onPress: () => onAdvance(o.id, next) }
                      : null
                  }
                  onDelete={() => setDeletingId(o.id)}
                />
              );
            })}
          </ScrollView>
        )
      ) : section === 'wishlist' ? (
        filteredWishlist.length === 0 ? (
          <EmptyState title="还没有 diner 投愿望" />
        ) : (
          <ScrollView contentContainerStyle={tw`px-4 mt-3 pb-20 gap-2`}>
            {filteredWishlist.map((w, i) => (
              <SketchBox key={w.id} seed={i + 4} radius={16} style={tw`p-3.5 flex-row items-center`}>
                <SketchPill seed={i + 9} style={{ paddingTop: 4, paddingBottom: 4 }}>
                  <ThumbsUp size={12} color="#171717" strokeWidth={1.5} />
                  <Text style={tw`text-sm text-gray-900 ml-1`}>{w.votes}</Text>
                </SketchPill>
                <View style={tw`flex-1 ml-3`}>
                  <Text style={tw`text-base text-gray-900`} numberOfLines={1}>
                    {w.content}
                  </Text>
                  <Text style={tw`text-xs text-gray-500 mt-0.5`} numberOfLines={1}>
                    {w.requester_username} · {w.group_name}
                  </Text>
                </View>
              </SketchBox>
            ))}
          </ScrollView>
        )
      ) : section === 'feedback' ? (
        filteredFeedback.length === 0 ? (
          <EmptyState title="还没有 diner 留言" />
        ) : (
          <ScrollView contentContainerStyle={tw`px-4 mt-3 pb-20 gap-2`}>
            {filteredFeedback.map((c, i) => (
              <Pressable
                key={c.id}
                onPress={() => router.push(`/dish/${c.dish_id}` as any)}
                style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
              >
                <SketchBox seed={i + 4} radius={16} style={tw`p-3.5 flex-row`}>
                  {c.avatar_url ? (
                    <Image
                      source={{ uri: c.avatar_url }}
                      style={tw`w-10 h-10 rounded-full bg-gray-100`}
                    />
                  ) : (
                    <View style={tw`w-10 h-10 rounded-full bg-gray-100 items-center justify-center`}>
                      <User size={16} color="#737373" />
                    </View>
                  )}
                  <View style={tw`flex-1 ml-3`}>
                    <Text style={tw`text-xs text-gray-900`} numberOfLines={1}>
                      <Text style={tw`font-bold`}>{c.username}</Text>
                      <Text style={tw`text-gray-400`}> · </Text>
                      <Text style={{ fontStyle: 'italic' }}>{c.dish_name}</Text>
                    </Text>
                    <Text style={tw`text-sm text-gray-700 mt-1`} numberOfLines={3}>
                      {c.content}
                    </Text>
                    <Text style={tw`text-[10px] text-gray-400 mt-1`}>{c.group_name}</Text>
                  </View>
                </SketchBox>
              </Pressable>
            ))}
          </ScrollView>
        )
      ) : (
        // history
        filteredHistory.length === 0 ? (
          <EmptyState title="暂无历史订单" />
        ) : (
          <ScrollView contentContainerStyle={tw`px-4 mt-3 pb-20 gap-2`}>
            {filteredHistory.map((o) => (
              <OrderListItem
                key={o.id}
                status={o.status}
                dishName={o.dish_name}
                dishImageUrl={o.dish_image_url}
                quantity={o.quantity}
                price={o.price_at_order}
                groupName={o.group_name}
                partyLabel={o.diner_username}
                createdAt={o.created_at}
                ingredients={o.dish_ingredients}
              />
            ))}
          </ScrollView>
        )
      )}

      <ConfirmDialog
        visible={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={onConfirmDelete}
        title="删除订单"
        confirmLabel="删除"
        destructive
        loading={del.isPending}
      />
    </AppContainer>
  );
}

function nextStatusLabel(s: OrderStatus): string {
  switch (s) {
    case 'preparing':
      return '开始制作';
    case 'ready':
      return '可取';
    case 'completed':
      return '完成';
    default:
      return '推进';
  }
}
