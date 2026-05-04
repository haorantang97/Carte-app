import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Plus, ThumbsUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Tappable } from '@/components/ui/Tappable';
import { SketchBox, SketchPill, SketchCircle } from '@/components/ui/sketch';
import {
  useCreateWishlistItem,
  useToggleWishlistVote,
  useWishlist,
} from '@/hooks/wishlist/useWishlist';
import { showToast } from '@/components/ui/Toast';
import { palette, handFont, noteFont } from '@/lib/palette';

interface Props {
  groupId: string;
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
      {(items ?? []).length === 0 ? (
        <Text
          style={{
            fontFamily: noteFont,
            fontSize: 13,
            color: palette.inkMute,
            marginBottom: 12,
            textAlign: 'center',
            paddingVertical: 24,
          }}
        >
          还没有 diner 投愿望
        </Text>
      ) : (
        <View style={{ gap: 10, marginBottom: 16 }}>
          {(items ?? []).map((row, i) => (
            <SketchBox
              key={row.id}
              radius={14}
              seed={i + 80}
              fillColor={palette.paper}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{
                    fontFamily: handFont,
                    fontSize: 16,
                    color: palette.ink,
                    lineHeight: 18,
                  }}
                >
                  {row.content}
                </Text>
                <Text
                  style={{
                    fontFamily: noteFont,
                    fontSize: 11,
                    color: palette.inkMute,
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  {row.requester_username}
                </Text>
              </View>
              <Tappable feedback="press" onPress={() => onVote(row.id)} hitSlop={6}>
                <SketchPill
                  active={row.voted_by_me}
                  seed={i + 90}
                  style={{ paddingTop: 3, paddingBottom: 3 }}
                >
                  <ThumbsUp
                    size={11}
                    color={palette.ink}
                    strokeWidth={1.5}
                    fill={row.voted_by_me ? palette.ink : 'transparent'}
                  />
                  <Text
                    style={{
                      fontFamily: handFont,
                      fontSize: 13,
                      color: palette.ink,
                      fontWeight: row.voted_by_me ? '700' : '400',
                    }}
                  >
                    {row.votes}
                  </Text>
                </SketchPill>
              </Tappable>
            </SketchBox>
          ))}
        </View>
      )}

      {canCompose ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <SketchBox
              radius={12}
              seed={70}
              fillColor={palette.paper}
              style={{ paddingHorizontal: 12, paddingVertical: 8 }}
            >
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={t('diner.addToWishlist')}
                placeholderTextColor={palette.inkMute}
                onSubmitEditing={onAdd}
                blurOnSubmit={false}
                returnKeyType="send"
                style={{
                  fontFamily: handFont,
                  fontSize: 16,
                  color: palette.ink,
                  padding: 0,
                  minHeight: 22,
                }}
              />
            </SketchBox>
          </View>
          <Tappable
            feedback="press"
            onPress={onAdd}
            disabled={!draft.trim() || create.isPending}
          >
            <View
              style={{
                opacity: !draft.trim() ? 0.4 : 1,
              }}
            >
              <SketchCircle size={40} seed={71}>
                <Plus size={16} color={palette.ink} strokeWidth={1.6} />
              </SketchCircle>
            </View>
          </Tappable>
        </View>
      ) : null}
    </View>
  );
}
