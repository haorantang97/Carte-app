import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import * as Speech from 'expo-speech';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  Timer,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react-native';
import { useDishDetail } from '@/hooks/dish/useDishDetail';
import {
  HighlightedStepText,
  type IngredientLike,
} from '@/components/dish/HighlightedStepText';
import { IngredientSheet } from '@/components/dish/IngredientSheet';
import tw from '@/lib/tw';

/**
 * 烹饪模式 — 沉浸式步骤引导(屏幕常亮 + 大字步骤 + 食材高亮 + 计时器 + TTS 朗读)。
 * 不打 LiveActivity(原生模块成本高),计时归零用本地通知兜底。
 */
export default function CookingScreen() {
  useKeepAwake();
  const { dishId } = useLocalSearchParams<{ dishId: string }>();
  const insets = useSafeAreaInsets();
  const { data: dish, isLoading } = useDishDetail(dishId!);

  const [stepIndex, setStepIndex] = useState(0);
  const [ttsOn, setTtsOn] = useState(true);
  const [timerEndsAt, setTimerEndsAt] = useState<number | null>(null);
  const [, force] = useState(0);
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientLike | null>(null);

  // prep + cook 合并成一条线性序列
  const steps = useMemo(() => {
    if (!dish) return [] as Array<{
      kind: 'prep' | 'cook';
      order: number;
      instruction: string;
      duration_min?: number;
      tip?: string;
    }>;
    const prep = (dish.prep_steps ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ ...s, kind: 'prep' as const }));
    const cook = (dish.cook_steps ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ ...s, kind: 'cook' as const }));
    return [...prep, ...cook];
  }, [dish]);

  const currentStep = steps[stepIndex];
  const total = steps.length;

  // 切到新步骤:重置 timer + 朗读
  useEffect(() => {
    if (!currentStep) return;
    setTimerEndsAt(null);
    if (ttsOn) {
      Speech.stop();
      Speech.speak(currentStep.instruction, {
        language: 'zh-CN',
        rate: 0.95,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  // 离开页面时停止朗读 + 取消所有 pending 通知
  useEffect(() => {
    return () => {
      Speech.stop();
      Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
    };
  }, []);

  // 计时 tick
  useEffect(() => {
    if (timerEndsAt === null) return;
    const id = setInterval(() => force((n) => n + 1), 500);
    return () => clearInterval(id);
  }, [timerEndsAt]);

  // 切换 TTS 时,如果开启,立即朗读当前步骤
  useEffect(() => {
    if (!currentStep) return;
    if (ttsOn) {
      Speech.speak(currentStep.instruction, { language: 'zh-CN', rate: 0.95 });
    } else {
      Speech.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsOn]);

  if (isLoading || !dish) {
    return (
      <View style={tw`flex-1 bg-white items-center justify-center`}>
        <Text style={tw`text-sm text-gray-500`}>加载中…</Text>
      </View>
    );
  }

  if (steps.length === 0) {
    return (
      <View style={tw`flex-1 bg-white items-center justify-center px-6`}>
        <Text style={tw`text-base text-gray-700 text-center leading-relaxed`}>
          这道菜还没有可做的步骤
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={tw`mt-4 px-4 py-2 bg-gray-900 rounded-full`}
        >
          <Text style={tw`text-white text-sm`}>返回</Text>
        </Pressable>
      </View>
    );
  }

  const startTimer = async (mins: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const ends = Date.now() + mins * 60 * 1000;
    setTimerEndsAt(ends);
    // 安排归零本地通知,即使 app 进后台或锁屏也能响
    try {
      const perm = await Notifications.getPermissionsAsync();
      if (!perm.granted) {
        const req = await Notifications.requestPermissionsAsync();
        if (!req.granted) return;
      }
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏰ ${dish.name} 计时到了`,
          body: `第 ${stepIndex + 1} 步:${currentStep.instruction.slice(0, 40)}…`,
          sound: 'default',
        },
        trigger: { seconds: Math.max(1, mins * 60), channelId: 'default' } as any,
      });
    } catch {
      // 通知权限 / 调度失败时静默,前台计时仍能用
    }
  };

  const cancelTimer = () => {
    Haptics.selectionAsync().catch(() => {});
    setTimerEndsAt(null);
    Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  };

  const goPrev = () => {
    if (stepIndex === 0) return;
    Haptics.selectionAsync().catch(() => {});
    setStepIndex((i) => i - 1);
  };

  const goNext = () => {
    Haptics.selectionAsync().catch(() => {});
    if (stepIndex >= total - 1) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.back();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const remainingSec = timerEndsAt
    ? Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000))
    : 0;
  const remainingFmt = `${Math.floor(remainingSec / 60)}:${String(remainingSec % 60).padStart(2, '0')}`;

  return (
    <View
      style={[
        tw`flex-1 bg-white`,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* Top bar */}
      <View style={tw`flex-row items-center justify-between px-3 py-2`}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={tw`p-2`}>
          <X size={22} color="#404040" />
        </Pressable>
        <Text
          style={tw`flex-1 text-center text-sm font-medium text-gray-900 px-2`}
          numberOfLines={1}
        >
          {dish.name}
        </Text>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            setTtsOn((t) => !t);
          }}
          hitSlop={10}
          style={tw`p-2`}
        >
          {ttsOn ? (
            <Volume2 size={20} color="#404040" />
          ) : (
            <VolumeX size={20} color="#A3A3A3" />
          )}
        </Pressable>
      </View>

      {/* Progress bar */}
      <View style={tw`px-4 mb-2`}>
        <View style={tw`h-1 bg-gray-100 rounded-full overflow-hidden`}>
          <View
            style={[
              tw`h-full bg-[#A68B6A] rounded-full`,
              { width: `${((stepIndex + 1) / total) * 100}%` },
            ]}
          />
        </View>
        <Text style={tw`mt-1.5 text-[11px] text-gray-500 text-center`}>
          第 {stepIndex + 1} / {total} 步 ·{' '}
          {currentStep.kind === 'prep' ? '备菜' : '烹饪'}
        </Text>
      </View>

      {/* Step content (居中大字) */}
      <ScrollView contentContainerStyle={tw`flex-grow justify-center px-6 py-4`}>
        <HighlightedStepText
          text={currentStep.instruction}
          ingredients={dish.ingredients}
          baseStyle={tw`text-2xl text-gray-900 leading-relaxed font-medium`}
          highlightStyle={tw`text-[#C44536] font-semibold`}
          onIngredientPress={setSelectedIngredient}
        />
        {currentStep.tip ? (
          <View style={tw`mt-5 px-3 py-2.5 bg-[#FAF6EE] border border-[#E8DEC8] rounded-lg`}>
            <Text style={tw`text-sm text-[#A68B6A] leading-relaxed`}>
              💡 {currentStep.tip}
            </Text>
          </View>
        ) : null}

        {/* Timer */}
        {currentStep.duration_min ? (
          <View style={tw`mt-6 items-center`}>
            {timerEndsAt && remainingSec > 0 ? (
              <View style={tw`items-center`}>
                <Text style={tw`text-5xl font-semibold text-gray-900`}>
                  {remainingFmt}
                </Text>
                <Pressable
                  onPress={cancelTimer}
                  style={tw`mt-3 px-4 py-1.5 rounded-full bg-gray-100`}
                >
                  <Text style={tw`text-xs text-gray-600`}>取消计时</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => startTimer(currentStep.duration_min!)}
                style={tw`flex-row items-center px-5 py-3 bg-[#A68B6A] rounded-full`}
              >
                <Timer size={18} color="white" />
                <Text style={tw`ml-2 text-white text-sm font-medium`}>
                  开始计时 {currentStep.duration_min} 分钟
                </Text>
              </Pressable>
            )}
          </View>
        ) : null}
      </ScrollView>

      {/* Bottom nav */}
      <View
        style={tw`flex-row items-center justify-between px-4 py-3 border-t border-gray-200`}
      >
        <Pressable
          onPress={goPrev}
          disabled={stepIndex === 0}
          style={tw.style(
            'flex-row items-center px-4 py-3 rounded-full',
            stepIndex === 0 ? 'bg-gray-100' : 'bg-gray-200',
          )}
        >
          <ChevronLeft size={18} color={stepIndex === 0 ? '#A3A3A3' : '#404040'} />
          <Text
            style={tw.style(
              'ml-1 text-sm font-medium',
              stepIndex === 0 ? 'text-gray-400' : 'text-gray-700',
            )}
          >
            上一步
          </Text>
        </Pressable>
        <Pressable
          onPress={goNext}
          style={tw`flex-row items-center px-5 py-3 rounded-full bg-gray-900`}
        >
          <Text style={tw`mr-1 text-sm font-medium text-white`}>
            {stepIndex >= total - 1 ? '完成' : '下一步'}
          </Text>
          {stepIndex < total - 1 ? (
            <ChevronRight size={18} color="white" />
          ) : null}
        </Pressable>
      </View>

      {/* Ingredient detail sheet — 步骤里点击食材 token 时弹出 */}
      <IngredientSheet
        visible={!!selectedIngredient}
        onClose={() => setSelectedIngredient(null)}
        ingredient={selectedIngredient}
      />
    </View>
  );
}
