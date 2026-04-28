import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { ChefHat, ChevronRight, Lock, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';
import tw from '@/lib/tw';
import type { MyCarte } from '@/hooks/carte/useMyCartes';
import { showToast } from '@/components/ui/Toast';

interface Props {
  carte: MyCarte;
  index: number;
}

export function CarteCard({ carte, index }: Props) {
  const { t } = useTranslation();

  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    if (carte.is_mine) {
      router.push(`/chef/group/${carte.id}`);
    } else {
      router.push(`/diner/group/${carte.id}`);
    }
  };

  const handleLongPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await Clipboard.setStringAsync(carte.access_code);
    showToast.success(t('chef.carteCodeCopied'), carte.access_code);
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(280)}>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={650}
        style={({ pressed }) => [
          tw`bg-white border border-gray-200 rounded-2xl px-4 py-3 flex-row items-center`,
          { opacity: pressed ? 0.85 : 1 },
        ]}
      >
        {/* Left avatar/glyph */}
        <View
          style={tw`w-12 h-12 rounded-full bg-gray-100 items-center justify-center overflow-hidden`}
        >
          {carte.is_mine ? (
            <ChefHat size={20} color="#404040" strokeWidth={1.5} />
          ) : carte.chef_avatar_url ? (
            <Image
              source={{ uri: carte.chef_avatar_url }}
              style={tw`w-12 h-12`}
              contentFit="cover"
            />
          ) : (
            <User size={20} color="#A3A3A3" strokeWidth={1.5} />
          )}
        </View>

        {/* Middle */}
        <View style={tw`flex-1 ml-3`}>
          <View style={tw`flex-row items-center`}>
            <Text style={tw`text-base font-medium text-gray-900`} numberOfLines={1}>
              {carte.name}
            </Text>
            {carte.is_private ? (
              <View style={tw`ml-2`}>
                <Lock size={11} color="#A68B6A" strokeWidth={2} />
              </View>
            ) : null}
          </View>
          <View style={tw`flex-row items-center mt-0.5`}>
            <Text style={tw`text-[11px] text-gray-500`}>
              {carte.is_mine ? t('chef.editMode') : carte.chef_username}
            </Text>
            <Text style={tw`mx-1.5 text-[11px] text-gray-300`}>·</Text>
            <Text
              style={[
                tw`text-[11px] text-gray-500`,
                { fontFamily: 'Menlo', letterSpacing: 1 },
              ]}
            >
              {carte.access_code}
            </Text>
          </View>
        </View>

        <ChevronRight size={18} color="#A3A3A3" />
      </Pressable>
    </Animated.View>
  );
}
