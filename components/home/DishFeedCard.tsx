import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import tw from '@/lib/tw';
import type { FeedDish } from '@/hooks/feed/useDiscoverFeed';
import { useToggleDishLike } from '@/hooks/dish/useDishLikes';

interface Props {
  dish: FeedDish;
  aspectRatio: number;
}

function DishFeedCardInner({ dish, aspectRatio }: Props) {
  const toggle = useToggleDishLike();

  const onLike = (e: any) => {
    e.stopPropagation?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    toggle.mutate({ dishId: dish.id, liked: dish.liked_by_me });
  };

  return (
    <Pressable
      onPress={() => router.push(`/dish/${dish.id}`)}
      style={tw`bg-white rounded-xl overflow-hidden border border-gray-200 mb-2`}
    >
      {dish.image_url ? (
        <Image
          source={{ uri: dish.image_url }}
          style={[tw`w-full`, { aspectRatio }]}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[tw`w-full bg-gray-100`, { aspectRatio }]} />
      )}
      <View style={tw`px-2.5 py-2`}>
        <Text style={tw`text-sm font-medium text-gray-900`} numberOfLines={1}>
          {dish.name}
        </Text>
        {dish.description ? (
          <Text style={tw`mt-0.5 text-[11px] text-gray-500 leading-tight`} numberOfLines={2}>
            {dish.description}
          </Text>
        ) : null}
        <View style={tw`mt-2 flex-row items-center justify-between`}>
          <Text
            style={tw`text-[10px] text-gray-500 flex-1`}
            numberOfLines={1}
          >
            {dish.chef_username}
          </Text>
          <Pressable onPress={onLike} hitSlop={10} style={tw`flex-row items-center`}>
            <Heart
              size={14}
              color={dish.liked_by_me ? '#A68B6A' : '#A3A3A3'}
              fill={dish.liked_by_me ? '#A68B6A' : 'transparent'}
            />
            {dish.likes_count > 0 && (
              <Text
                style={tw.style('ml-1 text-[10px]', dish.liked_by_me ? 'text-[#A68B6A]' : 'text-gray-500')}
              >
                {dish.likes_count}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

export const DishFeedCard = memo(DishFeedCardInner);
