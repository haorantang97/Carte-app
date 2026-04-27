import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { ChefHat, Utensils } from 'lucide-react-native';
import { AppContainer } from '@/components/ui/AppContainer';
import { ModeCard } from '@/components/home/ModeCard';
import tw from '@/lib/tw';

export default function KitchenTab() {
  const { t } = useTranslation();
  return (
    <AppContainer bottomInset={false}>
      <View style={tw`flex-row items-end justify-between px-4 pt-2 pb-4`}>
        <Text
          style={[tw`text-3xl text-gray-900`, { fontFamily: 'Times New Roman' }]}
        >
          Carte
        </Text>
        <Text style={tw`text-xs text-gray-500 mb-1`}>{t('home.welcome')}</Text>
      </View>
      <View style={tw`flex-1 px-4 gap-2 pb-4`}>
        <ModeCard
          title={t('home.enterAsChef')}
          description={t('home.chefDescription')}
          Icon={ChefHat}
          delay={0}
          onPress={() => router.push('/chef')}
        />
        <ModeCard
          title={t('home.enterAsDiner')}
          description={t('home.dinerDescription')}
          Icon={Utensils}
          delay={100}
          onPress={() => router.push('/diner')}
        />
      </View>
    </AppContainer>
  );
}
