import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { ChevronRight, User } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import tw from '@/lib/tw';
import type { JoinedKitchen } from '@/hooks/diner/useJoinedKitchens';

interface Props {
  kitchen: JoinedKitchen;
  index: number;
}

export function KitchenCard({ kitchen, index }: Props) {
  const onPress = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push(`/diner/group/${kitchen.groupId}`);
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(300)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          tw`bg-white border border-gray-200 rounded-2xl p-3 flex-row items-center`,
          { opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <View
          style={tw`w-12 h-12 rounded-full bg-gray-100 items-center justify-center overflow-hidden`}
        >
          {kitchen.chefAvatarUrl ? (
            <Image
              source={{ uri: kitchen.chefAvatarUrl }}
              style={tw`w-12 h-12`}
              contentFit="cover"
            />
          ) : (
            <User size={20} color="#A3A3A3" strokeWidth={1.5} />
          )}
        </View>
        <View style={tw`flex-1 ml-3`}>
          <Text style={tw`text-base font-medium text-gray-900`} numberOfLines={1}>
            {kitchen.groupName}
          </Text>
          <Text style={tw`text-xs text-gray-500 mt-0.5`}>{kitchen.chefUsername}</Text>
        </View>
        <ChevronRight size={18} color="#A3A3A3" />
      </Pressable>
    </Animated.View>
  );
}
