import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/EmptyState';
import { DishFeedCard } from '@/components/home/DishFeedCard';
import { type FeedDish, useDiscoverFeed } from '@/hooks/feed/useDiscoverFeed';
import tw from '@/lib/tw';

// Stable, deterministic aspect-ratio sequence per dish id.
// Mirrors the original PWA's varied 4/5, 3/4, 5/6 masonry feel.
const ASPECT_RATIOS = [0.8, 0.75, 0.83, 0.7, 0.85, 0.78];
function aspectFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ASPECT_RATIOS[h % ASPECT_RATIOS.length];
}

export function DiscoverFeed() {
  const { t } = useTranslation();
  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDiscoverFeed();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const allItems: FeedDish[] = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );
  const [left, right] = useMemo(() => {
    const l: FeedDish[] = [];
    const r: FeedDish[] = [];
    allItems.forEach((d, i) => (i % 2 === 0 ? l : r).push(d));
    return [l, r];
  }, [allItems]);

  const handleScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const distFromBottom = contentSize.height - (layoutMeasurement.height + contentOffset.y);
    if (distFromBottom < 400 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (isLoading && allItems.length === 0) {
    return (
      <View style={tw`flex-1 items-center justify-center`}>
        <ActivityIndicator size="small" color="#737373" />
      </View>
    );
  }

  if (allItems.length === 0) {
    return (
      <EmptyState
        title={t('discover.noPublicDishesYet')}
        subtitle={t('discover.beFirstToShare')}
      />
    );
  }

  return (
    <ScrollView
      onScroll={handleScroll}
      scrollEventThrottle={32}
      contentContainerStyle={tw`px-2 pb-6 flex-row gap-2`}
      refreshControl={
        <RefreshControl refreshing={refreshing || isRefetching} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={tw`flex-1`}>
        {left.map((d) => (
          <DishFeedCard key={d.id} dish={d} aspectRatio={aspectFor(d.id)} />
        ))}
      </View>
      <View style={tw`flex-1`}>
        {right.map((d) => (
          <DishFeedCard key={d.id} dish={d} aspectRatio={aspectFor(d.id)} />
        ))}
      </View>
      {isFetchingNextPage && (
        <View style={tw`absolute bottom-2 self-center py-2`}>
          <ActivityIndicator size="small" color="#737373" />
        </View>
      )}
    </ScrollView>
  );
}
