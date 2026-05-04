import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Tappable } from '@/components/ui/Tappable';
import { EmptyState } from '@/components/ui/EmptyState';
import { DishCardCompact } from '@/components/diner/DishCardCompact';
import { CartFAB } from '@/components/diner/CartFAB';
import { CartSheet } from '@/components/diner/CartSheet';
import { WishlistSection } from '@/components/wishlist/WishlistSection';
import {
  SketchBox,
  SketchCircle,
  SketchPill,
  SketchUnderline,
} from '@/components/ui/sketch';
import { useDinerMenu } from '@/hooks/diner/useDinerMenu';
import { useCart, type CartItem } from '@/stores/cartStore';

// Stable reference for empty cart fallback — using a fresh `[]` inline would
// cause zustand's getSnapshot to think state changed every render → loop.
const EMPTY_CART: CartItem[] = [];
import { showToast } from '@/components/ui/Toast';
import { palette, handFont, noteFont } from '@/lib/palette';
import { useResponsive } from '@/lib/responsive';

// Adaptive sidebar font sizing — mirrors Vite DinerCarteScreen.sidebarStyle.
function sidebarStyle(names: string[]): { fontSize: number; lines: 1 | 2 } {
  const maxLen = names.reduce((m, n) => Math.max(m, n.length), 0);
  if (maxLen <= 3) return { fontSize: 18, lines: 1 };
  if (maxLen <= 4) return { fontSize: 16, lines: 1 };
  if (maxLen <= 5) return { fontSize: 13, lines: 1 };
  if (maxLen <= 8) return { fontSize: 14, lines: 2 };
  return { fontSize: 13, lines: 2 };
}

export default function DinerGroupDetails() {
  const insets = useSafeAreaInsets();
  const r = useResponsive();
  const contentPadH = r.isTablet
    ? Math.max(24, (r.width - r.contentMaxWidth) / 2)
    : r.scale(20, { min: 14, max: 28 });
  // Sidebar widens on larger screens — 78px is tight on small phones, generous on tablets.
  const sidebarW = r.scale(78, { min: 68, max: 110 });
  const { id, preview } = useLocalSearchParams<{ id: string; preview?: string }>();
  const groupId = id!;
  const isPreview = preview === '1';
  const { t } = useTranslation();
  const { data, isLoading, error } = useDinerMenu(groupId);
  // ⚠️ Two zustand subtleties to avoid infinite re-render:
  //  1. Subscribe to actions individually — calling `useCart()` with no
  //     selector returns the whole store object whose reference can change.
  //  2. Selector that returns `?? []` allocates a fresh array each render →
  //     zustand sees "new value" and re-runs forever. Subscribe to the raw
  //     value, fall back outside.
  const addToCart = useCart((s) => s.add);
  const setCartQty = useCart((s) => s.setQuantity);
  const cartItemsRaw = useCart((s) => s.cartByGroup[groupId]);
  const cartItems = cartItemsRaw ?? EMPTY_CART;
  const cartCount = useMemo(
    () => cartItems.reduce((n, i) => n + i.quantity, 0),
    [cartItems],
  );

  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [tab, setTab] = useState<'menu' | 'wishlist'>('menu');

  const categories = data?.categories ?? [];
  const categoryNames = categories.map((c) => c.name);
  const sb = sidebarStyle(categoryNames);

  useEffect(() => {
    if (!activeCatId && categories[0]) setActiveCatId(categories[0].id);
  }, [activeCatId, categories]);

  const visibleDishes = useMemo(
    () => (data?.dishes ?? []).filter((d) => d.category_id === activeCatId),
    [data, activeCatId],
  );

  const wishlistCount = (data as any)?.wishlistCount ?? 0;
  const totalDishCount = (data?.dishes ?? []).length;

  const onAdd = (dishId: string) => {
    const d = data?.dishes.find((x) => x.id === dishId);
    if (!d) return;
    addToCart(groupId, {
      dishId: d.id,
      dishName: d.name,
      imageUrl: d.image_url,
      price: d.price,
      quantity: 1,
    });
    showToast.success(t('diner.addedToCart'), d.name);
  };

  const onIncrement = (dishId: string) => {
    const d = data?.dishes.find((x) => x.id === dishId);
    if (!d) return;
    addToCart(groupId, {
      dishId: d.id,
      dishName: d.name,
      imageUrl: d.image_url,
      price: d.price,
      quantity: 1,
    });
  };
  const onDecrement = (dishId: string) => {
    const cur = cartItems.find((c) => c.dishId === dishId)?.quantity ?? 0;
    if (cur > 0) setCartQty(groupId, dishId, cur - 1);
  };

  const getQty = (dishId: string) =>
    cartItems.find((c) => c.dishId === dishId)?.quantity ?? 0;

  const handleBack = () => {
    router.back();
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
          <Tappable feedback="press" onPress={handleBack}>
            <SketchCircle size={40} seed={1}>
              <ArrowLeft size={18} color={palette.ink} strokeWidth={1.5} />
            </SketchCircle>
          </Tappable>
        </View>
        <EmptyState title={t('diner.menuNotFound')} />
      </View>
    );
  }

  const { group } = data;

  return (
    <View style={{ flex: 1, backgroundColor: palette.paper }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: 140,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: contentPadH,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Tappable feedback="press" onPress={handleBack}>
            <SketchCircle size={r.scale(40, { min: 36, max: 48 })} seed={1}>
              <ArrowLeft size={18} color={palette.ink} strokeWidth={1.5} />
            </SketchCircle>
          </Tappable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                fontFamily: handFont,
                fontSize: r.fontScale(32, { min: 26, max: 38 }),
                color: palette.ink,
                lineHeight: r.fontScale(34, { min: 28, max: 40 }),
              }}
              numberOfLines={1}
            >
              {group.name}
            </Text>
            <Text
              style={{
                fontFamily: noteFont,
                fontSize: 13,
                color: palette.inkSoft,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {group.chef.username} 的 carte
            </Text>
          </View>
        </View>

        {/* Preview banner */}
        {isPreview ? (
          <View
            style={{
              marginHorizontal: contentPadH,
              marginTop: 8,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderWidth: 1.5,
              borderColor: palette.inkSoft,
              borderStyle: 'dashed',
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                fontFamily: noteFont,
                fontSize: 12,
                color: palette.inkSoft,
                textAlign: 'center',
              }}
            >
              👁 以 diner 视角预览 · 点 ← 返回编辑
            </Text>
          </View>
        ) : null}

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
            <WishlistSection groupId={groupId} canCompose={true} />
          </View>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              marginTop: 20,
              paddingHorizontal: contentPadH,
              gap: 12,
            }}
          >
            {/* Sidebar */}
            <View style={{ width: sidebarW, gap: 8, flexShrink: 0 }}>
              {categories.map((c, i) => {
                const isActive = c.id === activeCatId;
                return (
                  <Tappable
                    key={c.id}
                    feedback="press"
                    onPress={() => setActiveCatId(c.id)}
                  >
                    <SketchBox
                      radius={12}
                      seed={i + 4}
                      strokeWidth={isActive ? 2 : 1.5}
                      fillColor={palette.paper}
                      style={{ paddingVertical: 12, paddingHorizontal: 4 }}
                    >
                      <Text
                        style={{
                          textAlign: 'center',
                          fontFamily: handFont,
                          fontSize: sb.fontSize,
                          color: palette.ink,
                          fontWeight: isActive ? '700' : '400',
                          lineHeight: sb.lines === 2 ? sb.fontSize * 1.15 : sb.fontSize,
                        }}
                        numberOfLines={sb.lines}
                      >
                        {c.name}
                      </Text>
                      {isActive ? (
                        <View style={{ alignItems: 'center', marginTop: 2 }}>
                          <SketchUnderline width={28} seed={i + 1} />
                        </View>
                      ) : null}
                    </SketchBox>
                  </Tappable>
                );
              })}
            </View>

            {/* Dish list */}
            <View style={{ flex: 1, gap: 12, minWidth: 0 }}>
              {visibleDishes.length === 0 ? (
                <EmptyState title={t('discover.noPublicDishesYet')} />
              ) : (
                visibleDishes.map((d, i) => (
                  <DishCardCompact
                    key={d.id}
                    dish={d}
                    index={i}
                    qty={getQty(d.id)}
                    onAdd={() => onAdd(d.id)}
                    onIncrement={() => onIncrement(d.id)}
                    onDecrement={() => onDecrement(d.id)}
                  />
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <CartFAB count={cartCount} onPress={() => setCartOpen(true)} />
      <CartSheet visible={cartOpen} onClose={() => setCartOpen(false)} groupId={groupId} />
    </View>
  );
}
