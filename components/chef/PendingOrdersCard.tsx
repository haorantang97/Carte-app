import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChefHat, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useChefOrders } from '@/hooks/chef/useChefOrders';
import tw from '@/lib/tw';

/**
 * Chef 主页顶部"待制作订单"卡片(Path A:in-app + push,不上 LiveActivity)。
 *
 * 仅在有 pending/preparing 订单时显示。点击跳到 orders tab。
 *
 * 差异化要点:三家竞品(谱提/ReciMe/Flavorish)都没有 chef-diner 双边订单流,
 * 这是 Carte 独有的 chef 端体验。
 */
export function PendingOrdersCard() {
  const { data: orders } = useChefOrders();

  const pending = useMemo(() => {
    return (orders ?? []).filter(
      (o) => o.status === 'pending' || o.status === 'preparing',
    );
  }, [orders]);

  if (pending.length === 0) return null;

  // 摘要:最近 2 个订单
  const summary = pending
    .slice(0, 2)
    .map((o) => `${o.diner_username}·${o.dish_name}`)
    .join('   ');

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        router.push('/(tabs)/orders');
      }}
      style={tw`mb-3`}
    >
      {({ pressed }) => (
        <View
          style={tw.style(
            'flex-row items-center bg-red-50 border border-red-200 rounded-xl px-3.5 py-3 gap-3',
            pressed && 'opacity-80',
          )}
        >
          <View style={tw`w-10 h-10 rounded-full bg-red-100 items-center justify-center`}>
            <ChefHat size={18} color="#A30000" />
          </View>
          <View style={tw`flex-1`}>
            <Text style={tw`text-sm font-semibold text-red-900`}>
              {pending.length} 个待制作订单
            </Text>
            <Text
              style={tw`text-[11px] text-red-700 mt-0.5`}
              numberOfLines={1}
            >
              {summary}
              {pending.length > 2 ? '  …' : ''}
            </Text>
          </View>
          <ChevronRight size={16} color="#A30000" />
        </View>
      )}
    </Pressable>
  );
}
