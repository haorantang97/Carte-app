import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { AlertCircle, Pencil, RefreshCw, Trash2, UtensilsCrossed } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Swipeable } from 'react-native-gesture-handler';
import tw from '@/lib/tw';
import type { Dish } from '@/types/domain';
import { formatPrice } from '@/lib/price';

interface Props {
  dish: Dish;
  onEdit: () => void;
  onDelete: () => void;
  onRetry?: () => void;
}

// 阶段化进度条:每个 stage 占进度条的一段范围,在该段内基于 elapsed 推进。
// 这样 stage 切换时进度条跳一段(用户感知"在动"),stage 内部缓慢推进。
const STAGE_LABELS: Record<string, string> = {
  fetching: '抓取链接内容',
  extracted: '已抓到数据,准备 AI 整理',
  integrating: 'AI 正在整理菜谱',
};
// stage → [progress 区间起点, 区间终点, 该阶段预期耗时秒数]
const STAGE_PROGRESS: Record<string, [number, number, number]> = {
  fetching: [5, 50, 30],
  extracted: [50, 60, 5],
  integrating: [60, 95, 60],
};

function ExtractingCard({
  dish,
  onDelete,
}: {
  dish: Dish;
  onDelete: () => void;
}) {
  const stage = dish.extract_stage ?? 'fetching';
  // stage 切换时重置该阶段起始时间(用 dish.updated_at 推 stage 切换点)
  const stageStartedAt = useRef<number>(Date.now());
  const lastStage = useRef<string>(stage);
  if (lastStage.current !== stage) {
    stageStartedAt.current = Date.now();
    lastStage.current = stage;
  }

  // 跑一个秒级更新让进度条平滑推进
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 500);
    return () => clearInterval(id);
  }, []);

  const stageLabel = STAGE_LABELS[stage] ?? '正在处理…';
  const [start, target, duration] = STAGE_PROGRESS[stage] ?? [5, 95, 60];
  const stageElapsed = (Date.now() - stageStartedAt.current) / 1000;
  // 在 stage 内从 start 平滑推到 target,耗时 duration 走完;超时也不超过 target
  const progress = Math.min(
    target,
    start + (stageElapsed / duration) * (target - start),
  );
  const progressInt = Math.floor(progress);

  return (
    <View style={tw`bg-gray-100 border border-gray-200 rounded-xl overflow-hidden`}>
      {dish.image_url ? (
        <Image
          source={{ uri: dish.image_url }}
          style={[tw`w-full bg-gray-200`, { aspectRatio: 16 / 10, opacity: 0.6 }]}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            tw`w-full bg-gray-200 items-center justify-center`,
            { aspectRatio: 16 / 10 },
          ]}
        >
          <UtensilsCrossed size={28} color="#A68B6A" strokeWidth={1.5} />
        </View>
      )}
      <View style={tw`p-3 gap-2`}>
        <View style={tw`flex-row items-center gap-2`}>
          <ActivityIndicator size="small" color="#A68B6A" />
          <Text
            style={tw`flex-1 text-xs font-medium text-[#A68B6A]`}
            numberOfLines={1}
          >
            {stageLabel}
          </Text>
          <Text style={tw`text-[10px] text-gray-500 font-medium`}>{progressInt}%</Text>
        </View>
        <View style={tw`h-1 bg-gray-200 rounded-full overflow-hidden`}>
          <View
            style={[
              tw`h-full bg-[#A68B6A] rounded-full`,
              { width: `${progress}%` },
            ]}
          />
        </View>
        <Pressable
          onPress={onDelete}
          style={tw`mt-1 flex-row items-center justify-center py-1`}
        >
          <Text style={tw`text-[10px] text-gray-500 underline`}>取消</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ErrorCard({
  dish,
  onDelete,
  onRetry,
}: {
  dish: Dish;
  onDelete: () => void;
  onRetry?: () => void;
}) {
  return (
    <View style={tw`bg-red-50 border border-red-200 rounded-xl p-3 gap-2`}>
      <View style={tw`flex-row items-center gap-2`}>
        <AlertCircle size={16} color="#A30000" />
        <Text style={tw`flex-1 text-xs font-medium text-red-700`} numberOfLines={1}>
          提取失败
        </Text>
      </View>
      {dish.extract_error ? (
        <Text style={tw`text-[11px] text-red-600`} numberOfLines={3}>
          {dish.extract_error}
        </Text>
      ) : null}
      <View style={tw`flex-row gap-2 mt-1`}>
        {onRetry ? (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              onRetry();
            }}
            style={tw`flex-row items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-full`}
          >
            <RefreshCw size={11} color="#404040" />
            <Text style={tw`text-[11px] text-gray-700`}>重试</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            onDelete();
          }}
          style={tw`flex-row items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-full`}
        >
          <Trash2 size={11} color="#A30000" />
          <Text style={tw`text-[11px] text-red-700`}>删除</Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Chef view of a dish. Renders 3 states:
 * - extract_status='extracting': loading card with mascot + stage + progress
 * - extract_status='error': red card with retry / delete
 * - default: normal card (swipe to edit/delete, tap to detail)
 */
export function DishCard({ dish, onEdit, onDelete, onRetry }: Props) {
  const { t } = useTranslation();
  const swipeRef = useRef<Swipeable>(null);

  // Extracting state — non-interactive (no detail nav, no edit)
  if (dish.extract_status === 'extracting') {
    return <ExtractingCard dish={dish} onDelete={onDelete} />;
  }

  // Error state
  if (dish.extract_status === 'error') {
    return <ErrorCard dish={dish} onDelete={onDelete} onRetry={onRetry} />;
  }

  const onPress = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push(`/dish/${dish.id}`);
  };

  const closeAndCall = (fn: () => void) => () => {
    swipeRef.current?.close();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    fn();
  };

  const renderRightActions = () => (
    <View style={tw`flex-row items-stretch`}>
      <Pressable
        onPress={closeAndCall(onEdit)}
        style={[tw`w-16 items-center justify-center`, { backgroundColor: '#525252' }]}
      >
        <Pencil size={16} color="white" />
        <Text style={tw`text-[10px] text-white mt-1`}>{t('common.edit')}</Text>
      </Pressable>
      <Pressable
        onPress={closeAndCall(onDelete)}
        style={[tw`w-16 items-center justify-center rounded-r-xl`, { backgroundColor: '#A30000' }]}
      >
        <Trash2 size={16} color="white" />
        <Text style={tw`text-[10px] text-white mt-1`}>{t('common.delete')}</Text>
      </Pressable>
    </View>
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      rightThreshold={40}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          tw`bg-white border border-gray-200 rounded-xl overflow-hidden`,
          { opacity: pressed ? 0.85 : 1 },
        ]}
      >
        {dish.image_url ? (
          <Image
            source={{ uri: dish.image_url }}
            style={[tw`w-full bg-gray-100`, { aspectRatio: 16 / 10 }]}
            contentFit="cover"
          />
        ) : (
          <View style={[tw`w-full bg-gray-100`, { aspectRatio: 16 / 10 }]} />
        )}
        <View style={tw`p-3`}>
          <View style={tw`flex-row items-start justify-between`}>
            <Text style={tw`flex-1 text-sm font-semibold text-gray-900`} numberOfLines={1}>
              {dish.name}
            </Text>
            {Number(dish.price) > 0 ? (
              <Text style={tw`ml-2 text-sm text-[#A68B6A] font-medium`}>
                {formatPrice(Number(dish.price))}
              </Text>
            ) : null}
          </View>
          {/* Meta line: cuisine · calories · time */}
          {(() => {
            const parts: string[] = [];
            if (dish.cuisine) parts.push(dish.cuisine);
            if (dish.calories) parts.push(`${dish.calories} 千卡`);
            if (dish.total_time_min) parts.push(`${dish.total_time_min} 分钟`);
            return parts.length > 0 ? (
              <Text style={tw`mt-1 text-[11px] text-gray-500`}>{parts.join(' · ')}</Text>
            ) : null;
          })()}
          {dish.description ? (
            <Text style={tw`mt-1 text-xs text-gray-600`} numberOfLines={2}>
              {dish.description}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Swipeable>
  );
}
