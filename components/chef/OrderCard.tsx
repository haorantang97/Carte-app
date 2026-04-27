import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  type ChefOrderRow,
  nextStatus,
} from '@/hooks/chef/useChefOrders';
import type { OrderStatus } from '@/types/domain';
import { formatPrice } from '@/lib/price';
import tw from '@/lib/tw';

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

interface Props {
  order: ChefOrderRow;
  onAdvance: (id: string, next: OrderStatus) => void;
  onDelete: (id: string) => void;
}

export function OrderCard({ order, onAdvance, onDelete }: Props) {
  const { t } = useTranslation();
  const next = nextStatus(order.status);
  const total = order.price_at_order * order.quantity;

  return (
    <View style={tw`bg-white border border-gray-200 rounded-xl p-3 flex-row`}>
      {order.dish_image_url ? (
        <Image
          source={{ uri: order.dish_image_url }}
          style={tw`w-16 h-16 rounded-lg bg-gray-100`}
          contentFit="cover"
        />
      ) : (
        <View style={tw`w-16 h-16 rounded-lg bg-gray-100`} />
      )}
      <View style={tw`flex-1 ml-3`}>
        <View style={tw`flex-row items-start justify-between`}>
          <Text style={tw`flex-1 text-sm font-semibold text-gray-900`} numberOfLines={1}>
            {order.dish_name} × {order.quantity}
          </Text>
          <View style={tw.style('px-2 py-0.5 rounded-full', STATUS_BG[order.status])}>
            <Text style={tw.style('text-[10px] font-medium', STATUS_FG[order.status])}>
              {t(`orders.${order.status}`)}
            </Text>
          </View>
        </View>
        <Text style={tw`mt-0.5 text-xs text-gray-500`}>
          {order.diner_username} · {order.group_name}
        </Text>
        <View style={tw`mt-2 flex-row items-center justify-between`}>
          <Text style={tw`text-xs text-gray-700 font-medium`}>{formatPrice(total)}</Text>
          <View style={tw`flex-row items-center gap-2`}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onDelete(order.id);
              }}
              hitSlop={6}
              style={tw`w-7 h-7 rounded-full bg-gray-50 items-center justify-center`}
            >
              <Trash2 size={12} color="#A30000" />
            </Pressable>
            {next ? (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                  onAdvance(order.id, next);
                }}
                style={tw`px-2.5 py-1 rounded-full bg-gray-900 flex-row items-center`}
              >
                <Text style={tw`text-[10px] font-medium text-white`}>{t(`orders.${next}`)}</Text>
                <ChevronRight size={10} color="white" />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}
