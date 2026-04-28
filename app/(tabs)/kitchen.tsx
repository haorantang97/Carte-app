import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Plus, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { AppContainer } from '@/components/ui/AppContainer';
import { EmptyState } from '@/components/ui/EmptyState';
import { CarteCard } from '@/components/carte/CarteCard';
import { AddCarteSheet } from '@/components/carte/AddCarteSheet';
import { MenuGroupSheet } from '@/components/chef/MenuGroupSheet';
import { JoinKitchenSheet } from '@/components/diner/JoinKitchenSheet';
import { UsernamePrompt } from '@/components/onboarding/UsernamePrompt';
import { useMyCartes } from '@/hooks/carte/useMyCartes';
import { useProfile } from '@/hooks/auth/useProfile';
import tw from '@/lib/tw';

export default function CarteTab() {
  const { t } = useTranslation();
  const { data: cartes, isLoading } = useMyCartes();
  const { data: profile } = useProfile();

  const [addOpen, setAddOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const goEdit = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push('/profile/edit');
  };

  return (
    <AppContainer bottomInset={false}>
      {/* Header: title + avatar (replaces Profile tab) */}
      <View style={tw`flex-row items-end justify-between px-4 pt-2 pb-4`}>
        <Text style={[tw`text-3xl text-gray-900`, { fontFamily: 'Times New Roman' }]}>
          Carte
        </Text>
        <Pressable
          onPress={goEdit}
          hitSlop={6}
          style={tw`w-10 h-10 rounded-full bg-gray-100 items-center justify-center overflow-hidden`}
        >
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={tw`w-10 h-10`} contentFit="cover" />
          ) : (
            <User size={18} color="#A3A3A3" strokeWidth={1.5} />
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={tw`px-4 pb-32`}>
        {isLoading ? (
          <View style={tw`pt-20`}>
            <ActivityIndicator size="small" color="#737373" />
          </View>
        ) : (cartes ?? []).length === 0 ? (
          <View style={tw`pt-12`}>
            <EmptyState
              title={t('chef.myMenuGroups')}
              subtitle={`${t('chef.createMenuGroup')} · ${t('diner.joinMenu')}`}
            />
          </View>
        ) : (
          <View style={tw`gap-2.5`}>
            {(cartes ?? []).map((c, i) => (
              <CarteCard key={c.id} carte={c} index={i} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* + FAB */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          setAddOpen(true);
        }}
        style={tw`absolute bottom-6 right-6 w-14 h-14 bg-gray-900 rounded-full items-center justify-center`}
      >
        <Plus size={22} color="white" />
      </Pressable>

      <AddCarteSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={() => setCreateOpen(true)}
        onJoin={() => setJoinOpen(true)}
      />
      <MenuGroupSheet visible={createOpen} onClose={() => setCreateOpen(false)} group={null} />
      <JoinKitchenSheet visible={joinOpen} onClose={() => setJoinOpen(false)} />

      <UsernamePrompt />
    </AppContainer>
  );
}
