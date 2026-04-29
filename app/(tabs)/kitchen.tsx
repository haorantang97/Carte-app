import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Plus, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { AppContainer } from '@/components/ui/AppContainer';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CarteCard } from '@/components/carte/CarteCard';
import { AddCarteSheet } from '@/components/carte/AddCarteSheet';
import { MenuGroupSheet } from '@/components/chef/MenuGroupSheet';
import { JoinKitchenSheet } from '@/components/diner/JoinKitchenSheet';
import { UsernamePrompt } from '@/components/onboarding/UsernamePrompt';
import { useMyCartes, type MyCarte } from '@/hooks/carte/useMyCartes';
import { useDeleteMenuGroup } from '@/hooks/chef/useMenuGroups';
import { useLeaveKitchen } from '@/hooks/diner/useLeaveKitchen';
import { useProfile } from '@/hooks/auth/useProfile';
import { showToast } from '@/components/ui/Toast';
import type { MenuGroup } from '@/types/domain';
import tw from '@/lib/tw';

export default function CarteTab() {
  const { t } = useTranslation();
  const { data: cartes, isLoading, error: cartesError } = useMyCartes();
  const { data: profile } = useProfile();
  const del = useDeleteMenuGroup();
  const leave = useLeaveKitchen();

  // Surface silent query failures (eg. PGRST201, RLS denials) so they don't
  // look like "empty list" forever. Without this, a broken query reads as
  // "no cartes" indistinguishable from a real empty state.
  useEffect(() => {
    if (cartesError) {
      console.warn('[useMyCartes] failed', cartesError);
      showToast.error(
        (cartesError as Error)?.message ?? 'Failed to load cartes',
      );
    }
  }, [cartesError]);

  const [addOpen, setAddOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [editing, setEditing] = useState<MenuGroup | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<MyCarte | null>(null);
  const [confirmingLeave, setConfirmingLeave] = useState<MyCarte | null>(null);

  const goEdit = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push('/profile/edit');
  };

  const onSwipeEdit = (c: MyCarte) => {
    // Open MenuGroupSheet seeded with the existing carte data
    setEditing({
      id: c.id,
      chef_id: c.chef_id,
      name: c.name,
      access_code: c.access_code,
      is_private: c.is_private,
      password_hash: null,
      created_at: c.pinned_at,
      updated_at: c.pinned_at,
    });
  };

  const onConfirmDelete = async () => {
    if (!confirmingDelete) return;
    try {
      await del.mutateAsync(confirmingDelete.id);
      showToast.success(t('common.delete'), confirmingDelete.name);
    } catch (e: any) {
      showToast.error(e?.message ?? 'Failed');
    } finally {
      setConfirmingDelete(null);
    }
  };

  const onConfirmLeave = async () => {
    if (!confirmingLeave) return;
    try {
      await leave.mutateAsync(confirmingLeave.id);
      showToast.info('已退出', confirmingLeave.name);
    } catch (e: any) {
      showToast.error(e?.message ?? 'Failed');
    } finally {
      setConfirmingLeave(null);
    }
  };

  return (
    <AppContainer bottomInset={false}>
      {/* Header: title + avatar (replaces Profile tab) */}
      <View style={tw`flex-row items-end justify-between px-4 pt-2 pb-4`}>
        <Text
          style={[
            tw`text-3xl text-gray-900`,
            { fontFamily: 'Fraunces_400Regular', letterSpacing: -0.3 },
          ]}
        >
          Carte
        </Text>
        <Pressable
          onPress={goEdit}
          hitSlop={6}
          style={tw`w-10 h-10 rounded-full bg-gray-100 items-center justify-center overflow-hidden`}
        >
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={tw`w-10 h-10`} contentFit="cover" />
          ) : (
            <User size={18} color="#A3A3A3" strokeWidth={1.5} />
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={tw`px-4 pb-32`}>
        {isLoading ? (
          <View style={tw`pt-20`}>
            <ActivityIndicator size="small" color="#737373" />
          </View>
        ) : (cartes ?? []).length === 0 ? (
          <View style={tw`pt-12`}>
            <EmptyState
              title={t('chef.myMenuGroups')}
              subtitle={`${t('chef.createMenuGroup')} · ${t('diner.joinMenu')}`}
            />
          </View>
        ) : (
          <View style={tw`gap-2.5`}>
            {(cartes ?? []).map((c, i) => (
              <CarteCard
                key={c.id}
                carte={c}
                index={i}
                onEdit={onSwipeEdit}
                onDelete={(c) => setConfirmingDelete(c)}
                onLeave={(c) => setConfirmingLeave(c)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* + FAB */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          setAddOpen(true);
        }}
        style={tw`absolute bottom-6 right-6 w-14 h-14 bg-gray-900 rounded-full items-center justify-center`}
      >
        <Plus size={22} color="white" />
      </Pressable>

      <AddCarteSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={() => setCreateOpen(true)}
        onJoin={() => setJoinOpen(true)}
      />
      <MenuGroupSheet
        visible={createOpen || !!editing}
        onClose={() => {
          setCreateOpen(false);
          setEditing(null);
        }}
        group={editing}
      />
      <JoinKitchenSheet visible={joinOpen} onClose={() => setJoinOpen(false)} />

      <ConfirmDialog
        visible={!!confirmingDelete}
        onClose={() => setConfirmingDelete(null)}
        onConfirm={onConfirmDelete}
        title={t('chef.deleteMenuGroup')}
        message={
          confirmingDelete
            ? t('chef.deleteMenuGroupConfirm', { name: confirmingDelete.name })
            : undefined
        }
        confirmLabel={t('common.delete')}
        destructive
        loading={del.isPending}
      />
      <ConfirmDialog
        visible={!!confirmingLeave}
        onClose={() => setConfirmingLeave(null)}
        onConfirm={onConfirmLeave}
        title="退出这个 Carte?"
        message={confirmingLeave?.name}
        confirmLabel="退出"
        destructive
        loading={leave.isPending}
      />

      <UsernamePrompt />
    </AppContainer>
  );
}
