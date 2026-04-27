import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { showToast } from '@/components/ui/Toast';
import { usePostComment } from '@/hooks/dish/useDishComments';
import tw from '@/lib/tw';

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
    <View style={tw`flex-row items-center gap-2`}>
      <View style={tw`flex-1`}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t('dish.writeComment')}
          placeholderTextColor="#A3A3A3"
          style={tw`bg-white border border-gray-200 rounded-full px-4 py-2.5 text-sm text-gray-900`}
          returnKeyType="send"
          onSubmitEditing={submit}
          blurOnSubmit={false}
        />
      </View>
      <Pressable
        onPress={submit}
        disabled={!text.trim() || post.isPending}
        style={({ pressed }) => [
          tw`w-10 h-10 rounded-full items-center justify-center`,
          {
            backgroundColor: text.trim() ? '#A68B6A' : '#E5E5E5',
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Send size={14} color="white" />
      </Pressable>
    </View>
  );
}
