import { Pressable, Text, View } from 'react-native';
import { ChefHat, KeyRound } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { Sheet } from '@/components/ui/Sheet';
import tw from '@/lib/tw';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreate: () => void;
  onJoin: () => void;
}

export function AddCarteSheet({ visible, onClose, onCreate, onJoin }: Props) {
  const { t } = useTranslation();

  const handle = (fn: () => void) => () => {
    Haptics.selectionAsync().catch(() => {});
    onClose();
    setTimeout(fn, 240); // wait for sheet close animation
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={tw`gap-2 mt-1 pb-2`}>
        <Pressable
          onPress={handle(onCreate)}
          style={({ pressed }) => [
            tw`flex-row items-center bg-white border border-gray-200 rounded-2xl p-4`,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <View style={tw`w-11 h-11 rounded-full bg-gray-100 items-center justify-center`}>
            <ChefHat size={20} color="#171717" strokeWidth={1.5} />
          </View>
          <View style={tw`flex-1 ml-3`}>
            <Text style={tw`text-base font-medium text-gray-900`}>
              {t('chef.createMenuGroup')}
            </Text>
            <Text style={tw`text-xs text-gray-500 mt-0.5`}>{t('home.chefDescription')}</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={handle(onJoin)}
          style={({ pressed }) => [
            tw`flex-row items-center bg-white border border-gray-200 rounded-2xl p-4`,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <View style={tw`w-11 h-11 rounded-full bg-gray-100 items-center justify-center`}>
            <KeyRound size={20} color="#171717" strokeWidth={1.5} />
          </View>
          <View style={tw`flex-1 ml-3`}>
            <Text style={tw`text-base font-medium text-gray-900`}>
              {t('diner.joinMenu')}
            </Text>
            <Text style={tw`text-xs text-gray-500 mt-0.5`}>{t('home.dinerDescription')}</Text>
          </View>
        </Pressable>
      </View>
    </Sheet>
  );
}
