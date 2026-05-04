import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Tappable } from '@/components/ui/Tappable';
import { SketchBox, SketchCircle } from '@/components/ui/sketch';
import { showToast } from '@/components/ui/Toast';
import { usePostComment } from '@/hooks/dish/useDishComments';
import { palette, handFont } from '@/lib/palette';

interface Props {
  dishId: string;
}

export function CommentComposer({ dishId }: Props) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const post = usePostComment(dishId);

  const submit = async () => {
    const v = text.trim();
    if (!v || post.isPending) return;
    Haptics.selectionAsync().catch(() => {});
    try {
      await post.mutateAsync(v);
      setText('');
    } catch (e: any) {
      showToast.error(e?.message ?? t('errors.generic'));
    }
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ flex: 1 }}>
        <SketchBox
          radius={999}
          seed={120}
          fillColor={palette.paper}
          style={{ paddingHorizontal: 16, paddingVertical: 8 }}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('dish.writeComment')}
            placeholderTextColor={palette.inkMute}
            style={{
              fontFamily: handFont,
              fontSize: 16,
              color: palette.ink,
              padding: 0,
              minHeight: 22,
            }}
            returnKeyType="send"
            onSubmitEditing={submit}
            blurOnSubmit={false}
          />
        </SketchBox>
      </View>
      <Tappable
        feedback="press"
        onPress={submit}
        disabled={!text.trim() || post.isPending}
      >
        <View style={{ opacity: !text.trim() ? 0.4 : 1 }}>
          <SketchCircle size={40} seed={121}>
            <Send size={14} color={palette.ink} strokeWidth={1.6} />
          </SketchCircle>
        </View>
      </Tappable>
    </View>
  );
}
