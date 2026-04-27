import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import tw from '@/lib/tw';
import type { DinerDish } from '@/hooks/diner/useDinerMenu';
import { formatPrice } from '@/lib/price';

interface Props {
  dish: DinerDish;
  onAdd: () => void;
}

export function DishCardCompact({ dish, onAdd }: Props) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        router.push(`/dish/${dish.id}`);
      }}
      style={({ pressed }) => [
        tw`flex-row bg-white border border-gray-200 rounded-xl p-3`,
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      {dish.image_url ? (
        <Image
          source={{ uri: dish.image_url }}
          style={tw`w-20 h-20 rounded-lg bg-gray-100`}
          contentFit="cover"
        />
      ) : (
        <View style={tw`w-20 h-20 rounded-lg bg-gray-100`} />
      )}
      <View style={tw`flex-1 ml-3 justify-between`}>
        <View>
          <Text style={tw`text-sm font-semibold text-gray-900`} numberOfLines={1}>
            {dish.name}
          </Text>
          {dish.description ? (
            <Text style={tw`mt-0.5 text-xs text-gray-500 leading-tight`} numberOfLines={2}>
              {dish.description}
            </Text>
          ) : null}
        </View>
        <View style={tw`flex-row items-center justify-between`}>
          <Text style={tw`text-sm font-medium text-[#A68B6A]`}>
            {formatPrice(dish.price)}
          </Text>
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              onAdd();
            }}
            hitSlop={8}
            style={tw`w-8 h-8 rounded-full bg-gray-900 items-center justify-center`}
          >
            <Plus size={14} color="white" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
