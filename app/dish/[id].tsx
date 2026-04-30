import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChefHat, Heart, Share2, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppContainer } from '@/components/ui/AppContainer';
import { BackButton } from '@/components/ui/BackButton';
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
import tw from '@/lib/tw';

export default function DishDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dishId = id!;
  const { t } = useTranslation();
  const { user } = useSession();
  const insets = useSafeAreaInsets();

  const { data: dish, isLoading, error } = useDishDetail(dishId);
  const { data: comments } = useDishComments(dishId);
  const toggle = useToggleDishLike();
  const del = useDeleteComment(dishId);

  const [pendingDelete, setPendingDelete] = useState<DishCommentRow | null>(null);
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientLike | null>(null);

  // 份量缩放:基准为 dish.servings(若缺失默认 2);user 可上下调,食材数字按比例 scale。
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
      <AppContainer>
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="small" color="#737373" />
        </View>
      </AppContainer>
    );
  }
  if (error || !dish) {
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
    <View style={tw`flex-1 bg-bg`}>
      {/* Fixed top bar */}
      <View
        style={[
          tw`absolute left-0 right-0 z-10 px-2 flex-row items-center justify-between bg-white/85`,
          { paddingTop: insets.top + 4, paddingBottom: 8 },
        ]}
      >
        <BackButton />
        <View style={tw`flex-row items-center gap-2`}>
          <Pressable
            onPress={onLike}
            hitSlop={8}
            style={tw`flex-row items-center px-3 py-2 rounded-full bg-white/90 border border-gray-200`}
          >
            <Heart
              size={16}
              color={dish.liked_by_me ? '#A68B6A' : '#737373'}
              fill={dish.liked_by_me ? '#A68B6A' : 'transparent'}
            />
            {dish.likes_count > 0 ? (
              <Text
                style={tw.style(
                  'ml-1.5 text-xs font-medium',
                  dish.liked_by_me ? 'text-[#A68B6A]' : 'text-gray-700',
                )}
              >
                {dish.likes_count}
              </Text>
            ) : null}
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              shareDish({
                id: dish.id,
                name: dish.name,
                description: dish.description,
                chef_username: dish.chef_username,
                group_name: dish.group_name,
              });
            }}
            hitSlop={8}
            style={tw`p-2 rounded-full bg-white/90 border border-gray-200`}
          >
            <Share2 size={16} color="#737373" />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        style={tw`flex-1`}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            tw`pb-32`,
            { paddingTop: insets.top + 56 },
          ]}
        >
          {/* Hero image */}
          {dish.image_url ? (
            <Image
              source={{ uri: dish.image_url }}
              style={[tw`w-full bg-gray-100`, { aspectRatio: 1 }]}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[tw`w-full bg-gray-100`, { aspectRatio: 1 }]} />
          )}

          <View style={tw`px-4 pt-4`}>
            {/* Cuisine + carte name pills */}
            <View style={tw`flex-row gap-1.5 flex-wrap`}>
              {dish.cuisine ? (
                <View style={tw`px-2.5 py-1 rounded-full bg-[#FAF6EE] border border-[#E8DEC8]`}>
                  <Text style={tw`text-[10px] text-[#A68B6A] font-medium`}>{dish.cuisine}</Text>
                </View>
              ) : null}
              <View style={tw`px-2.5 py-1 rounded-full bg-gray-100`}>
                <Text style={tw`text-[10px] text-gray-700`}>{dish.group_name}</Text>
              </View>
              {dish.source_platform ? (
                <View style={tw`px-2.5 py-1 rounded-full bg-pink-50 border border-pink-100`}>
                  <Text style={tw`text-[10px] text-pink-700`}>{dish.source_platform}</Text>
                </View>
              ) : null}
            </View>

            <View style={tw`mt-3 flex-row items-start justify-between`}>
              <Text style={tw`flex-1 text-2xl font-semibold text-gray-900`}>{dish.name}</Text>
              {dish.price > 0 ? (
                <Text style={tw`ml-3 text-lg font-medium text-[#A68B6A]`}>
                  {formatPrice(dish.price)}
                </Text>
              ) : null}
            </View>

            {/* Meta line: 时间 · 份量 · 难度 · 千卡 */}
            {(() => {
              const parts: string[] = [];
              if (dish.total_time_min) parts.push(`${dish.total_time_min} 分钟`);
              if (dish.servings) parts.push(`${dish.servings} 人份`);
              if (dish.calories) parts.push(`${dish.calories} 千卡`);
              if (dish.difficulty) {
                const map: Record<string, string> = { easy: '简单', medium: '中等', hard: '挑战' };
                parts.push(map[dish.difficulty] ?? dish.difficulty);
              }
              return parts.length > 0 ? (
                <Text style={tw`mt-1.5 text-xs text-gray-500`}>{parts.join(' · ')}</Text>
              ) : null;
            })()}

            {dish.description ? (
              <Text style={tw`mt-2 text-sm text-gray-700 leading-relaxed`}>
                {dish.description}
              </Text>
            ) : null}

            {/* Tags */}
            {dish.tags && dish.tags.length > 0 ? (
              <View style={tw`mt-3 flex-row flex-wrap gap-1.5`}>
                {dish.tags.map((tag) => (
                  <View key={tag} style={tw`px-2.5 py-1 rounded-full bg-gray-100`}>
                    <Text style={tw`text-[10px] text-gray-600`}>#{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Chef card */}
            <View style={tw`mt-4 flex-row items-center bg-gray-50 rounded-xl p-3`}>
              <View
                style={tw`w-10 h-10 rounded-full bg-white items-center justify-center overflow-hidden`}
              >
                {dish.chef_avatar_url ? (
                  <Image
                    source={{ uri: dish.chef_avatar_url }}
                    style={tw`w-10 h-10`}
                    contentFit="cover"
                  />
                ) : (
                  <User size={18} color="#A3A3A3" strokeWidth={1.5} />
                )}
              </View>
              <View style={tw`ml-3`}>
                <Text style={tw`text-sm font-medium text-gray-900`}>{dish.chef_username}</Text>
                <Text style={tw`text-[11px] text-gray-500 mt-0.5`}>{dish.group_name}</Text>
              </View>
            </View>

            {/* Nutrition (per serving) */}
            {dish.nutrition ? (
              <View style={tw`mt-5`}>
                <Text style={tw`text-xs font-medium text-gray-700 mb-2`}>营养信息(每份)</Text>
                <View style={tw`flex-row gap-2`}>
                  {[
                    { key: 'protein_g', label: '蛋白质' },
                    { key: 'fat_g', label: '脂肪' },
                    { key: 'carbs_g', label: '碳水' },
                    { key: 'fiber_g', label: '纤维' },
                  ].map(({ key, label }) => {
                    const v = (dish.nutrition as Record<string, number | undefined>)?.[key];
                    return (
                      <View
                        key={key}
                        style={tw`flex-1 bg-gray-50 rounded-lg px-2.5 py-2`}
                      >
                        <Text style={tw`text-[10px] text-gray-500`}>{label}</Text>
                        <Text style={tw`text-sm font-semibold text-gray-900 mt-0.5`}>
                          {v != null ? `${v}g` : '—'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Ingredients (含份量调整) */}
            {dish.ingredients.length > 0 ? (
              <View style={tw`mt-5`}>
                <View style={tw`flex-row items-center justify-between mb-2`}>
                  <Text style={tw`text-xs font-medium text-gray-700`}>
                    {t('chef.ingredients')}
                  </Text>
                  {/* Servings stepper — 可调节,数字按比例缩放 */}
                  <View style={tw`flex-row items-center gap-2`}>
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setServingsAdjust(Math.max(1, servings - 1));
                      }}
                      hitSlop={8}
                      style={tw`w-6 h-6 rounded-full bg-gray-100 items-center justify-center`}
                    >
                      <Text style={tw`text-sm text-gray-700 leading-none`}>−</Text>
                    </Pressable>
                    <Text style={tw`text-xs font-medium text-gray-900 min-w-12 text-center`}>
                      {servings} 人份
                    </Text>
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setServingsAdjust(Math.min(20, servings + 1));
                      }}
                      hitSlop={8}
                      style={tw`w-6 h-6 rounded-full bg-gray-100 items-center justify-center`}
                    >
                      <Text style={tw`text-sm text-gray-700 leading-none`}>+</Text>
                    </Pressable>
                  </View>
                </View>
                {servings !== baseServings ? (
                  <Text style={tw`text-[10px] text-[#A68B6A] mb-2`}>
                    已按 {servings}/{baseServings} 比例调整食材用量
                  </Text>
                ) : null}
                <View style={tw`flex-row flex-wrap gap-1.5`}>
                  {dish.ingredients.map((i, idx) => {
                    const name = typeof i === 'string' ? i : i.name;
                    const qtyRaw = typeof i === 'string' ? '' : (i.quantity ?? '');
                    const qty = scaleQuantity(qtyRaw, ratio);
                    const text = qty ? `${name} ${qty}` : name;
                    return (
                      <View key={`${idx}-${text}`} style={tw`px-2.5 py-1 rounded-full bg-gray-100`}>
                        <Text style={tw`text-[11px] text-gray-700`}>{text}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Tools */}
            {dish.tools && dish.tools.length > 0 ? (
              <View style={tw`mt-5`}>
                <Text style={tw`text-xs font-medium text-gray-700 mb-2`}>工具</Text>
                <View style={tw`flex-row flex-wrap gap-1.5`}>
                  {dish.tools.map((tool) => (
                    <View key={tool} style={tw`px-2.5 py-1 rounded-md bg-white border border-gray-200`}>
                      <Text style={tw`text-[11px] text-gray-700`}>{tool}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* "开始做菜" CTA — 仅在有 prep 或 cook 步骤时显示 */}
            {((dish.prep_steps?.length ?? 0) + (dish.cook_steps?.length ?? 0)) > 0 ? (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  router.push(`/cook/${dish.id}`);
                }}
                style={tw`mt-5 flex-row items-center justify-center gap-2 py-3.5 rounded-xl bg-[#A68B6A]`}
              >
                <ChefHat size={18} color="white" />
                <Text style={tw`text-sm font-medium text-white`}>开始做菜</Text>
              </Pressable>
            ) : null}

            {/* Prep steps */}
            {dish.prep_steps && dish.prep_steps.length > 0 ? (
              <View style={tw`mt-5`}>
                <Text style={tw`text-xs font-medium text-gray-700 mb-2`}>备菜步骤</Text>
                <View style={tw`gap-3`}>
                  {dish.prep_steps.sort((a, b) => a.order - b.order).map((s) => (
                    <StepRow
                      key={`prep-${s.order}`}
                      step={s}
                      accent="#A68B6A"
                      ingredients={dish.ingredients}
                      onIngredientPress={setSelectedIngredient}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {/* Cook steps */}
            {dish.cook_steps && dish.cook_steps.length > 0 ? (
              <View style={tw`mt-5`}>
                <Text style={tw`text-xs font-medium text-gray-700 mb-2`}>烹饪步骤</Text>
                <View style={tw`gap-3`}>
                  {dish.cook_steps.sort((a, b) => a.order - b.order).map((s) => (
                    <StepRow
                      key={`cook-${s.order}`}
                      step={s}
                      accent="#A68B6A"
                      ingredients={dish.ingredients}
                      onIngredientPress={setSelectedIngredient}
                    />
                  ))}
                </View>
              </View>
            ) : dish.recipe ? (
              <View style={tw`mt-5`}>
                <Text style={tw`text-xs font-medium text-gray-700 mb-2`}>
                  {t('chef.recipe')}
                </Text>
                <Text style={tw`text-sm text-gray-700 leading-relaxed`}>{dish.recipe}</Text>
              </View>
            ) : null}

            {/* Divider */}
            <View style={tw`h-px bg-gray-200 my-5`} />

            {/* Comments */}
            <Text style={tw`text-xs font-medium text-gray-700 mb-3`}>
              {t('dish.comments')} ({comments?.length ?? 0})
            </Text>
            <CommentList
              comments={comments ?? []}
              myUserId={user?.id}
              onDelete={(c) => setPendingDelete(c)}
            />
          </View>
        </ScrollView>

        {/* Bottom composer */}
        <View
          style={[
            tw`absolute bottom-0 left-0 right-0 px-4 pt-2 bg-bg border-t border-gray-200`,
            { paddingBottom: insets.bottom + 8 },
          ]}
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

      {/* Ingredient detail sheet — 步骤里点击食材 token 时弹出 */}
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

function StepRow({
  step,
  accent,
  ingredients,
  onIngredientPress,
}: {
  step: { order: number; instruction: string; duration_min?: number; tip?: string };
  accent: string;
  ingredients?: Array<string | IngredientLike>;
  onIngredientPress?: (ing: IngredientLike) => void;
}) {
  return (
    <View style={tw`flex-row gap-3`}>
      <View
        style={[
          tw`w-7 h-7 rounded-full items-center justify-center mt-0.5`,
          { backgroundColor: accent + '22' },
        ]}
      >
        <Text style={[tw`text-xs font-semibold`, { color: accent }]}>{step.order}</Text>
      </View>
      <View style={tw`flex-1`}>
        {ingredients && ingredients.length > 0 ? (
          <HighlightedStepText
            text={step.instruction}
            ingredients={ingredients}
            onIngredientPress={onIngredientPress}
          />
        ) : (
          <Text style={tw`text-sm text-gray-900 leading-relaxed`}>{step.instruction}</Text>
        )}
        {step.tip ? (
          <Text style={tw`mt-1 text-[11px] text-[#A68B6A] leading-relaxed`}>
            💡 {step.tip}
          </Text>
        ) : null}
        {step.duration_min ? (
          <Text style={tw`mt-1 text-[10px] text-gray-500`}>
            约 {step.duration_min} 分钟
          </Text>
        ) : null}
      </View>
    </View>
  );
}

