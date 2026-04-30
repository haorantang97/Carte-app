import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { MessageSquare, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useChefRecentComments } from '@/hooks/dish/useChefRecentComments';
import tw from '@/lib/tw';

/**
 * Chef 主页"最新反馈"卡片 — 聚合 chef 所有 dish 的最新评论。
 * 让 chef 看到 diners 的真实反馈(夸/吐槽/建议),而不必逐道菜翻评论区。
 *
 * 差异化要点:三家竞品没有 chef-diner 双边模型,这种"反馈精选"是 Carte 独有的。
 */
export function RecentCommentsCard() {
  const { data: comments } = useChefRecentComments(3);

  if (!comments || comments.length === 0) return null;

  return (
    <View
      style={tw`mb-3 px-3.5 py-3 bg-white border border-gray-200 rounded-xl`}
    >
      <View style={tw`flex-row items-center mb-2`}>
        <MessageSquare size={14} color="#737373" />
        <Text style={tw`ml-1.5 text-xs font-semibold text-gray-700`}>
          最新反馈
        </Text>
        <Text style={tw`ml-2 text-[10px] text-gray-400`}>diners 在说</Text>
      </View>
      <View style={tw`gap-2.5`}>
        {comments.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              router.push(`/dish/${c.dish_id}`);
            }}
            style={({ pressed }) =>
              tw.style('flex-row items-start gap-2.5', pressed && 'opacity-70')
            }
          >
            <View
              style={tw`w-8 h-8 rounded-full bg-gray-100 items-center justify-center overflow-hidden`}
            >
              {c.avatar_url ? (
                <Image
                  source={{ uri: c.avatar_url }}
                  style={tw`w-8 h-8`}
                  contentFit="cover"
                />
              ) : (
                <User size={14} color="#A3A3A3" strokeWidth={1.5} />
              )}
            </View>
            <View style={tw`flex-1`}>
              <View style={tw`flex-row items-center`}>
                <Text style={tw`text-xs font-medium text-gray-900`}>
                  {c.username}
                </Text>
                <Text style={tw`mx-1 text-[10px] text-gray-400`}>·</Text>
                <Text
                  style={tw`text-[11px] text-[#A68B6A] flex-1`}
                  numberOfLines={1}
                >
                  {c.dish_name}
                </Text>
              </View>
              <Text
                style={tw`text-sm text-gray-700 leading-relaxed mt-0.5`}
                numberOfLines={2}
              >
                {c.content}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
