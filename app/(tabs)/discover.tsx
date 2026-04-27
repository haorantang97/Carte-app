import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppContainer } from '@/components/ui/AppContainer';
import { EmptyState } from '@/components/ui/EmptyState';
import tw from '@/lib/tw';

export default function DiscoverTab() {
  const { t } = useTranslation();
  return (
    <AppContainer bottomInset={false}>
      <View style={tw`px-4 pb-3`}>
        <Text style={tw`text-2xl text-gray-900`}>{t('discover.title')}</Text>
        <Text style={tw`text-sm text-gray-500 mt-0.5`}>{t('discover.subtitle')}</Text>
      </View>
      <EmptyState
        title={t('discover.noPublicDishesYet')}
        subtitle={t('discover.beFirstToShare')}
      />
    </AppContainer>
  );
}
