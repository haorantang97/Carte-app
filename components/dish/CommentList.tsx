import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/EmptyState';
import type { DishCommentRow } from '@/hooks/dish/useDishComments';
import { formatTimeAgo } from '@/lib/time';
import tw from '@/lib/tw';

interface Props {
  comments: DishCommentRow[];
  myUserId: string | undefined;
  onLongPressOwn: (comment: DishCommentRow) => void;
}

export function CommentList({ comments, myUserId, onLongPressOwn }: Props) {
  const { t } = useTranslation();
  if (comments.length === 0) {
    return <EmptyState title={t('dish.noComments')} />;
  }
  return (
    <View style={tw`gap-4`}>
      {comments.map((c, i) => {
        const mine = c.user_id === myUserId;
        return (
          <Animated.View
            key={c.id}
            entering={FadeInUp.delay(Math.min(i * 30, 240)).duration(250)}
          >
            <Pressable
              onLongPress={() => {
                if (!mine) return;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                onLongPressOwn(c);
              }}
              delayLongPress={500}
              style={tw`flex-row`}
            >
              <View style={tw`w-8 h-8 rounded-full bg-gray-100 items-center justify-center overflow-hidden`}>
                {c.avatar_url ? (
                  <Image source={{ uri: c.avatar_url }} style={tw`w-8 h-8`} contentFit="cover" />
                ) : (
                  <User size={14} color="#A3A3A3" strokeWidth={1.5} />
                )}
              </View>
              <View style={tw`flex-1 ml-3`}>
                <View style={tw`flex-row items-center`}>
                  <Text style={tw`text-xs font-medium text-gray-900`}>{c.username}</Text>
                  <Text style={tw`ml-2 text-[11px] text-gray-400`}>
                    {formatTimeAgo(c.created_at)}
                  </Text>
                </View>
                <Text style={tw`mt-0.5 text-sm text-gray-700 leading-snug`}>{c.content}</Text>
              </View>
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}
