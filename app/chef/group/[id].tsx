import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { AppContainer } from '@/components/ui/AppContainer';
import { BackButton } from '@/components/ui/BackButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CategorySheet } from '@/components/chef/CategorySheet';
import { DishCard } from '@/components/chef/DishCard';
import { DishSheet } from '@/components/chef/DishSheet';
import { PrivacyPasswordSheet } from '@/components/chef/PrivacyPasswordSheet';
import { showToast } from '@/components/ui/Toast';
import { useChefGroupDetails } from '@/hooks/chef/useChefGroupDetails';
import { useDeleteCategory } from '@/hooks/chef/useCategoryMutations';
import { useDeleteDish } from '@/hooks/chef/useDishMutations';
import type { Category, Dish } from '@/types/domain';
import tw from '@/lib/tw';

export default function ChefGroupDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = id!;
  const { t } = useTranslation();
  const { data, isLoading, error } = useChefGroupDetails(groupId);
  const delCategory = useDeleteCategory(groupId);
  const delDish = useDeleteDish(groupId);

  const [editMode, setEditMode] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);

  // Sheets / dialogs
  const [categorySheet, setCategorySheet] = useState<{ open: boolean; category: Category | null }>(
    { open: false, category: null },
  );
  const [dishSheet, setDishSheet] = useState<{ open: boolean; dish: Dish | null }>(
    { open: false, dish: null },
  );
  const [privacySheet, setPrivacySheet] = useState<{ open: boolean; making: boolean }>(
    { open: false, making: false },
  );
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deletingDish, setDeletingDish] = useState<Dish | null>(null);

  const categories = data?.categories ?? [];
  const dishes = data?.dishes ?? [];

  const activeCatId = selectedCatId ?? categories[0]?.id ?? null;
  const visibleDishes = useMemo(
    () => dishes.filter((d) => d.category_id === activeCatId),
    [dishes, activeCatId],
  );

  const onTogglePrivacy = (next: boolean) => {
    Haptics.selectionAsync().catch(() => {});
    setPrivacySheet({ open: true, making: next });
  };

  const onConfirmDelCategory = async () => {
    if (!deletingCategory) return;
    try {
      await delCategory.mutateAsync(deletingCategory.id);
      if (deletingCategory.id === activeCatId) setSelectedCatId(null);
      showToast.success(t('common.delete'), deletingCategory.name);
    } catch (e: any) {
      showToast.error(e?.message ?? 'Failed');
    } finally {
      setDeletingCategory(null);
    }
  };
  const onConfirmDelDish = async () => {
    if (!deletingDish) return;
    try {
      await delDish.mutateAsync(deletingDish.id);
      showToast.success(t('common.delete'), deletingDish.name);
    } catch (e: any) {
      showToast.error(e?.message ?? 'Failed');
    } finally {
      setDeletingDish(null);
    }
  };

  if (isLoading) {
    return (
      <AppContainer>
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="small" color="#737373" />
        </View>
      </AppContainer>
    );
  }
  if (error || !data) {
    return (
      <AppContainer>
        <View style={tw`flex-row items-center px-4 pt-1`}>
          <BackButton />
        </View>
        <EmptyState title={t('diner.menuNotFound')} />
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      {/* Header */}
      <View style={tw`px-4 pt-1 pb-2 flex-row items-center`}>
        <BackButton />
        <Text style={tw`flex-1 ml-2 text-xl font-semibold text-gray-900`} numberOfLines={1}>
          {data.group.name}
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

      {/* Privacy + code row */}
      <View style={tw`px-4 pb-3 flex-row items-center justify-between`}>
        <View style={tw`flex-row items-center`}>
          <Text
            style={[
              tw`text-sm text-gray-700`,
              { fontFamily: 'Menlo', letterSpacing: 2 },
            ]}
          >
            {data.group.access_code}
          </Text>
          {data.group.is_private ? (
            <Text style={tw`ml-2 text-xs text-[#A68B6A]`}>· {t('chef.private')}</Text>
          ) : null}
        </View>
        <View style={tw`flex-row items-center`}>
          <Text style={tw`text-xs text-gray-500 mr-2`}>{t('chef.private')}</Text>
          <Switch
            value={data.group.is_private}
            onValueChange={onTogglePrivacy}
            trackColor={{ false: '#D4D4D4', true: '#A68B6A' }}
            thumbColor="white"
          />
        </View>
      </View>

      {/* Categories tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tw`px-4 pb-3 gap-2`}
      >
        {categories.map((c) => {
          const active = c.id === activeCatId;
          return (
            <Pressable
              key={c.id}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setSelectedCatId(c.id);
              }}
              onLongPress={() => editMode && setCategorySheet({ open: true, category: c })}
              style={tw.style(
                'rounded-full px-4 py-2 border',
                active ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-200',
              )}
            >
              <Text
                style={tw.style(
                  'text-xs font-medium',
                  active ? 'text-white' : 'text-gray-700',
                )}
              >
                {c.name}
              </Text>
            </Pressable>
          );
        })}
        {editMode ? (
          <Pressable
            onPress={() => setCategorySheet({ open: true, category: null })}
            style={tw`rounded-full px-3 py-2 border border-dashed border-gray-300 flex-row items-center`}
          >
            <Plus size={12} color="#737373" />
            <Text style={tw`ml-1 text-xs text-gray-600`}>{t('chef.addCategory')}</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      {/* Dishes list */}
      <ScrollView contentContainerStyle={tw`px-4 pb-32 gap-3`}>
        {!activeCatId ? (
          <EmptyState title={t('chef.noCategoriesYet')} />
        ) : visibleDishes.length === 0 && !editMode ? (
          <EmptyState title={t('discover.noPublicDishesYet')} />
        ) : (
          visibleDishes.map((d) => (
            <DishCard
              key={d.id}
              dish={d}
              editMode={editMode}
              onEdit={() => setDishSheet({ open: true, dish: d })}
              onDelete={() => setDeletingDish(d)}
            />
          ))
        )}

        {editMode && activeCatId ? (
          <Pressable
            onPress={() => setDishSheet({ open: true, dish: null })}
            style={({ pressed }) => [
              tw`flex-row items-center justify-center bg-white border border-dashed border-gray-300 rounded-xl py-4`,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Plus size={14} color="#737373" />
            <Text style={tw`ml-2 text-xs text-gray-600`}>{t('chef.addDish')}</Text>
          </Pressable>
        ) : null}

        {editMode && activeCatId ? (
          <View style={tw`mt-1 flex-row gap-2`}>
            <Pressable
              onPress={() => {
                const cat = categories.find((c) => c.id === activeCatId);
                if (cat) setCategorySheet({ open: true, category: cat });
              }}
              style={tw`flex-1 px-3 py-2.5 rounded-lg border border-gray-200 items-center`}
            >
              <Text style={tw`text-xs text-gray-700`}>
                {t('common.edit')} · {categories.find((c) => c.id === activeCatId)?.name}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                const cat = categories.find((c) => c.id === activeCatId);
                if (cat) setDeletingCategory(cat);
              }}
              style={tw`px-3 py-2.5 rounded-lg border border-red-200 items-center`}
            >
              <Text style={tw`text-xs text-red-600`}>{t('common.delete')}</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      {/* Sheets / dialogs */}
      <CategorySheet
        visible={categorySheet.open}
        onClose={() => setCategorySheet({ open: false, category: null })}
        groupId={groupId}
        category={categorySheet.category}
      />
      <DishSheet
        visible={dishSheet.open}
        onClose={() => setDishSheet({ open: false, dish: null })}
        groupId={groupId}
        categoryId={activeCatId}
        dish={dishSheet.dish}
      />
      <PrivacyPasswordSheet
        visible={privacySheet.open}
        onClose={() => setPrivacySheet({ open: false, making: false })}
        groupId={groupId}
        isMakingPrivate={privacySheet.making}
      />
      <ConfirmDialog
        visible={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={onConfirmDelCategory}
        title={t('common.delete')}
        message={deletingCategory ? deletingCategory.name : undefined}
        confirmLabel={t('common.delete')}
        destructive
        loading={delCategory.isPending}
      />
      <ConfirmDialog
        visible={!!deletingDish}
        onClose={() => setDeletingDish(null)}
        onConfirm={onConfirmDelDish}
        title={t('chef.deleteDish')}
        message={
          deletingDish
            ? t('chef.deleteDishConfirm', { name: deletingDish.name })
            : undefined
        }
        confirmLabel={t('common.delete')}
        destructive
        loading={delDish.isPending}
      />
    </AppContainer>
  );
}
