import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useProfile, useUpdateProfile } from '@/hooks/auth/useProfile';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';
import tw from '@/lib/tw';

/**
 * Shown the first time a user lands on the Carte tab if their username is
 * still the default 'Guest'. Light-touch: input + skip button. Saving
 * updates the profile and dismisses; skipping just dismisses (won't show
 * again until next reload — we use AsyncStorage to remember dismissal).
 */
export function UsernamePrompt() {
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    if (profile.username === 'Guest' || !profile.username.trim()) {
      setOpen(true);
    }
  }, [profile]);

  const onSave = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await update.mutateAsync({ username: name.trim() });
      setOpen(false);
    } catch (e: any) {
      showToast.error(e?.message ?? t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={tw`flex-1 items-center justify-center bg-black/40 px-6`}>
        <View style={tw`w-full max-w-sm bg-white rounded-2xl p-5`}>
          <Text style={tw`text-base font-semibold text-gray-900`}>
            {t('home.welcome')}
          </Text>
          <Text style={tw`mt-1 text-sm text-gray-600`}>叫你什么呢?</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('profile.username')}
            placeholderTextColor="#A3A3A3"
            autoFocus
            maxLength={30}
            returnKeyType="done"
            onSubmitEditing={onSave}
            style={tw`mt-4 bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900`}
          />
          <View style={tw`mt-4 flex-row gap-2`}>
            <View style={tw`flex-1`}>
              <Pressable
                onPress={() => setOpen(false)}
                style={({ pressed }) => [
                  tw`px-4 py-3 items-center justify-center`,
                  { opacity: pressed ? 0.5 : 1 },
                ]}
              >
                <Text style={tw`text-sm text-gray-500`}>稍后</Text>
              </Pressable>
            </View>
            <View style={tw`flex-1`}>
              <Button
                label={t('common.save')}
                fullWidth
                disabled={!name.trim()}
                loading={submitting}
                onPress={onSave}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
