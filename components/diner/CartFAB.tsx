import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { ShoppingCart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import tw from '@/lib/tw';

interface Props {
  count: number;
  onPress: () => void;
}

export function CartFAB({ count, onPress }: Props) {
  const scale = useSharedValue(1);

  // Pulse on count change (when item is added)
  useEffect(() => {
    if (count > 0) {
      scale.value = withSequence(
        withTiming(1.2, { duration: 120 }),
        withTiming(1, { duration: 180 }),
      );
    }
  }, [count, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (count === 0) return null;

  return (
    <Animated.View style={[tw`absolute bottom-6 right-6`, style]}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          onPress();
        }}
        style={tw`w-14 h-14 bg-gray-900 rounded-full items-center justify-center`}
      >
        <ShoppingCart size={20} color="white" />
        <View style={tw`absolute -top-1 -right-1 min-w-5 h-5 bg-red-600 rounded-full items-center justify-center px-1`}>
          <Text style={tw`text-[10px] font-semibold text-white`}>{count}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
