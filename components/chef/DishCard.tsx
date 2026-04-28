import { useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Pencil, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Swipeable } from 'react-native-gesture-handler';
import tw from '@/lib/tw';
import type { Dish } from '@/types/domain';
import { formatPrice } from '@/lib/price';

interface Props {
  dish: Dish;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Chef view of a dish. Swipe left to reveal Edit / Delete (replaces the
 * old "edit mode" toggle pattern).
 */
export function DishCard({ dish, onEdit, onDelete }: Props) {
  const { t } = useTranslation();
  const swipeRef = useRef<Swipeable>(null);

  const onPress = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push(`/dish/${dish.id}`);
  };

  const closeAndCall = (fn: () => void) => () => {
    swipeRef.current?.close();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    fn();
  };

  const renderRightActions = () => (
    <View style={tw`flex-row items-stretch`}>
      <Pressable
        onPress={closeAndCall(onEdit)}
        style={[tw`w-16 items-center justify-center`, { backgroundColor: '#525252' }]}
      >
        <Pencil size={16} color="white" />
        <Text style={tw`text-[10px] text-white mt-1`}>{t('common.edit')}</Text>
      </Pressable>
      <Pressable
        onPress={closeAndCall(onDelete)}
        style={[tw`w-16 items-center justify-center rounded-r-xl`, { backgroundColor: '#A30000' }]}
      >
        <Trash2 size={16} color="white" />
        <Text style={tw`text-[10px] text-white mt-1`}>{t('common.delete')}</Text>
      </Pressable>
    </View>
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      rightThreshold={40}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          tw`bg-white border border-gray-200 rounded-xl overflow-hidden`,
          { opacity: pressed ? 0.85 : 1 },
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
      </Pressable>
    </Swipeable>
  );
}
