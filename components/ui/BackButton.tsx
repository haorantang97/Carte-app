import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import tw from '@/lib/tw';
import { TOUCH_TARGET_MIN } from '@/lib/constants';

export function BackButton({ onPress }: { onPress?: () => void }) {
  const router = useRouter();
  const handle = () => {
    Haptics.selectionAsync().catch(() => {});
    if (onPress) onPress();
    else if (router.canGoBack()) router.back();
  };
  return (
    <Pressable
      onPress={handle}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Back"
      style={({ pressed }) => [
        tw`items-center justify-center rounded-full`,
        {
          width: TOUCH_TARGET_MIN,
          height: TOUCH_TARGET_MIN,
          opacity: pressed ? 0.5 : 1,
        },
      ]}
    >
      <ArrowLeft size={20} color="#404040" />
    </Pressable>
  );
}
