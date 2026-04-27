import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppContainer } from '@/components/ui/AppContainer';
import { useProfile } from '@/hooks/auth/useProfile';
import tw from '@/lib/tw';

export default function ProfileTab() {
  const { t } = useTranslation();
  const { data: profile } = useProfile();

  return (
    <AppContainer bottomInset={false}>
      <View style={tw`px-4 pb-4`}>
        <Text style={tw`text-2xl text-gray-900`}>{t('profile.title')}</Text>
      </View>
      <View style={tw`px-4 gap-3`}>
        <View style={tw`bg-white border border-gray-200 rounded-lg p-4`}>
          <Text style={tw`text-base text-gray-900 font-medium`}>
            {profile?.username ?? 'Guest'}
          </Text>
          <Text style={tw`text-xs text-gray-500 mt-1`}>
            id: {profile?.id ?? '...'}
          </Text>
        </View>
        <Text style={tw`text-xs text-gray-500 text-center mt-4`}>
          (Phase H: avatar + username editor)
        </Text>
      </View>
    </AppContainer>
  );
}
