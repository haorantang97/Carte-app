import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { AppContainer } from '@/components/ui/AppContainer';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { OrderListItem } from '@/components/orders/OrderListItem';
import { useMyOrders } from '@/hooks/orders/useMyOrders';
import {
  nextStatus,
  useChefOrders,
  useDeleteOrder,
  useUpdateOrderStatus,
} from '@/hooks/chef/useChefOrders';
import { useRealtimeOrders } from '@/hooks/realtime/useRealtimeOrders';
import { showToast } from '@/components/ui/Toast';
import type { OrderStatus } from '@/types/domain';
import tw from '@/lib/tw';

type Direction = 'incoming' | 'outgoing';

export default function OrdersTab() {
  const { t } = useTranslation();
  const [direction, setDirection] = useState<Direction>('incoming');

  const incoming = useChefOrders();
  const outgoing = useMyOrders();
  const update = useUpdateOrderStatus();
  const del = useDeleteOrder();

  // Subscribe to realtime new orders for the chef's groups (drives the toast)
  const groupIds = useMemo(
    () => Array.from(new Set((incoming.data ?? []).map((o) => o.menu_group_id))),
    [incoming.data],
  );
  useRealtimeOrders(groupIds);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const onAdvance = async (id: string, status: OrderStatus) => {
    try {
      await update.mutateAsync({ id, status });
    } catch (e: any) {
      showToast.error(e?.message ?? 'Failed');
    }
  };

  const onConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await del.mutateAsync(deletingId);
    } catch (e: any) {
      showToast.error(e?.message ?? 'Failed');
    } finally {
      setDeletingId(null);
    }
  };

  const isLoading = direction === 'incoming' ? incoming.isLoading : outgoing.isLoading;

  return (
    <AppContainer bottomInset={false}>
      <View style={tw`px-4 pt-2 pb-4`}>
        <Text style={tw`text-2xl font-semibold text-gray-900`}>
          {t('chef.activeOrders')}
        </Text>
      </View>

      {/* Direction switcher */}
      <View style={tw`px-4 pb-3 flex-row gap-2`}>
        {(['incoming', 'outgoing'] as Direction[]).map((d) => {
          const active = d === direction;
          return (
            <Pressable
              key={d}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setDirection(d);
              }}
              style={tw.style(
                'flex-1 py-2.5 rounded-full items-center',
                active ? 'bg-gray-900' : 'bg-white border border-gray-200',
              )}
            >
              <Text
                style={tw.style(
                  'text-xs font-medium',
                  active ? 'text-white' : 'text-gray-700',
                )}
              >
                {d === 'incoming' ? '给我的' : '我下的'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="small" color="#737373" />
        </View>
      ) : direction === 'incoming' ? (
        (incoming.data ?? []).length === 0 ? (
          <EmptyState title={t('chef.noActiveOrders')} />
        ) : (
          <ScrollView contentContainerStyle={tw`px-4 pb-20 gap-2`}>
            {(incoming.data ?? []).map((o) => {
              const next = nextStatus(o.status);
              return (
                <OrderListItem
                  key={o.id}
                  status={o.status}
                  dishName={o.dish_name}
                  dishImageUrl={o.dish_image_url}
                  quantity={o.quantity}
                  price={o.price_at_order}
                  groupName={o.group_name}
                  partyLabel={o.diner_username}
                  createdAt={o.created_at}
                  ingredients={o.dish_ingredients}
                  onAdvance={
                    next
                      ? { label: t(`orders.${next}` as any), onPress: () => onAdvance(o.id, next) }
                      : null
                  }
                  onDelete={() => setDeletingId(o.id)}
                />
              );
            })}
          </ScrollView>
        )
      ) : (outgoing.data ?? []).length === 0 ? (
        <EmptyState title={t('chef.noActiveOrders')} />
      ) : (
        <ScrollView contentContainerStyle={tw`px-4 pb-20 gap-2`}>
          {(outgoing.data ?? []).map((o) => (
            <OrderListItem
              key={o.id}
              status={o.status}
              dishName={o.dish_name}
              dishImageUrl={o.dish_image_url}
              quantity={o.quantity}
              price={o.price_at_order}
              groupName={o.group_name}
              partyLabel={o.chef_username}
              createdAt={o.created_at}
            />
          ))}
        </ScrollView>
      )}

      <ConfirmDialog
        visible={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={onConfirmDelete}
        title={t('common.delete')}
        confirmLabel={t('common.delete')}
        destructive
        loading={del.isPending}
      />
    </AppContainer>
  );
}
