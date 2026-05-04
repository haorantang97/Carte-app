import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ChefHat,
  Clock,
  Flame,
  Heart,
  Minus,
  Plus,
  Share2,
  Users,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Tappable } from '@/components/ui/Tappable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CommentList } from '@/components/dish/CommentList';
import { CommentComposer } from '@/components/dish/CommentComposer';
import {
  HighlightedStepText,
  type IngredientLike,
} from '@/components/dish/HighlightedStepText';
import { IngredientSheet } from '@/components/dish/IngredientSheet';
import { showToast } from '@/components/ui/Toast';
import {
  SketchBox,
  SketchCircle,
  SketchPill,
  SketchPhoto,
  SketchPhotoCircle,
  SketchUnderline,
} from '@/components/ui/sketch';
import { useDishDetail } from '@/hooks/dish/useDishDetail';
import { useToggleDishLike } from '@/hooks/dish/useDishLikes';
import {
  useDeleteComment,
  useDishComments,
  type DishCommentRow,
} from '@/hooks/dish/useDishComments';
import { useSession } from '@/hooks/auth/useSession';
import { formatPrice } from '@/lib/price';
import { shareDish } from '@/lib/share';
import { scaleQuantity } from '@/lib/units';
import { palette, handFont, noteFont, titleFont } from '@/lib/palette';
import { useResponsive } from '@/lib/responsive';

export default function DishDetailScreen() {
  const insets = useSafeAreaInsets();
  const r = useResponsive();
  const contentPadH = r.isTablet
    ? Math.max(24, (r.width - r.contentMaxWidth) / 2)
    : r.scale(20, { min: 14, max: 28 });
  const heroH = r.scale(280, { min: 220, max: 360 });
  const { id } = useLocalSearchParams<{ id: string }>();
  const dishId = id!;
  const { t } = useTranslation();
  const { user } = useSession();

  const { data: dish, isLoading, error } = useDishDetail(dishId);
  const { data: comments } = useDishComments(dishId);
  const toggle = useToggleDishLike();
  const del = useDeleteComment(dishId);

  const [pendingDelete, setPendingDelete] = useState<DishCommentRow | null>(null);
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientLike | null>(
    null,
  );

  const baseServings = dish?.servings ?? 2;
  const [servingsAdjust, setServingsAdjust] = useState<number | null>(null);
  const servings = servingsAdjust ?? baseServings;
  const ratio = baseServings > 0 ? servings / baseServings : 1;

  const onLike = () => {
    if (!dish) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    toggle.mutate({ dishId: dish.id, liked: dish.liked_by_me });
  };

  const onConfirmDeleteComment = async () => {
    if (!pendingDelete) return;
    try {
      await del.mutateAsync(pendingDelete.id);
      showToast.info(t('dish.deleted'));
    } catch (e: any) {
      showToast.error(e?.message ?? t('errors.generic'));
    } finally {
      setPendingDelete(null);
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
  if (error || !dish) {
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 100,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Top bar */}
          <View
            style={{
              paddingHorizontal: contentPadH,
              paddingBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Tappable feedback="press" onPress={() => router.back()}>
              <SketchCircle size={r.scale(40, { min: 36, max: 48 })} seed={1}>
                <ArrowLeft size={18} color={palette.ink} strokeWidth={1.5} />
              </SketchCircle>
            </Tappable>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Tappable feedback="press" onPress={onLike}>
                <SketchBox
                  radius={999}
                  seed={2}
                  fillColor={palette.paper}
                  style={{ paddingHorizontal: 12, paddingVertical: 6 }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Heart
                      size={16}
                      color={palette.ink}
                      strokeWidth={1.5}
                      fill={dish.liked_by_me ? palette.ink : 'transparent'}
                    />
                    {dish.likes_count > 0 ? (
                      <Text
                        style={{
                          fontFamily: handFont,
                          fontSize: 18,
                          color: palette.ink,
                        }}
                      >
                        {dish.likes_count}
                      </Text>
                    ) : null}
                  </View>
                </SketchBox>
              </Tappable>
              <Tappable
                feedback="press"
                onPress={() => {
                  shareDish({
                    id: dish.id,
                    name: dish.name,
                    description: dish.description,
                    chef_username: dish.chef_username,
                    group_name: dish.group_name,
                  });
                }}
              >
                <SketchCircle size={r.scale(40, { min: 36, max: 48 })} seed={3}>
                  <Share2 size={16} color={palette.ink} strokeWidth={1.5} />
                </SketchCircle>
              </Tappable>
            </View>
          </View>

          {/* Hero photo */}
          <View style={{ paddingHorizontal: contentPadH, paddingTop: 4, paddingBottom: 20 }}>
            {dish.image_url ? (
              <SketchPhoto
                src={dish.image_url}
                radius={20}
                seed={9}
                style={{ width: '100%', height: heroH }}
              />
            ) : (
              <View
                style={{
                  width: '100%',
                  height: heroH,
                  borderRadius: 20,
                  backgroundColor: palette.inkPale,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChefHat size={56} color={palette.ink} strokeWidth={1.4} />
              </View>
            )}
          </View>

          <View style={{ paddingHorizontal: contentPadH, gap: 20 }}>
            {/* Pills */}
            <View
              style={{
                flexDirection: 'row',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              {dish.cuisine ? (
                <SketchPill seed={1}>
                  <Text style={{ fontFamily: handFont, fontSize: 14, color: palette.ink }}>
                    {dish.cuisine}
                  </Text>
                </SketchPill>
              ) : null}
              <SketchPill seed={2}>
                <Text style={{ fontFamily: handFont, fontSize: 14, color: palette.ink }}>
                  {dish.group_name}
                </Text>
              </SketchPill>
              {dish.source_platform ? (
                <SketchPill seed={3}>
                  <Text style={{ fontFamily: handFont, fontSize: 14, color: palette.ink }}>
                    {dish.source_platform}
                  </Text>
                </SketchPill>
              ) : null}
            </View>

            {/* Title + price */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: handFont,
                    fontSize: r.fontScale(40, { min: 30, max: 48 }),
                    color: palette.ink,
                    lineHeight: r.fontScale(40, { min: 30, max: 48 }),
                    fontWeight: '700',
                  }}
                >
                  {dish.name}
                </Text>
                <SketchUnderline
                  width={r.scale(140, { min: 110, max: 170 })}
                  seed={4}
                  color={palette.ink}
                />
              </View>
              {dish.price > 0 ? (
                <Text
                  style={{
                    fontFamily: titleFont,
                    fontStyle: 'italic',
                    fontSize: r.fontScale(30, { min: 24, max: 36 }),
                    color: palette.ink,
                    fontWeight: '600',
                  }}
                >
                  {formatPrice(dish.price)}
                </Text>
              ) : null}
            </View>

            {/* Meta */}
            <View
              style={{
                flexDirection: 'row',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              {dish.total_time_min ? (
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <Clock size={14} color={palette.inkSoft} strokeWidth={1.5} />
                  <Text
                    style={{ fontFamily: noteFont, fontSize: 14, color: palette.inkSoft }}
                  >
                    {dish.total_time_min} min
                  </Text>
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Users size={14} color={palette.inkSoft} strokeWidth={1.5} />
                <Text
                  style={{ fontFamily: noteFont, fontSize: 14, color: palette.inkSoft }}
                >
                  {servings} 人份
                </Text>
              </View>
              {dish.calories ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Flame size={14} color={palette.inkSoft} strokeWidth={1.5} />
                  <Text
                    style={{ fontFamily: noteFont, fontSize: 14, color: palette.inkSoft }}
                  >
                    {dish.calories} cal
                  </Text>
                </View>
              ) : null}
              {dish.difficulty ? (
                <Text
                  style={{ fontFamily: noteFont, fontSize: 14, color: palette.inkSoft }}
                >
                  {(() => {
                    const map: Record<string, string> = {
                      easy: '简单',
                      medium: '中等',
                      hard: '挑战',
                    };
                    return map[dish.difficulty] ?? dish.difficulty;
                  })()}
                </Text>
              ) : null}
            </View>

            {/* Description */}
            {dish.description ? (
              <Text
                style={{
                  fontFamily: noteFont,
                  fontSize: 15,
                  color: palette.ink,
                  lineHeight: 24,
                }}
              >
                {dish.description}
              </Text>
            ) : null}

            {/* Tags */}
            {dish.tags && dish.tags.length > 0 ? (
              <View
                style={{
                  flexDirection: 'row',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                {dish.tags.map((tag, i) => (
                  <SketchPill key={tag} seed={i + 5} style={{ paddingTop: 4, paddingBottom: 4 }}>
                    <Text
                      style={{ fontFamily: handFont, fontSize: 13, color: palette.ink }}
                    >
                      #{tag}
                    </Text>
                  </SketchPill>
                ))}
              </View>
            ) : null}

            {/* Chef card */}
            <SketchBox
              radius={14}
              seed={6}
              fillColor={palette.paper}
              style={{ padding: 12 }}
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
                <SketchPhotoCircle
                  src={dish.chef_avatar_url ?? null}
                  size={42}
                  seed={7}
                />
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
                    {dish.chef_username}
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
                    {dish.group_name}
                  </Text>
                </View>
              </View>
            </SketchBox>

            {/* Nutrition */}
            {dish.nutrition ? (
              <View>
                <Section title="营养（每份）" seed={1} />
                <View
                  style={{
                    marginTop: 12,
                    flexDirection: 'row',
                    gap: 8,
                  }}
                >
                  {[
                    { key: 'protein_g', label: '蛋白质' },
                    { key: 'fat_g', label: '脂肪' },
                    { key: 'carbs_g', label: '碳水' },
                    { key: 'fiber_g', label: '纤维' },
                  ].map(({ key, label }, i) => {
                    const v = (dish.nutrition as Record<string, number | undefined>)?.[
                      key
                    ];
                    return (
                      <View key={key} style={{ flex: 1 }}>
                        <SketchBox
                          radius={12}
                          seed={i + 1}
                          fillColor={palette.paper}
                          style={{ paddingVertical: 12 }}
                        >
                          <Text
                            style={{
                              textAlign: 'center',
                              fontFamily: handFont,
                              fontSize: 22,
                              color: palette.ink,
                              lineHeight: 22,
                              fontWeight: '700',
                            }}
                          >
                            {v != null ? `${v}g` : '—'}
                          </Text>
                          <Text
                            style={{
                              textAlign: 'center',
                              fontFamily: noteFont,
                              fontSize: 11,
                              color: palette.inkSoft,
                              marginTop: 4,
                            }}
                          >
                            {label}
                          </Text>
                        </SketchBox>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Ingredients */}
            {dish.ingredients && dish.ingredients.length > 0 ? (
              <View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                  }}
                >
                  <View>
                    <Text
                      style={{
                        fontFamily: handFont,
                        fontSize: 26,
                        color: palette.ink,
                        lineHeight: 26,
                      }}
                    >
                      食材
                    </Text>
                    <SketchUnderline width={50} seed={2} color={palette.ink} />
                  </View>
                  <SketchBox
                    radius={999}
                    seed={3}
                    fillColor={palette.paper}
                    style={{ paddingHorizontal: 6, paddingVertical: 4 }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Tappable
                        feedback="press"
                        onPress={() =>
                          setServingsAdjust(Math.max(1, servings - 1))
                        }
                      >
                        <SketchCircle size={22} seed={11}>
                          <Minus size={11} color={palette.ink} strokeWidth={1.6} />
                        </SketchCircle>
                      </Tappable>
                      <Text
                        style={{
                          fontFamily: handFont,
                          fontSize: 16,
                          color: palette.ink,
                        }}
                      >
                        {servings} 人份
                      </Text>
                      <Tappable
                        feedback="press"
                        onPress={() =>
                          setServingsAdjust(Math.min(20, servings + 1))
                        }
                      >
                        <SketchCircle size={22} seed={12}>
                          <Plus size={11} color={palette.ink} strokeWidth={1.6} />
                        </SketchCircle>
                      </Tappable>
                    </View>
                  </SketchBox>
                </View>
                {servings !== baseServings ? (
                  <Text
                    style={{
                      fontFamily: noteFont,
                      fontSize: 11,
                      color: palette.inkSoft,
                      marginTop: 8,
                    }}
                  >
                    已按 {servings}/{baseServings} 比例调整食材用量
                  </Text>
                ) : null}
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginTop: 12,
                  }}
                >
                  {dish.ingredients.map((i, idx) => {
                    const name = typeof i === 'string' ? i : i.name;
                    const qtyRaw = typeof i === 'string' ? '' : i.quantity ?? '';
                    const qty = scaleQuantity(qtyRaw, ratio);
                    return (
                      <Tappable
                        key={`${idx}-${name}`}
                        feedback="press"
                        onPress={() =>
                          setSelectedIngredient(
                            typeof i === 'string' ? { name: i } : (i as IngredientLike),
                          )
                        }
                      >
                        <SketchPill seed={idx + 1}>
                          <Text
                            style={{
                              fontFamily: handFont,
                              fontSize: 14,
                              color: palette.ink,
                              fontWeight: '700',
                            }}
                          >
                            {name}
                          </Text>
                          {qty ? (
                            <Text
                              style={{
                                fontFamily: noteFont,
                                fontSize: 13,
                                color: palette.inkMute,
                                marginLeft: 4,
                              }}
                            >
                              {qty}
                            </Text>
                          ) : null}
                        </SketchPill>
                      </Tappable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* CTA */}
            {((dish.prep_steps?.length ?? 0) + (dish.cook_steps?.length ?? 0)) > 0 ? (
              <Tappable
                feedback="press"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                    () => {},
                  );
                  router.push(`/cook/${dish.id}` as any);
                }}
              >
                <SketchBox
                  radius={999}
                  seed={4}
                  strokeWidth={2}
                  fillColor={palette.paper}
                  style={{ paddingVertical: 14 }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <ChefHat size={20} color={palette.ink} strokeWidth={1.6} />
                    <Text
                      style={{
                        fontFamily: handFont,
                        fontSize: 24,
                        color: palette.ink,
                        fontWeight: '700',
                      }}
                    >
                      开始做菜 →
                    </Text>
                  </View>
                </SketchBox>
              </Tappable>
            ) : null}

            {/* Prep steps */}
            {dish.prep_steps && dish.prep_steps.length > 0 ? (
              <View>
                <Section title="备菜步骤" seed={5} />
                <View style={{ gap: 12, marginTop: 12 }}>
                  {dish.prep_steps
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((s, i) => (
                      <StepRow
                        key={`prep-${s.order}`}
                        step={s}
                        seed={i + 10}
                        ingredients={dish.ingredients}
                        onIngredientPress={setSelectedIngredient}
                      />
                    ))}
                </View>
              </View>
            ) : null}

            {/* Cook steps */}
            {dish.cook_steps && dish.cook_steps.length > 0 ? (
              <View>
                <Section title="烹饪步骤" seed={6} />
                <View style={{ gap: 12, marginTop: 12 }}>
                  {dish.cook_steps
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((s, i) => (
                      <StepRow
                        key={`cook-${s.order}`}
                        step={s}
                        seed={i + 20}
                        ingredients={dish.ingredients}
                        onIngredientPress={setSelectedIngredient}
                      />
                    ))}
                </View>
              </View>
            ) : dish.recipe ? (
              <View>
                <Section title={t('chef.recipe')} seed={7} />
                <Text
                  style={{
                    fontFamily: noteFont,
                    fontSize: 15,
                    color: palette.ink,
                    lineHeight: 24,
                    marginTop: 12,
                  }}
                >
                  {dish.recipe}
                </Text>
              </View>
            ) : null}

            {/* Comments */}
            <View style={{ marginTop: 8 }}>
              <Section title={`${t('dish.comments')} (${comments?.length ?? 0})`} seed={8} />
              <View style={{ marginTop: 12 }}>
                <CommentList
                  comments={comments ?? []}
                  myUserId={user?.id}
                  onDelete={(c) => setPendingDelete(c)}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom composer */}
        <View
          style={{
            paddingHorizontal: contentPadH,
            paddingTop: 8,
            paddingBottom: insets.bottom + 8,
            borderTopWidth: 1,
            borderTopColor: palette.inkPale,
            backgroundColor: palette.paper,
          }}
        >
          <CommentComposer dishId={dishId} />
        </View>
      </KeyboardAvoidingView>

      <ConfirmDialog
        visible={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={onConfirmDeleteComment}
        title={t('dish.deleteComment')}
        confirmLabel={t('common.delete')}
        destructive
        loading={del.isPending}
      />

      <IngredientSheet
        visible={!!selectedIngredient}
        onClose={() => setSelectedIngredient(null)}
        ingredient={selectedIngredient}
        scaledQuantity={
          selectedIngredient?.quantity
            ? scaleQuantity(selectedIngredient.quantity, ratio)
            : undefined
        }
      />
    </View>
  );
}

function Section({ title, seed }: { title: string; seed: number }) {
  return (
    <View>
      <Text
        style={{
          fontFamily: handFont,
          fontSize: 26,
          color: palette.ink,
          lineHeight: 26,
        }}
      >
        {title}
      </Text>
      <SketchUnderline
        width={Math.max(50, title.length * 18)}
        seed={seed}
        color={palette.ink}
      />
    </View>
  );
}

function StepRow({
  step,
  seed,
  ingredients,
  onIngredientPress,
}: {
  step: { order: number; instruction: string; duration_min?: number; tip?: string };
  seed: number;
  ingredients?: (string | IngredientLike)[];
  onIngredientPress?: (ing: IngredientLike) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <SketchCircle size={32} seed={seed}>
        <Text
          style={{
            fontFamily: titleFont,
            fontStyle: 'italic',
            fontSize: 16,
            color: palette.ink,
            fontWeight: '700',
          }}
        >
          {step.order}
        </Text>
      </SketchCircle>
      <View style={{ flex: 1, minWidth: 0 }}>
        {ingredients && ingredients.length > 0 ? (
          <HighlightedStepText
            text={step.instruction}
            ingredients={ingredients}
            baseStyle={{
              fontFamily: noteFont,
              fontSize: 15,
              color: palette.ink,
              lineHeight: 23,
            }}
            highlightStyle={{
              color: palette.ink,
              fontWeight: '700',
              textDecorationLine: 'underline',
            }}
            onIngredientPress={onIngredientPress}
          />
        ) : (
          <Text
            style={{
              fontFamily: noteFont,
              fontSize: 15,
              color: palette.ink,
              lineHeight: 23,
            }}
          >
            {step.instruction}
          </Text>
        )}
        {step.tip ? (
          <View
            style={{
              marginTop: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: palette.inkMute,
              borderStyle: 'dashed',
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                fontFamily: noteFont,
                fontSize: 13,
                color: palette.inkSoft,
                lineHeight: 18,
              }}
            >
              ☞ {step.tip}
            </Text>
          </View>
        ) : null}
        {step.duration_min ? (
          <Text
            style={{
              fontFamily: noteFont,
              fontSize: 12,
              color: palette.inkMute,
              marginTop: 6,
            }}
          >
            ⏱ 约 {step.duration_min} 分钟
          </Text>
        ) : null}
      </View>
    </View>
  );
}
