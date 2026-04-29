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
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Heart, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppContainer } from '@/components/ui/AppContainer';
import { BackButton } from '@/components/ui/BackButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CommentList } from '@/components/dish/CommentList';
import { CommentComposer } from '@/components/dish/CommentComposer';
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
            <View style={tw`self-start px-2.5 py-1 rounded-full bg-gray-100`}>
              <Text style={tw`text-[10px] text-gray-700`}>{dish.group_name}</Text>
            </View>
            <View style={tw`mt-3 flex-row items-start justify-between`}>
              <Text style={tw`flex-1 text-2xl font-semibold text-gray-900`}>{dish.name}</Text>
              <Text style={tw`ml-3 text-lg font-medium text-[#A68B6A]`}>
                {formatPrice(dish.price)}
              </Text>
            </View>
            {dish.description ? (
              <Text style={tw`mt-2 text-sm text-gray-700 leading-relaxed`}>
                {dish.description}
              </Text>
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

            {/* Ingredients */}
            {dish.ingredients.length > 0 ? (
              <View style={tw`mt-4`}>
                <Text style={tw`text-xs font-medium text-gray-700 mb-2`}>
                  {t('chef.ingredients')}
                </Text>
                <View style={tw`flex-row flex-wrap gap-1.5`}>
                  {dish.ingredients.map((i) => (
                    <View key={i} style={tw`px-2.5 py-1 rounded-full bg-gray-100`}>
                      <Text style={tw`text-[11px] text-gray-700`}>{i}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Recipe */}
            {dish.recipe ? (
              <View style={tw`mt-4`}>
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
    </View>
  );
}
