import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ChevronRight, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { AppContainer } from '@/components/ui/AppContainer';
import { useProfile } from '@/hooks/auth/useProfile';
import tw from '@/lib/tw';

export default function ProfileTab() {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useProfile();

  const goEdit = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push('/profile/edit');
  };

  return (
    <AppContainer bottomInset={false}>
      <View style={tw`px-4 pt-2 pb-4`}>
        <Text style={tw`text-2xl font-semibold text-gray-900`}>{t('profile.title')}</Text>
      </View>

      <View style={tw`px-4`}>
        <Pressable
          onPress={goEdit}
          style={({ pressed }) => [
            tw`bg-white border border-gray-200 rounded-2xl p-4 flex-row items-center`,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <View
            style={tw`w-14 h-14 rounded-full bg-gray-100 items-center justify-center overflow-hidden`}
          >
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={tw`w-14 h-14`} contentFit="cover" />
            ) : (
              <User size={24} color="#A3A3A3" strokeWidth={1.5} />
            )}
          </View>
          <View style={tw`flex-1 ml-3`}>
            <Text style={tw`text-base font-medium text-gray-900`}>
              {isLoading ? '...' : profile?.username ?? 'Guest'}
            </Text>
            <Text style={tw`text-xs text-gray-500 mt-0.5`}>
              {t('profile.tapToChangeAvatar')}
            </Text>
          </View>
          <ChevronRight size={18} color="#A3A3A3" />
        </Pressable>
      </View>
    </AppContainer>
  );
}
