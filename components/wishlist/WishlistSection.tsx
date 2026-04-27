import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Heart, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  useCreateWishlistItem,
  useToggleWishlistVote,
  useWishlist,
} from '@/hooks/wishlist/useWishlist';
import { showToast } from '@/components/ui/Toast';
import tw from '@/lib/tw';

interface Props {
  groupId: string;
  /** When true (Diner view), show composer; chef-only views can pass false */
  canCompose?: boolean;
}

export function WishlistSection({ groupId, canCompose = true }: Props) {
  const { t } = useTranslation();
  const { data: items } = useWishlist(groupId);
  const create = useCreateWishlistItem(groupId);
  const toggle = useToggleWishlistVote(groupId);

  const [draft, setDraft] = useState('');

  const onAdd = async () => {
    const v = draft.trim();
    if (!v) return;
    try {
      await create.mutateAsync(v);
      setDraft('');
    } catch (e: any) {
      showToast.error(e?.message ?? t('errors.generic'));
    }
  };

  const onVote = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    toggle.mutate(id);
  };

  return (
    <View>
      <Text style={tw`text-xs font-medium text-gray-700 mb-2`}>{t('chef.wishlist')}</Text>

      {(items ?? []).length === 0 ? (
        <Text style={tw`text-xs text-gray-500 mb-3`}>—</Text>
      ) : (
        <View style={tw`gap-2 mb-3`}>
          {(items ?? []).map((row) => (
            <View
              key={row.id}
              style={tw`flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-2`}
            >
              <View style={tw`flex-1`}>
                <Text style={tw`text-sm text-gray-900`}>{row.content}</Text>
                <Text style={tw`text-[10px] text-gray-500 mt-0.5`}>
                  {row.requester_username}
                </Text>
              </View>
              <Pressable
                onPress={() => onVote(row.id)}
                hitSlop={6}
                style={tw`flex-row items-center px-2 py-1 rounded-full bg-gray-50`}
              >
                <Heart
                  size={12}
                  color={row.voted_by_me ? '#A68B6A' : '#A3A3A3'}
                  fill={row.voted_by_me ? '#A68B6A' : 'transparent'}
                />
                <Text
                  style={tw.style(
                    'ml-1 text-[11px] font-medium',
                    row.voted_by_me ? 'text-[#A68B6A]' : 'text-gray-700',
                  )}
                >
                  {row.votes}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {canCompose ? (
        <View style={tw`flex-row gap-2`}>
          <View style={tw`flex-1`}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={t('diner.addToWishlist')}
              placeholderTextColor="#A3A3A3"
              onSubmitEditing={onAdd}
              blurOnSubmit={false}
              returnKeyType="send"
              style={tw`bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900`}
            />
          </View>
          <Pressable
            onPress={onAdd}
            disabled={!draft.trim() || create.isPending}
            style={({ pressed }) => [
              tw`w-10 h-10 items-center justify-center rounded-lg bg-gray-900`,
              { opacity: !draft.trim() ? 0.4 : pressed ? 0.7 : 1 },
            ]}
          >
            <Plus size={14} color="white" />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
