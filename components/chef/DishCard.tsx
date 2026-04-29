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

const STAGE_LABELS: Record<string, string> = {
  fetching: '正在获取笔记数据',
  parsing: '解析内容',
  integrating: '正在提取菜谱',
};

function ExtractingCard({
  dish,
  onDelete,
  startedAt,
}: {
  dish: Dish;
  onDelete: () => void;
  startedAt: number;
}) {
  // 跑一个秒级更新让进度条 / 文案能动起来
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  const stageLabel =
    STAGE_LABELS[dish.extract_stage ?? ''] ??
    (elapsed < 5 ? '等待中…' : '正在处理…');

  // 假进度条:基于 elapsed,90s 走到 90%,之后慢慢逼近 95%
  const fakeProgress = Math.min(95, (elapsed / 90) * 90);

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
          <Text style={tw`text-[10px] text-gray-500`}>{elapsed}s</Text>
        </View>
        {/* 进度条 */}
        <View style={tw`h-1 bg-gray-200 rounded-full overflow-hidden`}>
          <View
            style={[
              tw`h-full bg-[#A68B6A] rounded-full`,
              { width: `${fakeProgress}%` },
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
    const startedAt = dish.extract_started_at
      ? new Date(dish.extract_started_at).getTime()
      : Date.now();
    return <ExtractingCard dish={dish} onDelete={onDelete} startedAt={startedAt} />;
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
