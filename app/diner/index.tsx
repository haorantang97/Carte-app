import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react-native';
import { AppContainer } from '@/components/ui/AppContainer';
import { BackButton } from '@/components/ui/BackButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { KitchenCard } from '@/components/diner/KitchenCard';
import { JoinKitchenSheet } from '@/components/diner/JoinKitchenSheet';
import { useJoinedKitchens } from '@/hooks/diner/useJoinedKitchens';
import tw from '@/lib/tw';

export default function DinerHome() {
  const { t } = useTranslation();
  const { data: kitchens, isLoading } = useJoinedKitchens();
  const [joinOpen, setJoinOpen] = useState(false);

  return (
    <AppContainer>
      <View style={tw`flex-row items-center px-4 pt-1 pb-3`}>
        <BackButton />
        <Text style={tw`flex-1 ml-2 text-xl font-semibold text-gray-900`}>
          {t('diner.myMenus')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={tw`px-4 pb-32`}>
        {isLoading ? (
          <View style={tw`pt-20`}>
            <ActivityIndicator size="small" color="#737373" />
          </View>
        ) : (kitchens ?? []).length === 0 ? (
          <View style={tw`pt-12`}>
            <EmptyState title={t('diner.myMenus')} subtitle={t('diner.joinKitchen')} />
          </View>
        ) : (
          <View style={tw`gap-2.5`}>
            {(kitchens ?? []).map((k, i) => (
              <KitchenCard key={k.groupId} kitchen={k} index={i} />
            ))}
          </View>
        )}

        <Pressable
          onPress={() => setJoinOpen(true)}
          style={({ pressed }) => [
            tw`mt-3 flex-row items-center justify-center bg-white border border-dashed border-gray-300 rounded-2xl py-4`,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Plus size={16} color="#737373" />
          <Text style={tw`ml-2 text-sm text-gray-600`}>{t('diner.joinMenu')}</Text>
        </Pressable>
      </ScrollView>

      <JoinKitchenSheet visible={joinOpen} onClose={() => setJoinOpen(false)} />
    </AppContainer>
  );
}
