import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppContainer } from '@/components/ui/AppContainer';
import tw from '@/lib/tw';

export default function KitchenTab() {
  const { t } = useTranslation();
  return (
    <AppContainer bottomInset={false}>
      <View style={tw`flex-row items-end justify-between px-4 pb-4`}>
        <Text style={[tw`text-3xl text-gray-900`, { fontFamily: 'Times New Roman' }]}>
          Carte
        </Text>
        <Text style={tw`text-sm text-gray-500`}>{t('home.welcome')}</Text>
      </View>
      <View style={tw`flex-1 items-center justify-center px-6`}>
        <Text style={tw`text-base text-gray-700 text-center`}>{t('home.selectMode')}</Text>
        <Text style={tw`mt-2 text-xs text-gray-500 text-center`}>
          (Phase D will fill in the Chef / Diner mode cards.)
        </Text>
      </View>
    </AppContainer>
  );
}
