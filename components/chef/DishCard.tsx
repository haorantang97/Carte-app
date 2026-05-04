import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { AlertCircle, Pencil, RefreshCw, Trash2, UtensilsCrossed } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Swipeable } from 'react-native-gesture-handler';

import { Tappable } from '@/components/ui/Tappable';
import { SketchBox, SketchPill, SketchPhoto } from '@/components/ui/sketch';
import { palette, handFont, noteFont, titleFont } from '@/lib/palette';
import { useResponsive } from '@/lib/responsive';
import type { Dish } from '@/types/domain';
import { formatPrice } from '@/lib/price';

interface Props {
  dish: Dish;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onRetry?: () => void;
}

const STAGE_LABELS: Record<string, string> = {
  fetching: '抓取链接内容',
  extracted: '已抓到数据,准备 AI 整理',
  integrating: 'AI 正在整理菜谱',
};
const STAGE_PROGRESS: Record<string, [number, number, number]> = {
  fetching: [5, 50, 30],
  extracted: [50, 60, 5],
  integrating: [60, 95, 60],
};

function ExtractingCard({ dish, index, onDelete }: { dish: Dish; index: number; onDelete: () => void }) {
  const stage = dish.extract_stage ?? 'fetching';
  const stageStartedAt = useRef<number>(Date.now());
  const lastStage = useRef<string>(stage);
  if (lastStage.current !== stage) {
    stageStartedAt.current = Date.now();
    lastStage.current = stage;
  }
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 500);
    return () => clearInterval(id);
  }, []);

  const stageLabel = STAGE_LABELS[stage] ?? '正在处理…';
  const [start, target, duration] = STAGE_PROGRESS[stage] ?? [5, 95, 60];
  const stageElapsed = (Date.now() - stageStartedAt.current) / 1000;
  const progress = Math.min(target, start + (stageElapsed / duration) * (target - start));
  const progressInt = Math.floor(progress);

  return (
    <SketchBox radius={16} seed={index + 5} fillColor={palette.paper} style={{ padding: 10 }}>
      <View
        style={{
          width: '100%',
          height: 110,
          borderRadius: 10,
          borderWidth: 1.5,
          borderColor: palette.inkPale,
          borderStyle: 'dashed',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <ActivityIndicator size="small" color={palette.ink} />
        <Text style={{ fontFamily: noteFont, fontSize: 11, color: palette.inkSoft }}>
          {stageLabel}
        </Text>
      </View>
      <View
        style={{
          marginTop: 12,
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ fontFamily: handFont, fontSize: 16, color: palette.ink }}>抓取中…</Text>
        <Text
          style={{
            fontFamily: titleFont,
            fontStyle: 'italic',
            fontSize: 14,
            color: palette.ink,
          }}
        >
          {progressInt}%
        </Text>
      </View>
      <View
        style={{
          marginTop: 6,
          height: 4,
          backgroundColor: palette.inkPale,
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: palette.ink,
          }}
        />
      </View>
      <Tappable feedback="press" onPress={onDelete}>
        <Text
          style={{
            marginTop: 8,
            fontFamily: noteFont,
            fontSize: 11,
            color: palette.inkMute,
            textAlign: 'center',
          }}
        >
          取消
        </Text>
      </Tappable>
    </SketchBox>
  );
}

function ErrorCard({
  dish,
  index,
  onDelete,
  onRetry,
}: {
  dish: Dish;
  index: number;
  onDelete: () => void;
  onRetry?: () => void;
}) {
  return (
    <SketchBox radius={16} seed={index + 5} fillColor={palette.paper} style={{ padding: 10 }}>
      <View style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
        <AlertCircle size={20} color={palette.ink} strokeWidth={1.6} />
        <Text
          style={{
            fontFamily: handFont,
            fontSize: 18,
            color: palette.ink,
            lineHeight: 20,
          }}
        >
          提取失败
        </Text>
        {dish.extract_error ? (
          <Text
            style={{
              fontFamily: noteFont,
              fontSize: 12,
              color: palette.inkSoft,
              lineHeight: 16,
            }}
            numberOfLines={3}
          >
            {dish.extract_error}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          {onRetry ? (
            <Tappable
              feedback="press"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onRetry();
              }}
            >
              <SketchPill active seed={11} style={{ paddingTop: 3, paddingBottom: 3 }}>
                <RefreshCw size={11} color={palette.ink} strokeWidth={1.5} />
                <Text style={{ fontFamily: handFont, fontSize: 12, color: palette.ink }}>
                  重试
                </Text>
              </SketchPill>
            </Tappable>
          ) : null}
          <Tappable feedback="press" onPress={onDelete}>
            <SketchPill seed={12} style={{ paddingTop: 3, paddingBottom: 3 }}>
              <Trash2 size={11} color={palette.ink} strokeWidth={1.5} />
              <Text style={{ fontFamily: handFont, fontSize: 12, color: palette.ink }}>
                删除
              </Text>
            </SketchPill>
          </Tappable>
        </View>
      </View>
    </SketchBox>
  );
}

export function DishCard({ dish, index, onEdit, onDelete, onRetry }: Props) {
  const r = useResponsive();
  const { t } = useTranslation();
  const swipeRef = useRef<Swipeable>(null);
  // 2 cards on phone, 3 on tablet — image is square-ish so scale by container width.
  const imgH = r.scale(110, { min: 96, max: 150 });

  if (dish.extract_status === 'extracting') {
    return <ExtractingCard dish={dish} index={index} onDelete={onDelete} />;
  }
  if (dish.extract_status === 'error') {
    return <ErrorCard dish={dish} index={index} onDelete={onDelete} onRetry={onRetry} />;
  }

  const onPress = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push(`/dish/${dish.id}` as any);
  };

  const closeAndCall = (fn: () => void) => () => {
    swipeRef.current?.close();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    fn();
  };

  const renderRightActions = () => (
    <View style={{ flexDirection: 'row', alignItems: 'stretch', paddingLeft: 8 }}>
      <Pressable
        onPress={closeAndCall(onEdit)}
        style={{
          width: 56,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: palette.inkSoft,
          borderRadius: 12,
          marginRight: 6,
        }}
      >
        <Pencil size={14} color="white" />
        <Text style={{ fontFamily: noteFont, fontSize: 10, color: 'white', marginTop: 2 }}>
          {t('common.edit')}
        </Text>
      </Pressable>
      <Pressable
        onPress={closeAndCall(onDelete)}
        style={{
          width: 56,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: palette.destructive,
          borderRadius: 12,
        }}
      >
        <Trash2 size={14} color="white" />
        <Text style={{ fontFamily: noteFont, fontSize: 10, color: 'white', marginTop: 2 }}>
          {t('common.delete')}
        </Text>
      </Pressable>
    </View>
  );

  // Meta line: cuisine · time
  const metaParts: string[] = [];
  if (dish.cuisine) metaParts.push(dish.cuisine);
  if (dish.total_time_min) metaParts.push(`${dish.total_time_min}min`);
  const meta = metaParts.join(' · ');

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      rightThreshold={40}
    >
      <Tappable feedback="lift" onPress={onPress}>
        <SketchBox
          radius={16}
          seed={index + 5}
          fillColor={palette.paper}
          style={{ padding: 10 }}
        >
          {dish.image_url ? (
            <SketchPhoto
              src={dish.image_url}
              radius={10}
              seed={index + 12}
              style={{ width: '100%', height: imgH }}
            />
          ) : (
            <View
              style={{
                width: '100%',
                height: imgH,
                borderRadius: 10,
                backgroundColor: palette.inkPale,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UtensilsCrossed size={32} color={palette.ink} strokeWidth={1.4} />
            </View>
          )}
          <Text
            style={{
              marginTop: 12,
              fontFamily: handFont,
              fontSize: r.fontScale(18, { min: 16, max: 22 }),
              color: palette.ink,
              lineHeight: r.fontScale(19, { min: 17, max: 23 }),
            }}
            numberOfLines={1}
          >
            {dish.name}
          </Text>
          <View
            style={{
              marginTop: 2,
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between',
            }}
          >
            <Text
              style={{
                fontFamily: noteFont,
                fontSize: 11,
                color: palette.inkMute,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {meta || ' '}
            </Text>
            {Number(dish.price) > 0 ? (
              <Text
                style={{
                  fontFamily: titleFont,
                  fontStyle: 'italic',
                  fontSize: 14,
                  color: palette.ink,
                  marginLeft: 4,
                }}
              >
                {formatPrice(Number(dish.price))}
              </Text>
            ) : null}
          </View>
        </SketchBox>
      </Tappable>
    </Swipeable>
  );
}
