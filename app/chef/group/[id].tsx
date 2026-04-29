import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { AppContainer } from '@/components/ui/AppContainer';
import { BackButton } from '@/components/ui/BackButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CategorySheet } from '@/components/chef/CategorySheet';
import { DishCard } from '@/components/chef/DishCard';
import { DishSheet, type DishSheetMode, type DishPrefill } from '@/components/chef/DishSheet';
import { AddDishMethodSheet } from '@/components/chef/AddDishMethodSheet';
import { SmartFillSheet } from '@/components/chef/SmartFillSheet';
import { WishlistSection } from '@/components/wishlist/WishlistSection';
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

  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [tab, setTab] = useState<'menu' | 'wishlist'>('menu');

  const [categorySheet, setCategorySheet] = useState<{ open: boolean; category: Category | null }>(
    { open: false, category: null },
  );
  const [dishSheet, setDishSheet] = useState<{
    open: boolean;
    dish: Dish | null;
    mode: DishSheetMode;
    prefill: DishPrefill | null;
  }>({ open: false, dish: null, mode: 'manual', prefill: null });
  const [methodPickerOpen, setMethodPickerOpen] = useState(false);
  const [smartFillStandaloneOpen, setSmartFillStandaloneOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deletingDish, setDeletingDish] = useState<Dish | null>(null);

  const categories = data?.categories ?? [];
  const dishes = data?.dishes ?? [];

  const activeCatId = selectedCatId ?? categories[0]?.id ?? null;
  const activeCat = useMemo(
    () => categories.find((c) => c.id === activeCatId) ?? null,
    [categories, activeCatId],
  );
  const visibleDishes = useMemo(
    () => dishes.filter((d) => d.category_id === activeCatId),
    [dishes, activeCatId],
  );

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
      </View>

      {/* Code row */}
      <View style={tw`px-4 pb-3 flex-row items-center`}>
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

      {/* Top section toggle: 菜单 / 愿望 */}
      <View style={tw`px-4 pb-3 flex-row gap-2`}>
        {(['menu', 'wishlist'] as const).map((k) => {
          const active = k === tab;
          return (
            <Pressable
              key={k}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setTab(k);
              }}
              style={tw.style(
                'flex-1 py-2 rounded-full items-center',
                active ? 'bg-gray-900' : 'bg-white border border-gray-200',
              )}
            >
              <Text
                style={tw.style(
                  'text-xs font-medium',
                  active ? 'text-white' : 'text-gray-700',
                )}
              >
                {k === 'menu' ? t('chef.dishes') : t('chef.wishlist')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {tab === 'wishlist' ? (
        <ScrollView contentContainerStyle={tw`px-4 pb-32`}>
          <WishlistSection groupId={groupId} canCompose={false} />
        </ScrollView>
      ) : (
        <>
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
        <Pressable
          onPress={() => setCategorySheet({ open: true, category: null })}
          style={tw`rounded-full px-3 py-2 border border-dashed border-gray-300 flex-row items-center`}
        >
          <Plus size={12} color="#737373" />
          <Text style={tw`ml-1 text-xs text-gray-600`}>{t('chef.addCategory')}</Text>
        </Pressable>
      </ScrollView>

      {/* Active-category controls (always visible) */}
      {activeCat ? (
        <View style={tw`px-4 pb-2 flex-row gap-2`}>
          <Pressable
            onPress={() => setCategorySheet({ open: true, category: activeCat })}
            style={tw`flex-row items-center px-3 py-1.5 rounded-full bg-gray-100`}
          >
            <Pencil size={11} color="#525252" />
            <Text style={tw`ml-1 text-[11px] text-gray-700`}>{t('common.edit')}</Text>
          </Pressable>
          <Pressable
            onPress={() => setDeletingCategory(activeCat)}
            style={tw`flex-row items-center px-3 py-1.5 rounded-full bg-red-50`}
          >
            <Trash2 size={11} color="#A30000" />
            <Text style={tw`ml-1 text-[11px] text-red-700`}>{t('common.delete')}</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Dishes list */}
      <ScrollView contentContainerStyle={tw`px-4 pb-32 gap-3`}>
        {!activeCatId ? (
          <EmptyState title={t('chef.noCategoriesYet')} />
        ) : visibleDishes.length === 0 ? (
          <EmptyState title={t('discover.noPublicDishesYet')} />
        ) : (
          visibleDishes.map((d) => (
            <DishCard
              key={d.id}
              dish={d}
              onEdit={() =>
                setDishSheet({ open: true, dish: d, mode: 'manual', prefill: null })
              }
              onDelete={() => setDeletingDish(d)}
            />
          ))
        )}

        {activeCatId ? (
          <Pressable
            onPress={() => setMethodPickerOpen(true)}
            style={({ pressed }) => [
              tw`flex-row items-center justify-center bg-white border border-dashed border-gray-300 rounded-xl py-4`,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Plus size={14} color="#737373" />
            <Text style={tw`ml-2 text-xs text-gray-600`}>{t('chef.addDish')}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
        </>
      )}

      <CategorySheet
        visible={categorySheet.open}
        onClose={() => setCategorySheet({ open: false, category: null })}
        groupId={groupId}
        category={categorySheet.category}
      />
      <DishSheet
        visible={dishSheet.open}
        onClose={() => setDishSheet({ open: false, dish: null, mode: 'manual', prefill: null })}
        groupId={groupId}
        categoryId={activeCatId}
        dish={dishSheet.dish}
        mode={dishSheet.mode}
        prefill={dishSheet.prefill}
      />

      {/* + 添加菜品 → 弹方式选择 sheet */}
      <AddDishMethodSheet
        visible={methodPickerOpen}
        onClose={() => setMethodPickerOpen(false)}
        onPickManual={() =>
          setDishSheet({ open: true, dish: null, mode: 'manual', prefill: null })
        }
        onPickSmart={() => setSmartFillStandaloneOpen(true)}
      />

      {/* AI 整理路径(独立 sheet,完成后跳到 DishSheet 预览) */}
      <SmartFillSheet
        visible={smartFillStandaloneOpen}
        onClose={() => setSmartFillStandaloneOpen(false)}
        onExtracted={(fields) =>
          setDishSheet({
            open: true,
            dish: null,
            mode: 'smart_review',
            prefill: {
              name: fields.name,
              description: fields.description,
              ingredients: fields.ingredients,
              recipe: fields.recipe,
            },
          })
        }
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
