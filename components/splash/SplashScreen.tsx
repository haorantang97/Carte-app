import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { SketchUnderline } from '@/components/ui/sketch';
import { palette, titleFont } from '@/lib/palette';
import { useResponsive } from '@/lib/responsive';

const MIN_DISPLAY_MS = 2200;

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const r = useResponsive();
  useEffect(() => {
    const timer = setTimeout(onDone, MIN_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <Animated.View
      pointerEvents="none"
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(500)}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.paper,
      }}
    >
      <View style={{ alignItems: 'center' }}>
        <Animated.Text
          entering={FadeIn.delay(100).duration(800)}
          style={{
            fontFamily: titleFont,
            fontStyle: 'italic',
            fontSize: r.fontScale(72, { min: 56, max: 96 }),
            color: palette.ink,
            letterSpacing: -1,
            lineHeight: r.fontScale(72, { min: 56, max: 96 }),
          }}
        >
          Carte
        </Animated.Text>
        <View style={{ marginTop: 4 }}>
          <SketchUnderline
            width={r.scale(120, { min: 100, max: 150 })}
            seed={1}
            color={palette.ink}
            strokeWidth={2}
          />
        </View>
      </View>
    </Animated.View>
  );
}
