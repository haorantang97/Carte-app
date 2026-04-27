import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Pencil, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import tw from '@/lib/tw';
import type { Dish } from '@/types/domain';
import { formatPrice } from '@/lib/price';

interface Props {
  dish: Dish;
  editMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function DishCard({ dish, editMode, onEdit, onDelete }: Props) {
  const onPress = () => {
    if (editMode) return;
    Haptics.selectionAsync().catch(() => {});
    router.push(`/dish/${dish.id}`);
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        tw`bg-white border border-gray-200 rounded-xl overflow-hidden`,
        { opacity: pressed && !editMode ? 0.85 : 1 },
      ]}
    >
      {dish.image_url ? (
        <Image
          source={{ uri: dish.image_url }}
          style={[tw`w-full bg-gray-100`, { aspectRatio: 16 / 10 }]}
          contentFit="cover"
        />
      ) : (
        <View style={[tw`w-full bg-gray-100`, { aspectRatio: 16 / 10 }]} />
      )}
      <View style={tw`p-3`}>
        <View style={tw`flex-row items-start justify-between`}>
          <Text style={tw`flex-1 text-sm font-semibold text-gray-900`} numberOfLines={1}>
            {dish.name}
          </Text>
          <Text style={tw`ml-2 text-sm text-[#A68B6A] font-medium`}>
            {formatPrice(Number(dish.price))}
          </Text>
        </View>
        {dish.description ? (
          <Text style={tw`mt-1 text-xs text-gray-600`} numberOfLines={2}>
            {dish.description}
          </Text>
        ) : null}
      </View>

      {editMode ? (
        <View
          style={tw`absolute top-2 right-2 flex-row gap-2`}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={onEdit}
            hitSlop={6}
            style={tw`w-8 h-8 rounded-full bg-white/95 border border-gray-200 items-center justify-center`}
          >
            <Pencil size={12} color="#404040" />
          </Pressable>
          <Pressable
            onPress={onDelete}
            hitSlop={6}
            style={tw`w-8 h-8 rounded-full bg-white/95 border border-gray-200 items-center justify-center`}
          >
            <Trash2 size={12} color="#A30000" />
          </Pressable>
        </View>
      ) : null}
    </Pressable>
  );
}
