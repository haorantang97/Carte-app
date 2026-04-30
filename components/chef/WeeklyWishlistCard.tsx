import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Sparkles, ThumbsUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useChefWishlists } from '@/hooks/wishlist/useChefWishlists';
import tw from '@/lib/tw';

/**
 * Chef 主页"本周愿望榜"卡片 — 聚合 chef 所有 menu_group 过去 7 天的 wishlist,
 * 按票数倒序显示 top 3。chef 一眼看到 diners 想吃啥,决定加什么菜。
 *
 * 差异化要点:三家竞品没有 chef-diner 双边模型,这是 Carte 独有的"diner 提需求 →
 * chef 响应"的反馈循环。点击某条跳到对应 group 详情页(menu tab,可在那里加菜)。
 */
export function WeeklyWishlistCard() {
  const { data: items } = useChefWishlists();

  if (!items || items.length === 0) return null;

  const top = items.slice(0, 3);

  return (
    <View
      style={tw`mb-3 px-3.5 py-3 bg-[#FAF6EE] border border-[#E8DEC8] rounded-xl`}
    >
      <View style={tw`flex-row items-center mb-2`}>
        <Sparkles size={14} color="#A68B6A" />
        <Text style={tw`ml-1.5 text-xs font-semibold text-[#A68B6A]`}>
          本周愿望榜
        </Text>
        <Text style={tw`ml-2 text-[10px] text-gray-500`}>diners 想吃</Text>
      </View>
      <View style={tw`gap-2`}>
        {top.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              router.push(`/chef/group/${item.group_id}`);
            }}
            style={({ pressed }) =>
              tw.style('flex-row items-center', pressed && 'opacity-70')
            }
          >
            <View style={tw`flex-row items-center w-12`}>
              <ThumbsUp size={11} color="#A68B6A" />
              <Text style={tw`ml-1 text-[11px] text-[#A68B6A] font-medium`}>
                {item.votes}
              </Text>
            </View>
            <Text
              style={tw`flex-1 text-sm text-gray-900`}
              numberOfLines={1}
            >
              {item.content}
            </Text>
            <Text
              style={tw`text-[10px] text-gray-500 ml-2`}
              numberOfLines={1}
            >
              {item.group_name}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
