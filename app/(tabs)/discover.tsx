import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppContainer } from '@/components/ui/AppContainer';
import { DiscoverFeed } from '@/components/home/DiscoverFeed';
import tw from '@/lib/tw';

export default function DiscoverTab() {
  const { t } = useTranslation();
  return (
    <AppContainer bottomInset={false}>
      <View style={tw`px-4 pt-2 pb-3`}>
        <Text style={tw`text-2xl font-semibold text-gray-900`}>
          {t('discover.title')}
        </Text>
        <Text style={tw`text-xs text-gray-500 mt-0.5`}>
          {t('discover.subtitle')}
        </Text>
      </View>
      <View style={tw`flex-1`}>
        <DiscoverFeed />
      </View>
    </AppContainer>
  );
}
