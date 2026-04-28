import { useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Trash2, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/EmptyState';
import type { DishCommentRow } from '@/hooks/dish/useDishComments';
import { formatTimeAgo } from '@/lib/time';
import tw from '@/lib/tw';

interface Props {
  comments: DishCommentRow[];
  myUserId: string | undefined;
  onDelete: (comment: DishCommentRow) => void;
}

function CommentRow({
  comment,
  mine,
  onDelete,
  index,
}: {
  comment: DishCommentRow;
  mine: boolean;
  onDelete: () => void;
  index: number;
}) {
  const swipeRef = useRef<Swipeable>(null);

  const renderRightActions = () => (
    <Pressable
      onPress={() => {
        swipeRef.current?.close();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onDelete();
      }}
      style={[tw`w-16 items-center justify-center rounded-lg`, { backgroundColor: '#A30000' }]}
    >
      <Trash2 size={16} color="white" />
    </Pressable>
  );

  const Body = (
    <View style={tw`flex-row py-1`}>
      <View
        style={tw`w-8 h-8 rounded-full bg-gray-100 items-center justify-center overflow-hidden`}
      >
        {comment.avatar_url ? (
          <Image source={{ uri: comment.avatar_url }} style={tw`w-8 h-8`} contentFit="cover" />
        ) : (
          <User size={14} color="#A3A3A3" strokeWidth={1.5} />
        )}
      </View>
      <View style={tw`flex-1 ml-3`}>
        <View style={tw`flex-row items-center`}>
          <Text style={tw`text-xs font-medium text-gray-900`}>{comment.username}</Text>
          <Text style={tw`ml-2 text-[11px] text-gray-400`}>
            {formatTimeAgo(comment.created_at)}
          </Text>
        </View>
        <Text style={tw`mt-0.5 text-sm text-gray-700 leading-snug`}>{comment.content}</Text>
      </View>
    </View>
  );

  return (
    <Animated.View entering={FadeInUp.delay(Math.min(index * 30, 240)).duration(250)}>
      {mine ? (
        <Swipeable ref={swipeRef} renderRightActions={renderRightActions} rightThreshold={32}>
          {Body}
        </Swipeable>
      ) : (
        Body
      )}
    </Animated.View>
  );
}

export function CommentList({ comments, myUserId, onDelete }: Props) {
  const { t } = useTranslation();
  if (comments.length === 0) {
    return <EmptyState title={t('dish.noComments')} />;
  }
  return (
    <View style={tw`gap-2`}>
      {comments.map((c, i) => (
        <CommentRow
          key={c.id}
          comment={c}
          mine={c.user_id === myUserId}
          onDelete={() => onDelete(c)}
          index={i}
        />
      ))}
    </View>
  );
}
