import { useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui/EmptyState';
import { SketchPhotoCircle } from '@/components/ui/sketch';
import { palette, handFont, noteFont } from '@/lib/palette';
import type { DishCommentRow } from '@/hooks/dish/useDishComments';
import { formatTimeAgo } from '@/lib/time';

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
      style={{
        width: 56,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        backgroundColor: '#A30000',
        marginLeft: 8,
      }}
    >
      <Trash2 size={16} color="white" />
    </Pressable>
  );

  const Body = (
    <View style={{ flexDirection: 'row', paddingVertical: 6 }}>
      <SketchPhotoCircle src={comment.avatar_url ?? null} size={36} seed={index + 110} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text
            style={{
              fontFamily: handFont,
              fontSize: 14,
              color: palette.ink,
              fontWeight: '700',
            }}
          >
            {comment.username}
          </Text>
          <Text
            style={{
              fontFamily: noteFont,
              fontSize: 11,
              color: palette.inkMute,
            }}
          >
            {formatTimeAgo(comment.created_at)}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: noteFont,
            fontSize: 14,
            color: palette.ink,
            lineHeight: 20,
            marginTop: 2,
          }}
        >
          {comment.content}
        </Text>
      </View>
    </View>
  );

  return (
    <Animated.View entering={FadeInUp.delay(Math.min(index * 30, 240)).duration(250)}>
      {mine ? (
        <Swipeable
          ref={swipeRef}
          renderRightActions={renderRightActions}
          rightThreshold={32}
        >
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
    <View style={{ gap: 8 }}>
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
