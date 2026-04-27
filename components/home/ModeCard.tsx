import type { ComponentType } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { LucideProps } from 'lucide-react-native';
import tw from '@/lib/tw';

interface Props {
  title: string;
  description: string;
  Icon: ComponentType<LucideProps>;
  onPress: () => void;
  delay?: number;
}

export function ModeCard({ title, description, Icon, onPress, delay = 0 }: Props) {
  const handle = () => {
    Haptics.selectionAsync().catch(() => {});
    onPress();
  };

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400).springify()} style={tw`flex-1`}>
      <Pressable
        onPress={handle}
        accessibilityRole="button"
        style={({ pressed }) => [
          tw`flex-1 bg-white border border-gray-200 rounded-2xl p-5 justify-between`,
          { transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        <View
          style={tw`w-12 h-12 rounded-xl bg-gray-100 items-center justify-center`}
        >
          <Icon size={24} color="#171717" strokeWidth={1.5} />
        </View>
        <View style={tw`mt-6`}>
          <Text style={tw`text-lg font-semibold text-gray-900`}>{title}</Text>
          <Text style={tw`mt-1 text-xs text-gray-500 leading-relaxed`}>{description}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
