import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ChefHat,
  ChevronRight,
  Lock,
  Plus,
  ThumbsUp,
  User,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Tappable } from '@/components/ui/Tappable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CarteCard } from '@/components/carte/CarteCard';
import { AddCarteSheet } from '@/components/carte/AddCarteSheet';
import { MenuGroupSheet } from '@/components/chef/MenuGroupSheet';
import { JoinKitchenSheet } from '@/components/diner/JoinKitchenSheet';
import { UsernamePrompt } from '@/components/onboarding/UsernamePrompt';
import { SketchBottomTabs } from '@/components/ui/SketchBottomTabs';
import {
  SketchBox,
  SketchCircle,
  SketchPill,
  SketchUnderline,
  SketchPhotoCircle,
} from '@/components/ui/sketch';

import { useMyCartes, type MyCarte } from '@/hooks/carte/useMyCartes';
import { useDeleteMenuGroup } from '@/hooks/chef/useMenuGroups';
import { useLeaveKitchen } from '@/hooks/diner/useLeaveKitchen';
import { useProfile } from '@/hooks/auth/useProfile';
import { useChefOrders } from '@/hooks/chef/useChefOrders';
import { useChefWishlists } from '@/hooks/wishlist/useChefWishlists';
import { useChefRecentComments } from '@/hooks/dish/useChefRecentComments';
import { showToast } from '@/components/ui/Toast';
import type { MenuGroup } from '@/types/domain';

import { palette, handFont, noteFont, titleFont, uiFont } from '@/lib/palette';
import { useResponsive } from '@/lib/responsive';

function formatToday(): string {
  const d = new Date();
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${days[d.getDay()]} · ${d.getMonth() + 1} 月 ${d.getDate()}`;
}

export default function KitchenTab() {
  const insets = useSafeAreaInsets();
  const r = useResponsive();
  const { t } = useTranslation();
  const { data: cartes, isLoading, error: cartesError } = useMyCartes();
  const { data: profile } = useProfile();
  const { data: ordersData } = useChefOrders();
  const { data: wishlistData } = useChefWishlists();
  const { data: commentsData } = useChefRecentComments(3);

  const del = useDeleteMenuGroup();
  const leave = useLeaveKitchen();

  useEffect(() => {
    if (cartesError) {
      console.warn('[useMyCartes] failed', cartesError);
      showToast.error((cartesError as Error)?.message ?? 'Failed to load cartes');
    }
  }, [cartesError]);

  const [addOpen, setAddOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [editing, setEditing] = useState<MenuGroup | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<MyCarte | null>(null);
  const [confirmingLeave, setConfirmingLeave] = useState<MyCarte | null>(null);

  const pendingOrders = useMemo(
    () =>
      (ordersData ?? []).filter(
        (o) => o.status === 'pending' || o.status === 'preparing',
      ),
    [ordersData],
  );

  const wishlistTop3 = useMemo(() => (wishlistData ?? []).slice(0, 3), [wishlistData]);
  const commentsTop3 = useMemo(() => (commentsData ?? []).slice(0, 3), [commentsData]);

  const onSwipeEdit = (c: MyCarte) => {
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

  const goProfile = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push('/profile/edit' as any);
  };

  // Tablet: cap content width and center.
  const contentPadH = r.isTablet ? Math.max(24, (r.width - r.contentMaxWidth) / 2) : r.scale(24, { min: 16, max: 28 });
  const cardPad = r.scale(18, { min: 14, max: 22 });

  return (
    <View style={{ flex: 1, backgroundColor: palette.paper }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 6,
          paddingBottom: r.scale(140, { min: 120, max: 160 }),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: contentPadH,
            paddingBottom: 8,
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text
              style={{
                fontFamily: titleFont,
                fontSize: r.fontScale(46, { min: 38, max: 56 }),
                fontWeight: '500',
                color: palette.ink,
                letterSpacing: -1,
                lineHeight: r.fontScale(46, { min: 38, max: 56 }),
                fontStyle: 'italic',
              }}
            >
              Carte
            </Text>
            <SketchUnderline
              width={r.scale(70, { min: 60, max: 84 })}
              seed={2}
              color={palette.ink}
            />
            <Text
              style={{
                fontFamily: handFont,
                fontSize: r.fontScale(18, { min: 16, max: 22 }),
                color: palette.inkSoft,
                marginTop: 6,
              }}
            >
              {formatToday()}
            </Text>
          </View>
          <Tappable feedback="press" onPress={goProfile}>
            <SketchPhotoCircle
              src={profile?.avatar_url ?? null}
              size={r.scale(46, { min: 40, max: 56 })}
              seed={3}
            />
          </Tappable>
        </View>

        <View
          style={{
            paddingHorizontal: r.isTablet ? contentPadH : r.scale(20, { min: 14, max: 24 }),
            marginTop: 12,
            gap: r.scale(16, { min: 12, max: 20 }),
          }}
        >
          {/* Pending orders block */}
          {pendingOrders.length > 0 ? (
            <Tappable
              feedback="lift"
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                router.push('/(tabs)/orders' as any);
              }}
            >
              <SketchBox radius={20} seed={1} style={{ padding: cardPad }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', gap: 6, flexShrink: 0 }}>
                    {pendingOrders.slice(0, 3).map((o, i) => (
                      <SketchPhotoCircle
                        key={o.id}
                        src={(o as any).dish_image_url ?? null}
                        size={r.scale(36, { min: 32, max: 44 })}
                        seed={i + 11}
                      />
                    ))}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={{
                        fontFamily: handFont,
                        fontSize: r.fontScale(24, { min: 20, max: 28 }),
                        color: palette.ink,
                        lineHeight: r.fontScale(26, { min: 22, max: 30 }),
                      }}
                    >
                      {pendingOrders.length} 个待制作订单
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
                      {pendingOrders
                        .slice(0, 2)
                        .map((o) => `${o.diner_username}·${o.dish_name}`)
                        .join('   ')}
                      {pendingOrders.length > 2 ? '  …' : ''}
                    </Text>
                  </View>
                  <ChevronRight size={22} color={palette.ink} strokeWidth={1.5} />
                </View>
              </SketchBox>
            </Tappable>
          ) : null}

          {/* Wishlist */}
          {wishlistTop3.length > 0 ? (
            <SketchBox radius={20} seed={2} style={{ padding: cardPad }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontFamily: handFont,
                    fontSize: 22,
                    color: palette.ink,
                    lineHeight: 22,
                  }}
                >
                  ✶ 本周愿望榜
                </Text>
                <Text
                  style={{
                    fontFamily: noteFont,
                    fontSize: 12,
                    color: palette.inkMute,
                  }}
                >
                  diners 想吃
                </Text>
              </View>
              <View style={{ gap: 10 }}>
                {wishlistTop3.map((w, i) => (
                  <Tappable
                    key={w.id}
                    feedback="press"
                    onPress={() => router.push(`/chef/group/${w.group_id}` as any)}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <SketchPill seed={i + 3}>
                        <ThumbsUp size={11} color={palette.ink} strokeWidth={1.5} />
                        <Text
                          style={{
                            fontFamily: handFont,
                            fontSize: 14,
                            color: palette.ink,
                          }}
                        >
                          {w.votes}
                        </Text>
                      </SketchPill>
                      <Text
                        style={{
                          flex: 1,
                          fontFamily: noteFont,
                          fontSize: 14,
                          color: palette.ink,
                        }}
                        numberOfLines={1}
                      >
                        {w.content}
                      </Text>
                      <Text
                        style={{
                          fontFamily: noteFont,
                          fontSize: 12,
                          color: palette.inkMute,
                          maxWidth: 100,
                        }}
                        numberOfLines={1}
                      >
                        {w.group_name}
                      </Text>
                    </View>
                  </Tappable>
                ))}
              </View>
            </SketchBox>
          ) : null}

          {/* Comments */}
          {commentsTop3.length > 0 ? (
            <SketchBox radius={20} seed={3} style={{ padding: cardPad }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontFamily: handFont,
                    fontSize: 22,
                    color: palette.ink,
                    lineHeight: 22,
                  }}
                >
                  ❝ 最新反馈
                </Text>
                <Text
                  style={{
                    fontFamily: noteFont,
                    fontSize: 12,
                    color: palette.inkMute,
                  }}
                >
                  diners 在说
                </Text>
              </View>
              <View style={{ gap: 12 }}>
                {commentsTop3.map((c, i) => (
                  <Tappable
                    key={c.id}
                    feedback="press"
                    onPress={() => router.push(`/dish/${c.dish_id}` as any)}
                  >
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <SketchPhotoCircle
                        src={c.avatar_url ?? null}
                        size={36}
                        seed={i + 5}
                      />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={{
                            fontFamily: noteFont,
                            fontSize: 13,
                            color: palette.ink,
                          }}
                          numberOfLines={1}
                        >
                          <Text style={{ fontWeight: '700' }}>{c.username}</Text>
                          <Text style={{ color: palette.inkMute }}> · </Text>
                          <Text style={{ fontStyle: 'italic' }}>{c.dish_name}</Text>
                        </Text>
                        <Text
                          style={{
                            fontFamily: noteFont,
                            fontSize: 13,
                            color: palette.inkSoft,
                            lineHeight: 19,
                            marginTop: 2,
                          }}
                          numberOfLines={2}
                        >
                          {c.content}
                        </Text>
                      </View>
                    </View>
                  </Tappable>
                ))}
              </View>
            </SketchBox>
          ) : null}

          {/* Section title: 我的 Cartes */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginTop: 12,
              marginBottom: 4,
              paddingHorizontal: 4,
            }}
          >
            <View>
              <Text
                style={{
                  fontFamily: handFont,
                  fontSize: r.fontScale(30, { min: 24, max: 36 }),
                  color: palette.ink,
                  lineHeight: r.fontScale(30, { min: 24, max: 36 }),
                }}
              >
                我的 Cartes
              </Text>
              <SketchUnderline
                width={r.scale(120, { min: 100, max: 140 })}
                seed={5}
                color={palette.ink}
              />
            </View>
            <Text
              style={{
                fontFamily: noteFont,
                fontSize: 14,
                color: palette.inkMute,
              }}
            >
              {(cartes ?? []).length} 张
            </Text>
          </View>

          {/* Carte cards */}
          {isLoading ? (
            <View style={{ paddingTop: 40, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={palette.inkSoft} />
            </View>
          ) : (cartes ?? []).length === 0 ? (
            <SketchBox radius={20} seed={4} style={{ padding: 24 }}>
              <Text
                style={{
                  fontFamily: handFont,
                  fontSize: 22,
                  color: palette.inkSoft,
                  textAlign: 'center',
                  lineHeight: 28,
                }}
              >
                还没有 carte
              </Text>
              <Text
                style={{
                  fontFamily: noteFont,
                  fontSize: 13,
                  color: palette.inkMute,
                  textAlign: 'center',
                  marginTop: 6,
                }}
              >
                点右下 + 创建你的第一张菜单{'\n'}或加入朋友的 carte
              </Text>
            </SketchBox>
          ) : (
            // Horizontal scroll: each carte is a peekable card. Width sized so
            // ~1.2 cards fit on phone (next-card peek invites swipe), capped on
            // tablets so cards don't grow absurdly wide.
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: 12,
                paddingHorizontal: 4,
                paddingVertical: 4,
              }}
              snapToInterval={r.scale(280, { min: 240, max: 360 }) + 12}
              decelerationRate="fast"
              // Negative margin lets cards bleed past the parent's
              // horizontal padding so the last card edge can sit closer to
              // the viewport right.
              style={{ marginHorizontal: -4 }}
            >
              {(cartes ?? []).map((c, i) => (
                <View
                  key={c.id}
                  style={{ width: r.scale(280, { min: 240, max: 360 }) }}
                >
                  <CarteCard
                    carte={c}
                    index={i}
                    onEdit={onSwipeEdit}
                    onDelete={(c) => setConfirmingDelete(c)}
                    onLeave={(c) => setConfirmingLeave(c)}
                  />
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* FAB sits above the bottom tab bar */}
      <View
        style={{
          position: 'absolute',
          right: r.scale(22, { min: 16, max: 32 }),
          bottom: r.scale(96, { min: 86, max: 110 }),
          zIndex: 11,
        }}
        pointerEvents="box-none"
      >
        <Tappable
          feedback="press"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            setAddOpen(true);
          }}
        >
          <View style={{ backgroundColor: palette.paper, borderRadius: 999 }}>
            <SketchCircle
              size={r.scale(60, { min: 52, max: 72 })}
              seed={7}
              strokeWidth={2}
            >
              <Plus
                size={r.scale(26, { min: 22, max: 32 })}
                color={palette.ink}
                strokeWidth={1.8}
              />
            </SketchCircle>
          </View>
        </Tappable>
      </View>

      <SketchBottomTabs active="kitchen" />

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
    </View>
  );
}
