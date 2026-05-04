import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ThumbsUp, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Tappable } from '@/components/ui/Tappable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { showToast } from '@/components/ui/Toast';
import { SketchBottomTabs } from '@/components/ui/SketchBottomTabs';
import {
  SketchBox,
  SketchPill,
  SketchUnderline,
  SketchPhoto,
  SketchPhotoCircle,
} from '@/components/ui/sketch';

import {
  useChefOrders,
  useDeleteOrder,
  useUpdateOrderStatus,
  nextStatus,
} from '@/hooks/chef/useChefOrders';
import { useChefOrderHistory } from '@/hooks/chef/useChefOrderHistory';
import { useChefRecentComments } from '@/hooks/dish/useChefRecentComments';
import { useChefWishlists } from '@/hooks/wishlist/useChefWishlists';
import { useMenuGroups } from '@/hooks/chef/useMenuGroups';
import { useRealtimeOrders } from '@/hooks/realtime/useRealtimeOrders';

import { palette, handFont, noteFont, titleFont } from '@/lib/palette';
import { useResponsive } from '@/lib/responsive';
import type { OrderStatus } from '@/types/domain';

type Section = 'orders' | 'wishlist' | 'feedback' | 'history';

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'orders', label: '订单' },
  { key: 'wishlist', label: '愿望' },
  { key: 'feedback', label: '反馈' },
  { key: 'history', label: '历史' },
];

const ALL_CARTE = '__all__';

function statusLabel(s: OrderStatus): string {
  switch (s) {
    case 'pending':
      return '待开始';
    case 'preparing':
      return '制作中';
    case 'ready':
      return '可取';
    case 'completed':
      return '已完成';
    case 'cancelled':
      return '已取消';
    default:
      return s;
  }
}

function nextStatusLabel(s: OrderStatus): string {
  switch (s) {
    case 'preparing':
      return '开始制作';
    case 'ready':
      return '可取';
    case 'completed':
      return '完成';
    default:
      return '推进';
  }
}

export default function OrdersTab() {
  const insets = useSafeAreaInsets();
  const r = useResponsive();
  const contentPadH = r.isTablet
    ? Math.max(24, (r.width - r.contentMaxWidth) / 2)
    : r.scale(20, { min: 14, max: 28 });
  const [section, setSection] = useState<Section>('orders');
  const [carteFilter, setCarteFilter] = useState<string>(ALL_CARTE);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const groups = useMenuGroups();
  const orders = useChefOrders();
  const wishlist = useChefWishlists();
  const feedback = useChefRecentComments(20);
  const history = useChefOrderHistory(50);
  const update = useUpdateOrderStatus();
  const del = useDeleteOrder();

  const groupIds = useMemo(
    () => Array.from(new Set((orders.data ?? []).map((o) => o.menu_group_id))),
    [orders.data],
  );
  useRealtimeOrders(groupIds);

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

  const filteredOrders = useMemo(
    () =>
      (orders.data ?? []).filter(
        (o) => carteFilter === ALL_CARTE || o.menu_group_id === carteFilter,
      ),
    [orders.data, carteFilter],
  );
  const filteredWishlist = useMemo(
    () =>
      (wishlist.data ?? []).filter(
        (w) => carteFilter === ALL_CARTE || w.group_id === carteFilter,
      ),
    [wishlist.data, carteFilter],
  );
  const filteredFeedback = useMemo(
    () =>
      (feedback.data ?? []).filter((c) => {
        if (carteFilter === ALL_CARTE) return true;
        const g = groups.data?.find((g) => g.id === carteFilter);
        return g ? c.group_name === g.name : true;
      }),
    [feedback.data, groups.data, carteFilter],
  );
  const filteredHistory = useMemo(
    () =>
      (history.data ?? []).filter(
        (o) => carteFilter === ALL_CARTE || o.menu_group_id === carteFilter,
      ),
    [history.data, carteFilter],
  );

  const isLoading =
    section === 'orders'
      ? orders.isLoading
      : section === 'wishlist'
        ? wishlist.isLoading
        : section === 'feedback'
          ? feedback.isLoading
          : history.isLoading;

  return (
    <View style={{ flex: 1, backgroundColor: palette.paper }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: 140,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: contentPadH, paddingBottom: 8 }}>
          <Text
            style={{
              fontFamily: handFont,
              fontSize: r.fontScale(36, { min: 30, max: 42 }),
              color: palette.ink,
              lineHeight: r.fontScale(36, { min: 30, max: 42 }),
            }}
          >
            后厨
          </Text>
          <SketchUnderline
            width={r.scale(70, { min: 60, max: 84 })}
            seed={1}
            color={palette.ink}
          />
        </View>

        {/* Section sub-tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: contentPadH, gap: 8, marginTop: 12 }}
        >
          {SECTIONS.map((s, i) => (
            <Tappable
              key={s.key}
              feedback="press"
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setSection(s.key);
              }}
            >
              <SketchPill active={section === s.key} seed={i + 2}>
                <Text
                  style={{
                    fontFamily: handFont,
                    fontSize: 15,
                    color: palette.ink,
                    fontWeight: section === s.key ? '700' : '400',
                  }}
                >
                  {s.label}
                </Text>
              </SketchPill>
            </Tappable>
          ))}
        </ScrollView>

        {/* Carte filter chip row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: contentPadH, gap: 8, marginTop: 8 }}
        >
          <Tappable feedback="press" onPress={() => setCarteFilter(ALL_CARTE)}>
            <SketchPill
              active={carteFilter === ALL_CARTE}
              seed={11}
              style={{ paddingTop: 3, paddingBottom: 3 }}
            >
              <Text
                style={{
                  fontFamily: handFont,
                  fontSize: 12,
                  color: palette.ink,
                  fontWeight: carteFilter === ALL_CARTE ? '700' : '400',
                }}
              >
                全部 carte
              </Text>
            </SketchPill>
          </Tappable>
          {(groups.data ?? []).map((g, i) => (
            <Tappable key={g.id} feedback="press" onPress={() => setCarteFilter(g.id)}>
              <SketchPill
                active={carteFilter === g.id}
                seed={i + 13}
                style={{ paddingTop: 3, paddingBottom: 3 }}
              >
                <Text
                  style={{
                    fontFamily: handFont,
                    fontSize: 12,
                    color: palette.ink,
                    fontWeight: carteFilter === g.id ? '700' : '400',
                  }}
                >
                  {g.name}
                </Text>
              </SketchPill>
            </Tappable>
          ))}
        </ScrollView>

        {/* Body */}
        <View style={{ paddingHorizontal: contentPadH, marginTop: 16, gap: 12 }}>
          {isLoading ? (
            <View style={{ paddingTop: 40, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={palette.inkSoft} />
            </View>
          ) : section === 'orders' ? (
            filteredOrders.length === 0 ? (
              <EmptyState title="暂无活跃订单" />
            ) : (
              filteredOrders.map((o, i) => {
                const next = nextStatus(o.status);
                return (
                  <Tappable
                    key={o.id}
                    feedback="press"
                    onLongPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
                        () => {},
                      );
                      setDeletingId(o.id);
                    }}
                  >
                  <SketchBox radius={16} seed={i + 4} style={{ padding: 12 }}>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <SketchPhoto
                        src={o.dish_image_url ?? null}
                        radius={10}
                        seed={i + 9}
                        style={{ width: 70, height: 70, flexShrink: 0 }}
                      />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 8,
                          }}
                        >
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text
                              style={{
                                fontFamily: handFont,
                                fontSize: 20,
                                color: palette.ink,
                                lineHeight: 21,
                              }}
                              numberOfLines={1}
                            >
                              {o.dish_name} ×{o.quantity}
                            </Text>
                            <Text
                              style={{
                                fontFamily: noteFont,
                                fontSize: 12,
                                color: palette.inkSoft,
                                marginTop: 2,
                              }}
                              numberOfLines={1}
                            >
                              {o.diner_username} · {o.group_name}
                            </Text>
                          </View>
                          {next ? (
                            <Tappable
                              feedback="press"
                              disabled={update.isPending}
                              onPress={() => onAdvance(o.id, next)}
                            >
                              <SketchPill
                                seed={i + 7}
                                style={{ paddingTop: 3, paddingBottom: 3 }}
                              >
                                <Text
                                  style={{
                                    fontFamily: handFont,
                                    fontSize: 12,
                                    color: update.isPending
                                      ? palette.inkMute
                                      : palette.ink,
                                  }}
                                >
                                  {nextStatusLabel(next)}
                                </Text>
                              </SketchPill>
                            </Tappable>
                          ) : (
                            <SketchPill
                              seed={i + 7}
                              style={{ paddingTop: 3, paddingBottom: 3 }}
                            >
                              <Text
                                style={{
                                  fontFamily: handFont,
                                  fontSize: 12,
                                  color: palette.inkSoft,
                                }}
                              >
                                {statusLabel(o.status)}
                              </Text>
                            </SketchPill>
                          )}
                        </View>
                        <View
                          style={{
                            marginTop: 8,
                            flexDirection: 'row',
                            alignItems: 'baseline',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: titleFont,
                              fontStyle: 'italic',
                              fontSize: 18,
                              color: palette.ink,
                            }}
                          >
                            ¥{o.price_at_order}
                          </Text>
                          <Text
                            style={{
                              fontFamily: noteFont,
                              fontSize: 11,
                              color: palette.inkMute,
                            }}
                          >
                            长按可删除
                          </Text>
                        </View>
                      </View>
                    </View>
                  </SketchBox>
                  </Tappable>
                );
              })
            )
          ) : section === 'wishlist' ? (
            filteredWishlist.length === 0 ? (
              <EmptyState title="还没有 diner 投愿望" />
            ) : (
              filteredWishlist.map((w, i) => (
                <SketchBox key={w.id} radius={16} seed={i + 4} style={{ padding: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <SketchPill seed={i + 3} style={{ paddingTop: 3, paddingBottom: 3 }}>
                      <ThumbsUp size={12} color={palette.ink} strokeWidth={1.5} />
                      <Text
                        style={{
                          fontFamily: handFont,
                          fontSize: 13,
                          color: palette.ink,
                        }}
                      >
                        {w.votes}
                      </Text>
                    </SketchPill>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={{
                          fontFamily: handFont,
                          fontSize: 18,
                          color: palette.ink,
                          lineHeight: 20,
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
                          marginTop: 2,
                        }}
                        numberOfLines={1}
                      >
                        {w.requester_username} · {w.group_name}
                      </Text>
                    </View>
                  </View>
                </SketchBox>
              ))
            )
          ) : section === 'feedback' ? (
            filteredFeedback.length === 0 ? (
              <EmptyState title="还没有 diner 留言" />
            ) : (
              filteredFeedback.map((c, i) => (
                <Tappable
                  key={c.id}
                  feedback="press"
                  onPress={() => router.push(`/dish/${c.dish_id}` as any)}
                >
                  <SketchBox radius={16} seed={i + 4} style={{ padding: 14 }}>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <SketchPhotoCircle
                        src={c.avatar_url ?? null}
                        size={40}
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
                            marginTop: 4,
                          }}
                          numberOfLines={3}
                        >
                          {c.content}
                        </Text>
                        <Text
                          style={{
                            fontFamily: noteFont,
                            fontSize: 11,
                            color: palette.inkMute,
                            marginTop: 4,
                          }}
                        >
                          {c.group_name}
                        </Text>
                      </View>
                    </View>
                  </SketchBox>
                </Tappable>
              ))
            )
          ) : (
            // history
            filteredHistory.length === 0 ? (
              <EmptyState title="暂无历史订单" />
            ) : (
              filteredHistory.map((o, i) => (
                <SketchBox key={o.id} radius={16} seed={i + 4} style={{ padding: 12 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <View style={{ minWidth: 0, flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: handFont,
                          fontSize: 18,
                          color: palette.ink,
                          lineHeight: 20,
                        }}
                        numberOfLines={1}
                      >
                        {o.dish_name} ×{o.quantity}
                      </Text>
                      <Text
                        style={{
                          fontFamily: noteFont,
                          fontSize: 12,
                          color: palette.inkSoft,
                          marginTop: 2,
                        }}
                        numberOfLines={1}
                      >
                        {new Date(o.created_at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                        {' · '}
                        {o.diner_username} · {o.group_name}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontFamily: titleFont,
                        fontStyle: 'italic',
                        fontSize: 16,
                        color: palette.ink,
                      }}
                    >
                      ¥{o.price_at_order}
                    </Text>
                  </View>
                </SketchBox>
              ))
            )
          )}
        </View>
      </ScrollView>

      <SketchBottomTabs active="orders" />

      <ConfirmDialog
        visible={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={onConfirmDelete}
        title="删除订单"
        confirmLabel="删除"
        destructive
        loading={del.isPending}
      />
    </View>
  );
}
