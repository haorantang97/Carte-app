import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import * as Speech from 'expo-speech';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Timer, Volume2, VolumeX, X } from 'lucide-react-native';

import { Tappable } from '@/components/ui/Tappable';
import { useDishDetail } from '@/hooks/dish/useDishDetail';
import {
  HighlightedStepText,
  type IngredientLike,
} from '@/components/dish/HighlightedStepText';
import { IngredientSheet } from '@/components/dish/IngredientSheet';
import { SketchBox, SketchCircle } from '@/components/ui/sketch';
import { palette, handFont, noteFont, titleFont } from '@/lib/palette';
import { useResponsive } from '@/lib/responsive';

export default function CookingScreen() {
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const r = useResponsive();
  const contentPadH = r.isTablet
    ? Math.max(28, (r.width - r.contentMaxWidth) / 2)
    : r.scale(20, { min: 14, max: 28 });
  const { dishId } = useLocalSearchParams<{ dishId: string }>();
  const { data: dish, isLoading } = useDishDetail(dishId!);

  const [stepIndex, setStepIndex] = useState(0);
  const [ttsOn, setTtsOn] = useState(true);
  const [timerEndsAt, setTimerEndsAt] = useState<number | null>(null);
  const [, force] = useState(0);
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientLike | null>(
    null,
  );

  const steps = useMemo(() => {
    if (!dish)
      return [] as {
        kind: 'prep' | 'cook';
        order: number;
        instruction: string;
        duration_min?: number;
        tip?: string;
      }[];
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

  useEffect(() => {
    if (!currentStep) return;
    setTimerEndsAt(null);
    if (ttsOn) {
      Speech.stop();
      Speech.speak(currentStep.instruction, { language: 'zh-CN', rate: 0.95 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  useEffect(() => {
    return () => {
      Speech.stop();
      Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (timerEndsAt === null) return;
    const id = setInterval(() => force((n) => n + 1), 500);
    return () => clearInterval(id);
  }, [timerEndsAt]);

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
      <View
        style={{
          flex: 1,
          backgroundColor: palette.paper,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontFamily: handFont, fontSize: 18, color: palette.inkSoft }}>
          加载中…
        </Text>
      </View>
    );
  }

  if (steps.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.paper,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}
      >
        <Text
          style={{
            fontFamily: handFont,
            fontSize: 22,
            color: palette.inkSoft,
            textAlign: 'center',
            lineHeight: 28,
          }}
        >
          这道菜还没有可做的步骤
        </Text>
        <Tappable feedback="press" onPress={() => router.back()}>
          <SketchBox
            radius={999}
            seed={1}
            fillColor={palette.paper}
            style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 8 }}
          >
            <Text style={{ fontFamily: handFont, fontSize: 18, color: palette.ink }}>
              返回
            </Text>
          </SketchBox>
        </Tappable>
      </View>
    );
  }

  const startTimer = async (mins: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const ends = Date.now() + mins * 60 * 1000;
    setTimerEndsAt(ends);
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
      // silent
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      router.back();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const remainingSec = timerEndsAt
    ? Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000))
    : 0;
  const remainingFmt = `${Math.floor(remainingSec / 60)}:${String(
    remainingSec % 60,
  ).padStart(2, '0')}`;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: palette.paper,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      {/* Top bar */}
      <View
        style={{
          paddingHorizontal: contentPadH,
          paddingTop: 12,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Tappable feedback="press" onPress={() => router.back()}>
          <SketchCircle size={r.scale(40, { min: 36, max: 48 })} seed={1}>
            <X size={18} color={palette.ink} strokeWidth={1.5} />
          </SketchCircle>
        </Tappable>
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            fontFamily: handFont,
            fontSize: r.fontScale(22, { min: 18, max: 26 }),
            color: palette.ink,
          }}
          numberOfLines={1}
        >
          {dish.name}
        </Text>
        <Tappable feedback="press" onPress={() => setTtsOn((v) => !v)}>
          <SketchCircle size={r.scale(40, { min: 36, max: 48 })} seed={3}>
            {ttsOn ? (
              <Volume2 size={16} color={palette.ink} strokeWidth={1.5} />
            ) : (
              <VolumeX size={16} color={palette.inkMute} strokeWidth={1.5} />
            )}
          </SketchCircle>
        </Tappable>
      </View>

      {/* Progress */}
      <View style={{ paddingHorizontal: contentPadH, marginTop: 4 }}>
        <View
          style={{
            height: 5,
            backgroundColor: palette.inkPale,
            borderRadius: 999,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${((stepIndex + 1) / total) * 100}%`,
              height: '100%',
              backgroundColor: palette.ink,
            }}
          />
        </View>
        <Text
          style={{
            marginTop: 6,
            textAlign: 'center',
            fontFamily: noteFont,
            fontSize: 13,
            color: palette.inkSoft,
          }}
        >
          第 {stepIndex + 1} / {total} 步 · {currentStep.kind === 'prep' ? '备菜' : '烹饪'}
        </Text>
      </View>

      {/* Step content */}
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: r.isTablet
            ? Math.max(40, (r.width - r.contentMaxWidth) / 2)
            : r.scale(28, { min: 18, max: 40 }),
          paddingVertical: 16,
          gap: 28,
        }}
      >
        <HighlightedStepText
          text={currentStep.instruction}
          ingredients={dish.ingredients ?? []}
          baseStyle={{
            fontFamily: handFont,
            fontSize: r.fontScale(32, { min: 24, max: 38 }),
            color: palette.ink,
            textAlign: 'center',
            lineHeight: r.fontScale(44, { min: 34, max: 52 }),
          }}
          highlightStyle={{
            color: palette.ink,
            fontWeight: '700',
            textDecorationLine: 'underline',
          }}
          onIngredientPress={setSelectedIngredient}
        />

        {currentStep.tip ? (
          <SketchBox
            radius={14}
            seed={4}
            fillColor={palette.paper}
            style={{ paddingHorizontal: 18, paddingVertical: 12, maxWidth: 280 }}
          >
            <Text
              style={{
                fontFamily: noteFont,
                fontSize: 14,
                color: palette.inkSoft,
                lineHeight: 21,
              }}
            >
              ☞ {currentStep.tip}
            </Text>
          </SketchBox>
        ) : null}

        {currentStep.duration_min ? (
          <View>
            {timerEndsAt && remainingSec > 0 ? (
              <SketchBox
                radius={20}
                seed={5}
                fillColor={palette.paper}
                style={{ paddingHorizontal: 30, paddingVertical: 20 }}
              >
                <Text
                  style={{
                    fontFamily: titleFont,
                    fontStyle: 'italic',
                    fontSize: r.fontScale(56, { min: 44, max: 72 }),
                    color: palette.ink,
                    fontWeight: '600',
                    lineHeight: r.fontScale(56, { min: 44, max: 72 }),
                    textAlign: 'center',
                  }}
                >
                  {remainingFmt}
                </Text>
                <Tappable feedback="press" onPress={cancelTimer}>
                  <Text
                    style={{
                      marginTop: 8,
                      textAlign: 'center',
                      fontFamily: noteFont,
                      fontSize: 13,
                      color: palette.inkMute,
                    }}
                  >
                    取消计时
                  </Text>
                </Tappable>
              </SketchBox>
            ) : (
              <Tappable
                feedback="press"
                onPress={() => startTimer(currentStep.duration_min!)}
              >
                <SketchBox
                  radius={999}
                  seed={5}
                  strokeWidth={2}
                  fillColor={palette.paper}
                  style={{ paddingHorizontal: 22, paddingVertical: 12 }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Timer size={18} color={palette.ink} strokeWidth={1.5} />
                    <Text
                      style={{
                        fontFamily: handFont,
                        fontSize: 18,
                        color: palette.ink,
                      }}
                    >
                      开始计时 {currentStep.duration_min} 分钟
                    </Text>
                  </View>
                </SketchBox>
              </Tappable>
            )}
          </View>
        ) : null}
      </ScrollView>

      {/* Bottom nav */}
      <View
        style={{
          paddingHorizontal: contentPadH,
          paddingBottom: 24,
          flexDirection: 'row',
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Tappable feedback="press" onPress={goPrev} disabled={stepIndex === 0}>
            <SketchBox
              radius={999}
              seed={6}
              fillColor={palette.paper}
              style={{ paddingVertical: 14 }}
            >
              <Text
                style={{
                  textAlign: 'center',
                  fontFamily: handFont,
                  fontSize: 20,
                  color: stepIndex === 0 ? palette.inkMute : palette.inkSoft,
                }}
              >
                上一步
              </Text>
            </SketchBox>
          </Tappable>
        </View>
        <View style={{ flex: 1.3 }}>
          <Tappable feedback="press" onPress={goNext}>
            <SketchBox
              radius={999}
              seed={7}
              strokeWidth={2}
              fillColor={palette.paper}
              style={{ paddingVertical: 14 }}
            >
              <Text
                style={{
                  textAlign: 'center',
                  fontFamily: handFont,
                  fontSize: 22,
                  color: palette.ink,
                  fontWeight: '700',
                }}
              >
                {stepIndex >= total - 1 ? '完成 ✓' : '下一步 →'}
              </Text>
            </SketchBox>
          </Tappable>
        </View>
      </View>

      <IngredientSheet
        visible={!!selectedIngredient}
        onClose={() => setSelectedIngredient(null)}
        ingredient={selectedIngredient}
      />
    </View>
  );
}
