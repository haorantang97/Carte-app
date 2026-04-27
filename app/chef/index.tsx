import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { ListOrdered, Plus } from 'lucide-react-native';
import { AppContainer } from '@/components/ui/AppContainer';
import { BackButton } from '@/components/ui/BackButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { MenuGroupCard } from '@/components/chef/MenuGroupCard';
import { MenuGroupSheet } from '@/components/chef/MenuGroupSheet';
import { useDeleteMenuGroup, useMenuGroups } from '@/hooks/chef/useMenuGroups';
import { showToast } from '@/components/ui/Toast';
import type { MenuGroup } from '@/types/domain';
import tw from '@/lib/tw';

export default function ChefHome() {
  const { t } = useTranslation();
  const { data: groups, isLoading } = useMenuGroups();
  const del = useDeleteMenuGroup();

  const [editMode, setEditMode] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<MenuGroup | null>(null);
  const [deleting, setDeleting] = useState<MenuGroup | null>(null);

  const onCreate = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const onEdit = (group: MenuGroup) => {
    setEditing(group);
    setSheetOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!deleting) return;
    try {
      await del.mutateAsync(deleting.id);
      showToast.success(t('common.delete'), deleting.name);
    } catch (e: any) {
      showToast.error(e?.message ?? 'Failed');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <AppContainer>
      <View style={tw`flex-row items-center px-4 pt-1 pb-3`}>
        <BackButton />
        <Text style={tw`flex-1 ml-2 text-xl font-semibold text-gray-900`}>
          {t('chef.myMenuGroups')}
        </Text>
        <Pressable
          onPress={() => setEditMode((v) => !v)}
          hitSlop={8}
          style={tw`px-3 py-1.5 rounded-full border border-gray-200`}
        >
          <Text style={tw`text-xs text-gray-700`}>
            {editMode ? t('common.confirm') : t('chef.editMode')}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={tw`px-4 pb-32`}>
        {isLoading ? (
          <View style={tw`pt-20`}>
            <ActivityIndicator size="small" color="#737373" />
          </View>
        ) : (groups ?? []).length === 0 ? (
          <View style={tw`pt-12`}>
            <EmptyState title={t('chef.noCategoriesYet')} />
          </View>
        ) : (
          <View style={tw`gap-2.5`}>
            {(groups ?? []).map((g, i) => (
              <MenuGroupCard
                key={g.id}
                group={g}
                editMode={editMode}
                index={i}
                onEdit={() => onEdit(g)}
                onDelete={() => setDeleting(g)}
              />
            ))}
          </View>
        )}

        {editMode ? (
          <Pressable
            onPress={onCreate}
            style={({ pressed }) => [
              tw`mt-2.5 flex-row items-center justify-center bg-white border border-dashed border-gray-300 rounded-2xl py-4`,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Plus size={16} color="#737373" />
            <Text style={tw`ml-2 text-sm text-gray-600`}>{t('chef.createMenuGroup')}</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      {/* Orders FAB */}
      <Pressable
        onPress={() => router.push('/chef/orders')}
        style={tw`absolute bottom-6 right-6 bg-gray-900 rounded-full px-4 py-3 flex-row items-center`}
      >
        <ListOrdered size={16} color="white" />
        <Text style={tw`ml-2 text-sm font-medium text-white`}>{t('chef.activeOrders')}</Text>
      </Pressable>

      {/* Create-default FAB when no groups + not edit */}
      {!editMode && (groups?.length ?? 0) === 0 && (
        <Pressable
          onPress={onCreate}
          style={tw`absolute bottom-6 left-6 bg-gray-900 rounded-full px-4 py-3 flex-row items-center`}
        >
          <Plus size={16} color="white" />
          <Text style={tw`ml-2 text-sm font-medium text-white`}>{t('chef.createMenuGroup')}</Text>
        </Pressable>
      )}

      <MenuGroupSheet
        visible={sheetOpen}
        group={editing}
        onClose={() => setSheetOpen(false)}
      />

      <ConfirmDialog
        visible={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={onConfirmDelete}
        title={t('chef.deleteMenuGroup')}
        message={
          deleting
            ? t('chef.deleteMenuGroupConfirm', { name: deleting.name })
            : undefined
        }
        confirmLabel={t('common.delete')}
        destructive
        loading={del.isPending}
      />
    </AppContainer>
  );
}
