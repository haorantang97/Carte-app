import { Pressable, Text, View } from 'react-native';
import { ChevronRight, Pencil, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';
import tw from '@/lib/tw';
import type { MenuGroup } from '@/types/domain';
import { showToast } from '@/components/ui/Toast';

interface Props {
  group: MenuGroup;
  editMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
}

export function MenuGroupCard({ group, editMode, onEdit, onDelete, index }: Props) {
  const { t } = useTranslation();

  const handlePress = () => {
    if (editMode) return;
    Haptics.selectionAsync().catch(() => {});
    router.push(`/chef/group/${group.id}`);
  };

  const handleLongPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await Clipboard.setStringAsync(group.access_code);
    showToast.success(t('chef.carteCodeCopied'), `${group.access_code}`);
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(300)}>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={650}
        style={({ pressed }) => [
          tw`bg-white border border-gray-200 rounded-2xl px-4 py-3 flex-row items-center`,
          { opacity: pressed && !editMode ? 0.7 : 1 },
        ]}
      >
        <Text style={tw`text-2xl mr-3`}>🍽️</Text>
        <View style={tw`flex-1`}>
          <Text style={tw`text-base font-medium text-gray-900`} numberOfLines={1}>
            {group.name}
          </Text>
          <View style={tw`flex-row items-center mt-0.5`}>
            <Text
              style={[
                tw`text-xs text-gray-500`,
                { fontFamily: 'Menlo', letterSpacing: 1 },
              ]}
            >
              {group.access_code}
            </Text>
            {group.is_private ? (
              <Text style={tw`ml-2 text-[10px] text-[#A68B6A]`}>· {t('chef.private')}</Text>
            ) : null}
          </View>
        </View>
        {editMode ? (
          <View style={tw`flex-row gap-2`}>
            <Pressable
              onPress={onEdit}
              hitSlop={8}
              style={tw`w-9 h-9 rounded-full bg-white/90 border border-gray-200 items-center justify-center`}
            >
              <Pencil size={14} color="#404040" />
            </Pressable>
            <Pressable
              onPress={onDelete}
              hitSlop={8}
              style={tw`w-9 h-9 rounded-full bg-white/90 border border-gray-200 items-center justify-center`}
            >
              <Trash2 size={14} color="#A30000" />
            </Pressable>
          </View>
        ) : (
          <ChevronRight size={18} color="#A3A3A3" />
        )}
      </Pressable>
    </Animated.View>
  );
}
