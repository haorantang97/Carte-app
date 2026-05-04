import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Eye, Lock, Pencil, Plus, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Tappable } from '@/components/ui/Tappable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CategorySheet } from '@/components/chef/CategorySheet';
import { DishCard } from '@/components/chef/DishCard';
import {
  DishSheet,
  type DishSheetMode,
  type DishPrefill,
} from '@/components/chef/DishSheet';
import { AddDishMethodSheet } from '@/components/chef/AddDishMethodSheet';
import { AILimitSheet } from '@/components/chef/AILimitSheet';
import { SmartFillSheet } from '@/components/chef/SmartFillSheet';
import { WishlistSection } from '@/components/wishlist/WishlistSection';
import { showToast } from '@/components/ui/Toast';
import {
  SketchBox,
  SketchCircle,
  SketchPill,
} from '@/components/ui/sketch';

import { useAiQuota } from '@/hooks/useAiQuota';
import { useChefGroupDetails } from '@/hooks/chef/useChefGroupDetails';
import { useDeleteCategory } from '@/hooks/chef/useCategoryMutations';
import { useDeleteDish } from '@/hooks/chef/useDishMutations';
import { useRetryExtractDish } from '@/hooks/storage/useStartExtractDish';
import { useRealtimeDishes } from '@/hooks/realtime/useRealtimeDishes';
import { supabase } from '@/lib/supabase';

import { palette, handFont, noteFont, uiFont } from '@/lib/palette';
import { useResponsive } from '@/lib/responsive';
import type { Category, Dish } from '@/types/domain';

export default function ChefGroupDetails() {
  const insets = useSafeAreaInsets();
  const r = useResponsive();
  const contentPadH = r.isTablet
    ? Math.max(24, (r.width - r.contentMaxWidth) / 2)
    : r.scale(20, { min: 14, max: 28 });
  // Tablet shows 3-col dish grid; phones stay 2-col.
  const dishCols = r.isTablet ? 3 : 2;
  const dishColWidth = `${(100 - (dishCols - 1) * 2) / dishCols}%` as const;
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = id!;
  const { t } = useTranslation();
  const { data, isLoading, error } = useChefGroupDetails(groupId);
  const delCategory = useDeleteCategory(groupId);
  const delDish = useDeleteDish(groupId);
  const retry = useRetryExtractDish();
  useRealtimeDishes(groupId);
  useMemo(() => {
    void supabase.rpc('sweep_stuck_extractions');
  }, [groupId]);

  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [tab, setTab] = useState<'menu' | 'wishlist'>('menu');

  const [categorySheet, setCategorySheet] = useState<{
    open: boolean;
    category: Category | null;
  }>({ open: false, category: null });
  const [dishSheet, setDishSheet] = useState<{
    open: boolean;
    dish: Dish | null;
    mode: DishSheetMode;
    prefill: DishPrefill | null;
  }>({ open: false, dish: null, mode: 'manual', prefill: null });
  const [methodPickerOpen, setMethodPickerOpen] = useState(false);
  const [smartFillStandaloneOpen, setSmartFillStandaloneOpen] = useState(false);
  const [aiLimitOpen, setAiLimitOpen] = useState(false);
  const aiQuota = useAiQuota();
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
  const totalDishCount = dishes.length;
  const wishlistCount = (data as any)?.wishlistCount ?? 0;

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
      <View
        style={{
          flex: 1,
          backgroundColor: palette.paper,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="small" color={palette.inkSoft} />
      </View>
    );
  }
  if (error || !data) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.paper, paddingTop: insets.top }}>
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingTop: 12 }}>
          <Tappable feedback="press" onPress={() => router.back()}>
            <SketchCircle size={40} seed={1}>
              <ArrowLeft size={18} color={palette.ink} strokeWidth={1.5} />
            </SketchCircle>
          </Tappable>
        </View>
        <EmptyState title={t('diner.menuNotFound')} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.paper }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: contentPadH,
            paddingBottom: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Tappable feedback="press" onPress={() => router.back()}>
            <SketchCircle size={r.scale(40, { min: 36, max: 48 })} seed={1}>
              <ArrowLeft size={18} color={palette.ink} strokeWidth={1.5} />
            </SketchCircle>
          </Tappable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: handFont,
                  fontSize: r.fontScale(30, { min: 24, max: 36 }),
                  color: palette.ink,
                  lineHeight: r.fontScale(32, { min: 26, max: 38 }),
                  flexShrink: 1,
                }}
                numberOfLines={1}
              >
                {data.group.name}
              </Text>
              {data.group.is_private ? (
                <Lock size={16} color={palette.inkSoft} strokeWidth={1.5} />
              ) : null}
            </View>
            <Text
              style={{
                fontFamily: uiFont,
                fontSize: 12,
                color: palette.inkMute,
                letterSpacing: 2.5,
                marginTop: 2,
              }}
            >
              {data.group.access_code} · 长按复制
            </Text>
          </View>
          <Tappable
            feedback="press"
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              router.push({
                pathname: '/diner/group/[id]',
                params: { id: groupId, preview: '1' },
              } as any);
            }}
          >
            <SketchPill seed={20} style={{ paddingTop: 4, paddingBottom: 4 }}>
              <Eye size={12} color={palette.ink} strokeWidth={1.5} />
              <Text style={{ fontFamily: handFont, fontSize: 12, color: palette.ink }}>
                预览
              </Text>
            </SketchPill>
          </Tappable>
        </View>

        {/* Tab toggle */}
        <View
          style={{
            paddingHorizontal: contentPadH,
            marginTop: 12,
            flexDirection: 'row',
            gap: 8,
          }}
        >
          <Tappable feedback="press" onPress={() => setTab('menu')}>
            <SketchPill active={tab === 'menu'} seed={2}>
              <Text
                style={{
                  fontFamily: handFont,
                  fontSize: 16,
                  color: palette.ink,
                  fontWeight: tab === 'menu' ? '700' : '400',
                }}
              >
                菜品 · {totalDishCount}
              </Text>
            </SketchPill>
          </Tappable>
          <Tappable feedback="press" onPress={() => setTab('wishlist')}>
            <SketchPill active={tab === 'wishlist'} seed={3}>
              <Text
                style={{
                  fontFamily: handFont,
                  fontSize: 16,
                  color: palette.ink,
                  fontWeight: tab === 'wishlist' ? '700' : '400',
                }}
              >
                ✶ 愿望清单{wishlistCount > 0 ? ` · ${wishlistCount}` : ''}
              </Text>
            </SketchPill>
          </Tappable>
        </View>

        {tab === 'wishlist' ? (
          <View style={{ paddingHorizontal: contentPadH, paddingTop: 16 }}>
            <WishlistSection groupId={groupId} canCompose={false} />
          </View>
        ) : (
          <>
            {/* Categories */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: contentPadH, gap: 8, marginTop: 16 }}
            >
              {categories.map((c, i) => (
                <Tappable
                  key={c.id}
                  feedback="press"
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setSelectedCatId(c.id);
                  }}
                  onLongPress={() =>
                    setCategorySheet({ open: true, category: c })
                  }
                >
                  <SketchPill active={c.id === activeCatId} seed={i + 4}>
                    <Text
                      style={{
                        fontFamily: handFont,
                        fontSize: 14,
                        color: palette.ink,
                        fontWeight: c.id === activeCatId ? '700' : '400',
                      }}
                    >
                      {c.name}
                    </Text>
                  </SketchPill>
                </Tappable>
              ))}
              <Tappable
                feedback="press"
                onPress={() => setCategorySheet({ open: true, category: null })}
              >
                <SketchPill seed={9}>
                  <Plus size={12} color={palette.ink} strokeWidth={1.5} />
                  <Text style={{ fontFamily: handFont, fontSize: 14, color: palette.ink }}>
                    添加分类
                  </Text>
                </SketchPill>
              </Tappable>
            </ScrollView>

            {/* Active category controls */}
            {activeCat ? (
              <View
                style={{
                  paddingHorizontal: contentPadH,
                  marginTop: 10,
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                <Tappable
                  feedback="press"
                  onPress={() => setCategorySheet({ open: true, category: activeCat })}
                >
                  <SketchPill seed={30} style={{ paddingTop: 3, paddingBottom: 3 }}>
                    <Pencil size={11} color={palette.ink} strokeWidth={1.5} />
                    <Text style={{ fontFamily: handFont, fontSize: 12, color: palette.ink }}>
                      {t('common.edit')}
                    </Text>
                  </SketchPill>
                </Tappable>
                <Tappable feedback="press" onPress={() => setDeletingCategory(activeCat)}>
                  <SketchPill
                    seed={31}
                    color={palette.destructive}
                    style={{ paddingTop: 3, paddingBottom: 3 }}
                  >
                    <Trash2 size={11} color={palette.destructive} strokeWidth={1.5} />
                    <Text style={{ fontFamily: handFont, fontSize: 12, color: palette.destructive }}>
                      {t('common.delete')}
                    </Text>
                  </SketchPill>
                </Tappable>
              </View>
            ) : null}

            {/* Dishes grid (2 col phone, 3 col tablet) */}
            <View style={{ paddingHorizontal: contentPadH, marginTop: 16 }}>
              {!activeCatId ? (
                <EmptyState title={t('chef.noCategoriesYet')} />
              ) : visibleDishes.length === 0 ? (
                <View style={{ paddingTop: 12 }}>
                  <Text
                    style={{
                      fontFamily: handFont,
                      fontSize: 18,
                      color: palette.inkSoft,
                      textAlign: 'center',
                    }}
                  >
                    还没有菜品
                  </Text>
                  <Text
                    style={{
                      fontFamily: noteFont,
                      fontSize: 12,
                      color: palette.inkMute,
                      textAlign: 'center',
                      marginTop: 4,
                    }}
                  >
                    点下方「添加菜品」开始
                  </Text>
                </View>
              ) : (
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  {visibleDishes.map((d, i) => (
                    <View key={d.id} style={{ width: dishColWidth }}>
                      <DishCard
                        dish={d}
                        index={i}
                        onEdit={() =>
                          setDishSheet({
                            open: true,
                            dish: d,
                            mode: 'manual',
                            prefill: null,
                          })
                        }
                        onDelete={() => setDeletingDish(d)}
                        onRetry={
                          d.extract_status === 'error'
                            ? () => retry.mutate({ dishId: d.id, groupId })
                            : undefined
                        }
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Sticky CTA */}
      {tab === 'menu' && activeCatId ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
          }}
          pointerEvents="box-none"
        >
          <LinearGradient
            colors={['rgba(255,255,255,0)', '#FFFFFF']}
            locations={[0, 0.4]}
            style={{
              paddingTop: 12,
              paddingBottom: insets.bottom + 16,
              paddingHorizontal: contentPadH,
            }}
          >
            <Tappable feedback="press" onPress={() => setMethodPickerOpen(true)}>
              <SketchBox
                radius={999}
                seed={8}
                strokeWidth={2}
                fillColor={palette.paper}
                style={{ paddingVertical: 12 }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Plus size={20} color={palette.ink} strokeWidth={1.6} />
                  <Text
                    style={{
                      fontFamily: handFont,
                      fontSize: 22,
                      color: palette.ink,
                      fontWeight: '700',
                    }}
                  >
                    添加菜品
                  </Text>
                </View>
              </SketchBox>
            </Tappable>
          </LinearGradient>
        </View>
      ) : null}

      <CategorySheet
        visible={categorySheet.open}
        onClose={() => setCategorySheet({ open: false, category: null })}
        groupId={groupId}
        category={categorySheet.category}
      />
      <DishSheet
        visible={dishSheet.open}
        onClose={() =>
          setDishSheet({ open: false, dish: null, mode: 'manual', prefill: null })
        }
        groupId={groupId}
        categoryId={activeCatId}
        dish={dishSheet.dish}
        mode={dishSheet.mode}
        prefill={dishSheet.prefill}
      />
      <AddDishMethodSheet
        visible={methodPickerOpen}
        onClose={() => setMethodPickerOpen(false)}
        onPickManual={() =>
          setDishSheet({ open: true, dish: null, mode: 'manual', prefill: null })
        }
        onPickSmart={() => {
          if (aiQuota.isExceeded) setAiLimitOpen(true);
          else setSmartFillStandaloneOpen(true);
        }}
      />
      <AILimitSheet
        visible={aiLimitOpen}
        onClose={() => setAiLimitOpen(false)}
        onPickManual={() =>
          setDishSheet({ open: true, dish: null, mode: 'manual', prefill: null })
        }
      />
      <SmartFillSheet
        visible={smartFillStandaloneOpen}
        onClose={() => setSmartFillStandaloneOpen(false)}
        groupId={groupId}
        categoryId={activeCatId}
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
    </View>
  );
}
