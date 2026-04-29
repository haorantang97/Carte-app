import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import tw from '@/lib/tw';

const MIN_DISPLAY_MS = 2500;

export function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, MIN_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <Animated.View
      pointerEvents="none"
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(500)}
      style={tw`absolute inset-0 z-50 items-center justify-center bg-bg`}
    >
      <View style={tw`items-center`}>
        <Animated.Text
          entering={FadeIn.delay(100).duration(800)}
          style={[
            tw`text-gray-900`,
            { fontFamily: 'Fraunces_400Regular', fontSize: 64, letterSpacing: -0.5 },
          ]}
        >
          Carte
        </Animated.Text>
      </View>
    </Animated.View>
  );
}
