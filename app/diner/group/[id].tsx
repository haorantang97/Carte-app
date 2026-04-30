import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { AppContainer } from '@/components/ui/AppContainer';
import { BackButton } from '@/components/ui/BackButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { DishCardCompact } from '@/components/diner/DishCardCompact';
import { CartFAB } from '@/components/diner/CartFAB';
import { CartSheet } from '@/components/diner/CartSheet';
import { WishlistSection } from '@/components/wishlist/WishlistSection';
import { useDinerMenu } from '@/hooks/diner/useDinerMenu';
import { useCart } from '@/stores/cartStore';
import { showToast } from '@/components/ui/Toast';
import tw from '@/lib/tw';

export default function DinerGroupDetails() {
  const { id, preview } = useLocalSearchParams<{ id: string; preview?: string }>();
  const groupId = id!;
  const isPreview = preview === '1';
  const { t } = useTranslation();
  const { data, isLoading, error } = useDinerMenu(groupId);
  const cart = useCart();
  const count = useCart((s) => (s.cartByGroup[groupId] ?? []).reduce((n, i) => n + i.quantity, 0));

  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [tab, setTab] = useState<'menu' | 'wishlist'>('menu');

  const categories = data?.categories ?? [];
  useEffect(() => {
    if (!activeCatId && categories[0]) setActiveCatId(categories[0].id);
  }, [activeCatId, categories]);

  const visibleDishes = useMemo(
    () => (data?.dishes ?? []).filter((d) => d.category_id === activeCatId),
    [data, activeCatId],
  );

  const onAdd = (dishId: string) => {
    const d = data?.dishes.find((x) => x.id === dishId);
    if (!d) return;
    cart.add(groupId, {
      dishId: d.id,
      dishName: d.name,
      imageUrl: d.image_url,
      price: d.price,
      quantity: 1,
    });
    showToast.success(t('diner.addedToCart'), d.name);
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

  const { group } = data;

  return (
    <AppContainer>
      <View style={tw`flex-row items-center px-4 pt-1 pb-2`}>
        <BackButton />
        <Text style={tw`flex-1 ml-2 text-xl font-semibold text-gray-900`} numberOfLines={1}>
          {group.name}
        </Text>
      </View>

      {isPreview ? (
        <View style={tw`mx-4 mb-2 px-3 py-1.5 border border-dashed border-gray-400 rounded-md items-center`}>
          <Text style={tw`text-xs text-gray-500`}>👁 以 diner 视角预览 · 返回回到编辑</Text>
        </View>
      ) : null}

      {/* Chef header card */}
      <View style={tw`px-4 pb-3`}>
        <View style={tw`flex-row items-center bg-white border border-gray-200 rounded-xl p-3`}>
          <View style={tw`w-10 h-10 rounded-full bg-gray-100 items-center justify-center overflow-hidden`}>
            {group.chef.avatar_url ? (
              <Image source={{ uri: group.chef.avatar_url }} style={tw`w-10 h-10`} contentFit="cover" />
            ) : (
              <User size={18} color="#A3A3A3" strokeWidth={1.5} />
            )}
          </View>
          <View style={tw`flex-1 ml-3`}>
            <Text style={tw`text-sm font-medium text-gray-900`}>{group.chef.username}</Text>
            <Text style={[tw`text-[11px] text-gray-500 mt-0.5`, { fontFamily: 'Menlo', letterSpacing: 1 }]}>
              {group.access_code}
            </Text>
          </View>
        </View>
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
          <WishlistSection groupId={groupId} canCompose={true} />
        </ScrollView>
      ) : (
        <>
          {/* Categories */}
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
                    setActiveCatId(c.id);
                  }}
                  style={tw.style(
                    'rounded-full px-4 py-2 border',
                    active ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-200',
                  )}
                >
                  <Text style={tw.style('text-xs font-medium', active ? 'text-white' : 'text-gray-700')}>
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Dishes */}
          <ScrollView contentContainerStyle={tw`px-4 pb-32 gap-2`}>
            {visibleDishes.length === 0 ? (
              <EmptyState title={t('discover.noPublicDishesYet')} />
            ) : (
              visibleDishes.map((d) => (
                <DishCardCompact key={d.id} dish={d} onAdd={() => onAdd(d.id)} />
              ))
            )}
          </ScrollView>
        </>
      )}

      <CartFAB count={count} onPress={() => setCartOpen(true)} />
      <CartSheet visible={cartOpen} onClose={() => setCartOpen(false)} groupId={groupId} />
    </AppContainer>
  );
}
