import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ListOrdered, ShoppingBasket } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { AppContainer } from '@/components/ui/AppContainer';
import { BackButton } from '@/components/ui/BackButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { OrderCard } from '@/components/chef/OrderCard';
import { ShoppingModeView } from '@/components/chef/ShoppingModeView';
import {
  useChefOrders,
  useDeleteOrder,
  useUpdateOrderStatus,
} from '@/hooks/chef/useChefOrders';
import { useRealtimeOrders } from '@/hooks/realtime/useRealtimeOrders';
import { showToast } from '@/components/ui/Toast';
import type { OrderStatus } from '@/types/domain';
import tw from '@/lib/tw';

export default function ChefOrders() {
  const { t } = useTranslation();
  const { data: orders, isLoading } = useChefOrders();
  const update = useUpdateOrderStatus();
  const del = useDeleteOrder();

  const groupIds = useMemo(
    () => Array.from(new Set((orders ?? []).map((o) => o.menu_group_id))),
    [orders],
  );
  useRealtimeOrders(groupIds);

  const [shopMode, setShopMode] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const onAdvance = async (id: string, status: OrderStatus) => {
    try {
      await update.mutateAsync({ id, status });
      showToast.info(t(`orders.${status}` as any));
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

  return (
    <AppContainer>
      <View style={tw`flex-row items-center px-4 pt-1 pb-2`}>
        <BackButton />
        <Text style={tw`flex-1 ml-2 text-xl font-semibold text-gray-900`}>
          {t('chef.activeOrders')}
        </Text>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            setShopMode((v) => !v);
          }}
          hitSlop={8}
          style={tw.style(
            'flex-row items-center px-3 py-1.5 rounded-full',
            shopMode ? 'bg-gray-900' : 'bg-white border border-gray-200',
          )}
        >
          {shopMode ? (
            <ListOrdered size={12} color="white" />
          ) : (
            <ShoppingBasket size={12} color="#404040" />
          )}
          <Text
            style={tw.style(
              'ml-1.5 text-xs',
              shopMode ? 'text-white font-medium' : 'text-gray-700',
            )}
          >
            {shopMode ? t('chef.activeOrders') : t('chef.shoppingList')}
          </Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="small" color="#737373" />
        </View>
      ) : (orders ?? []).length === 0 ? (
        <EmptyState title={t('chef.noActiveOrders')} />
      ) : shopMode ? (
        <ScrollView contentContainerStyle={tw`pb-20`}>
          <ShoppingModeView orders={orders ?? []} />
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={tw`px-4 gap-2 pb-20`}>
          {(orders ?? []).map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              onAdvance={onAdvance}
              onDelete={(id) => setDeletingId(id)}
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
