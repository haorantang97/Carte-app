import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ShoppingBag } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Tappable } from '@/components/ui/Tappable';
import { SketchCircle } from '@/components/ui/sketch';
import { palette, handFont } from '@/lib/palette';
import { useResponsive } from '@/lib/responsive';

interface Props {
  count: number;
  onPress: () => void;
}

export function CartFAB({ count, onPress }: Props) {
  const r = useResponsive();
  const fabSize = r.scale(64, { min: 56, max: 80 });
  const badgeSize = r.scale(28, { min: 24, max: 34 });
  const scale = useSharedValue(1);

  useEffect(() => {
    if (count > 0) {
      scale.value = withSequence(
        withTiming(1.2, { duration: 120 }),
        withTiming(1, { duration: 180 }),
      );
    }
  }, [count, scale]);

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (count === 0) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: r.scale(30, { min: 22, max: 40 }),
          right: r.scale(22, { min: 16, max: 32 }),
          zIndex: 10,
        },
        aStyle,
      ]}
    >
      <Tappable
        feedback="press"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          onPress();
        }}
      >
        <View style={{ position: 'relative' }}>
          <View style={{ backgroundColor: palette.paper, borderRadius: 999 }}>
            <SketchCircle size={fabSize} seed={7} strokeWidth={2}>
              <ShoppingBag
                size={r.scale(26, { min: 22, max: 32 })}
                color={palette.ink}
                strokeWidth={1.6}
              />
            </SketchCircle>
          </View>
          <View
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              backgroundColor: palette.paper,
              borderRadius: 999,
              padding: 3,
            }}
          >
            <SketchCircle size={badgeSize} seed={8} strokeWidth={1.5}>
              <Text
                style={{
                  fontFamily: handFont,
                  fontSize: r.fontScale(18, { min: 16, max: 22 }),
                  color: palette.ink,
                  fontWeight: '700',
                  lineHeight: r.fontScale(18, { min: 16, max: 22 }),
                }}
              >
                {count}
              </Text>
            </SketchCircle>
          </View>
        </View>
      </Tappable>
    </Animated.View>
  );
}
