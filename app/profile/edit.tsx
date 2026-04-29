import { useEffect, useState } from 'react';
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
import { useTranslation } from 'react-i18next';
import { Camera, User } from 'lucide-react-native';
import { router } from 'expo-router';
import { AppContainer } from '@/components/ui/AppContainer';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { showToast } from '@/components/ui/Toast';
import { useProfile, useUpdateProfile } from '@/hooks/auth/useProfile';
import { usePickAndUploadImage } from '@/hooks/storage/useImageUpload';
import tw from '@/lib/tw';

export default function ProfileEdit() {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useProfile();
  const update = useUpdateProfile();
  const upload = usePickAndUploadImage('avatars', { square: true });

  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const onPickAvatar = async () => {
    try {
      const url = await upload.mutateAsync('gallery');
      if (url) setAvatarUrl(url);
    } catch (e: any) {
      if (e?.message !== 'Permission denied') {
        showToast.error(e?.message ?? t('errors.generic'));
      }
    }
  };

  const onSave = async () => {
    if (!username.trim()) {
      showToast.error(t('errors.missingFields'));
      return;
    }
    setSubmitting(true);
    try {
      await update.mutateAsync({
        username: username.trim(),
        avatar_url: avatarUrl,
      });
      showToast.success(t('common.save'));
      router.back();
    } catch (e: any) {
      showToast.error(e?.message ?? t('errors.generic'));
    } finally {
      setSubmitting(false);
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

  return (
    <AppContainer>
      <View style={tw`flex-row items-center px-4 pt-1 pb-3`}>
        <BackButton />
        <Text style={tw`flex-1 ml-2 text-xl font-semibold text-gray-900`}>
          {t('profile.editProfile')}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={tw`flex-1`}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={tw`px-4 pb-32`}>
          {/* Avatar */}
          <View style={tw`items-center py-6`}>
            <Pressable
              onPress={onPickAvatar}
              disabled={upload.isPending}
              style={({ pressed }) => [
                tw`w-28 h-28 rounded-full bg-gray-100 items-center justify-center overflow-hidden`,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={tw`w-28 h-28`} contentFit="cover" />
              ) : (
                <User size={36} color="#A3A3A3" strokeWidth={1.5} />
              )}
              <View
                style={tw`absolute bottom-0 right-0 w-9 h-9 rounded-full bg-gray-900 items-center justify-center border-2 border-white`}
              >
                {upload.isPending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Camera size={14} color="white" />
                )}
              </View>
            </Pressable>
            <Text style={tw`mt-3 text-xs text-gray-500`}>{t('profile.tapToChangeAvatar')}</Text>
          </View>

          {/* Username */}
          <View style={tw`gap-3`}>
            <Input
              label={t('profile.username')}
              value={username}
              onChangeText={setUsername}
              maxLength={30}
              autoCapitalize="none"
            />
          </View>
        </ScrollView>

        {/* Save bar */}
        <View style={tw`px-4 pb-4 pt-2 bg-bg border-t border-gray-200`}>
          <Button
            label={t('common.save')}
            fullWidth
            loading={submitting}
            onPress={onSave}
          />
        </View>
      </KeyboardAvoidingView>
    </AppContainer>
  );
}
