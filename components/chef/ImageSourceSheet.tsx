import { Pressable, Text, View } from 'react-native';
import { Camera, ImageIcon, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Sheet } from '@/components/ui/Sheet';
import tw from '@/lib/tw';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPickGallery: () => void;
  onPickCamera: () => void;
  onPickAI: () => void;
  /** When false, AI option is disabled with hint to fill name first */
  aiAvailable: boolean;
}

interface OptionRowProps {
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  title: string;
  hint: string;
  onPress: () => void;
  disabled?: boolean;
  highlight?: boolean;
}

function OptionRow({ Icon, title, hint, onPress, disabled, highlight }: OptionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        tw.style(
          'flex-row items-center bg-white border rounded-2xl p-4',
          highlight ? 'border-[#A68B6A]' : 'border-gray-200',
        ),
        { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
      ]}
    >
      <View
        style={tw.style(
          'w-11 h-11 rounded-full items-center justify-center',
          highlight ? 'bg-[#FAF6EE]' : 'bg-gray-100',
        )}
      >
        <Icon size={20} color={highlight ? '#A68B6A' : '#171717'} strokeWidth={1.5} />
      </View>
      <View style={tw`flex-1 ml-3`}>
        <Text style={tw`text-base font-medium text-gray-900`}>{title}</Text>
        <Text style={tw`text-xs text-gray-500 mt-0.5`}>{hint}</Text>
      </View>
    </Pressable>
  );
}

export function ImageSourceSheet({
  visible,
  onClose,
  onPickGallery,
  onPickCamera,
  onPickAI,
  aiAvailable,
}: Props) {
  const handle = (fn: () => void) => () => {
    Haptics.selectionAsync().catch(() => {});
    onClose();
    setTimeout(fn, 240);
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="选择菜品图片来源">
      <View style={tw`gap-2 mt-1 pb-2`}>
        <OptionRow
          Icon={ImageIcon}
          title="从相册选择"
          hint="挑一张已有的菜品照片"
          onPress={handle(onPickGallery)}
        />
        <OptionRow
          Icon={Camera}
          title="拍照"
          hint="现拍现传"
          onPress={handle(onPickCamera)}
        />
        <OptionRow
          Icon={Sparkles}
          title="AI 生图"
          hint={
            aiAvailable
              ? '根据菜名 + 描述生成手绘风格菜品图(约 60-90 秒)'
              : '先填写菜名,AI 才能根据它生成图'
          }
          onPress={handle(onPickAI)}
          disabled={!aiAvailable}
          highlight={aiAvailable}
        />
      </View>
    </Sheet>
  );
}
