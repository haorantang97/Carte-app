import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import tw from '@/lib/tw';
import { palette } from '@/lib/palette';
import type { OrderStatus } from '@/types/domain';
import { formatPrice } from '@/lib/price';
import { formatTimeAgo } from '@/lib/time';

const STATUS_BG: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100',
  preparing: 'bg-blue-100',
  ready: 'bg-green-100',
  completed: 'bg-gray-100',
  cancelled: 'bg-red-100',
};
const STATUS_FG: Record<OrderStatus, string> = {
  pending: 'text-yellow-800',
  preparing: 'text-blue-800',
  ready: 'text-green-800',
  completed: 'text-gray-700',
  cancelled: 'text-red-700',
};

export interface OrderItemProps {
  status: OrderStatus;
  dishName: string;
  dishImageUrl: string | null;
  quantity: number;
  price: number;
  groupName: string;
  /** "Diner Username" for incoming, "Chef Username" for outgoing */
  partyLabel: string;
  createdAt: string;
  /** Ingredients (chef view) — when present, card becomes tappable to expand */
  ingredients?: string[];
  /** When provided, chef can advance status / delete the order */
  onAdvance?: { label: string; onPress: () => void } | null;
  onDelete?: () => void;
}

export function OrderListItem({
  status,
  dishName,
  dishImageUrl,
  quantity,
  price,
  groupName,
  partyLabel,
  createdAt,
  ingredients,
  onAdvance,
  onDelete,
}: OrderItemProps) {
  const { t } = useTranslation();
  const total = price * quantity;
  const [expanded, setExpanded] = useState(false);
  const hasIngredients = !!ingredients && ingredients.length > 0;

  const toggleExpand = () => {
    if (!hasIngredients) return;
    Haptics.selectionAsync().catch(() => {});
    setExpanded((v) => !v);
  };

  return (
    <Pressable
      onPress={toggleExpand}
      disabled={!hasIngredients}
      style={({ pressed }) => [
        tw`bg-white border border-gray-200 rounded-xl p-3`,
        { opacity: pressed && hasIngredients ? 0.85 : 1 },
      ]}
    >
      <View style={tw`flex-row`}>
        {dishImageUrl ? (
          <Image
            source={{ uri: dishImageUrl }}
            style={tw`w-14 h-14 rounded-lg bg-gray-100`}
            contentFit="cover"
          />
        ) : (
          <View style={tw`w-14 h-14 rounded-lg bg-gray-100`} />
        )}
        <View style={tw`flex-1 ml-3`}>
          <View style={tw`flex-row items-start justify-between`}>
            <Text style={tw`flex-1 text-sm font-semibold text-gray-900`} numberOfLines={1}>
              {dishName} × {quantity}
            </Text>
            <View style={tw.style('px-2 py-0.5 rounded-full ml-2', STATUS_BG[status])}>
              <Text style={tw.style('text-[10px] font-medium', STATUS_FG[status])}>
                {t(`orders.${status}`)}
              </Text>
            </View>
          </View>
          <Text style={tw`text-xs text-gray-500 mt-0.5`} numberOfLines={1}>
            {partyLabel} · {groupName}
          </Text>
          <View style={tw`flex-row items-center justify-between mt-1`}>
            <View style={tw`flex-row items-center`}>
              <Text style={tw`text-xs text-gray-700 font-medium`}>{formatPrice(total)}</Text>
              {hasIngredients ? (
                <Text style={tw`ml-2 text-[10px] text-gray-400`}>
                  · {ingredients!.length} 食材 {expanded ? '▴' : '▾'}
                </Text>
              ) : null}
            </View>
            <View style={tw`flex-row items-center gap-2`}>
              <Text style={tw`text-[10px] text-gray-400`}>{formatTimeAgo(createdAt)}</Text>
              {onDelete ? (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    onDelete();
                  }}
                  hitSlop={6}
                  style={tw`w-7 h-7 rounded-full bg-gray-50 items-center justify-center`}
                >
                  <Trash2 size={11} color={palette.destructive} />
                </Pressable>
              ) : null}
              {onAdvance ? (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                    onAdvance.onPress();
                  }}
                  style={tw`px-2.5 py-1 rounded-full bg-gray-900 flex-row items-center`}
                >
                  <Text style={tw`text-[10px] font-medium text-white`}>{onAdvance.label}</Text>
                  <ChevronRight size={10} color="white" />
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </View>

      {hasIngredients && expanded ? (
        <View style={tw`mt-3 pt-3 border-t border-gray-100 flex-row flex-wrap gap-1.5`}>
          {ingredients!.map((ing) => (
            <View key={ing} style={tw`px-2.5 py-1 rounded-full bg-gray-100`}>
              <Text style={tw`text-[11px] text-gray-700`}>{ing}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}
