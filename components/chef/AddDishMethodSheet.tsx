import { Camera, Pencil, Sparkles } from 'lucide-react-native';
import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Sheet } from '@/components/ui/Sheet';
import { SketchBox, SketchCircle } from '@/components/ui/sketch';
import { showToast } from '@/components/ui/Toast';
import tw from '@/lib/tw';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPickManual: () => void;
  onPickSmart: () => void;
  /** Optional photo-recognition entry; if omitted, shows a "coming soon" toast. */
  onPickPhoto?: () => void;
}

/**
 * 3-equal-button add-dish chooser. Per design call, AI quota is NOT shown on
 * cards (atmospheric / non-commercial); it lives only on the Profile screen
 * and the AILimitSheet appears when the user actually hits the cap.
 */
export function AddDishMethodSheet({
  visible,
  onClose,
  onPickManual,
  onPickSmart,
  onPickPhoto,
}: Props) {
  const handle = (fn: () => void) => () => {
    Haptics.selectionAsync().catch(() => {});
    onClose();
    setTimeout(fn, 240);
  };

  const onPhoto =
    onPickPhoto ??
    (() => {
      showToast.info('拍照识别即将上线');
    });

  return (
    <Sheet visible={visible} onClose={onClose} title="添加菜品">
      <View style={tw`gap-2.5 mt-1 pb-2`}>
        <Choice
          seed={3}
          icon={<Sparkles size={20} color="#171717" strokeWidth={1.5} />}
          title="AI 智能填充"
          subtitle="链接 / 文字 / 图片 → 自动生成菜谱"
          onPress={handle(onPickSmart)}
        />
        <Choice
          seed={5}
          icon={<Camera size={20} color="#171717" strokeWidth={1.5} />}
          title="拍照识别"
          subtitle="拍菜谱、食材清单或成菜图"
          onPress={handle(onPhoto)}
        />
        <Choice
          seed={7}
          icon={<Pencil size={20} color="#171717" strokeWidth={1.5} />}
          title="手动添加"
          subtitle="自己写菜名、食材和做法"
          onPress={handle(onPickManual)}
        />
      </View>
    </Sheet>
  );
}

function Choice({
  seed,
  icon,
  title,
  subtitle,
  onPress,
}: {
  seed: number;
  icon: ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
    >
      <SketchBox seed={seed} radius={16} style={tw`p-4 flex-row items-center`}>
        <SketchCircle size={42}>{icon}</SketchCircle>
        <View style={tw`flex-1 ml-3`}>
          <Text style={tw`text-base font-medium text-gray-900`}>{title}</Text>
          <Text style={tw`text-xs text-gray-500 mt-0.5`}>{subtitle}</Text>
        </View>
        <Text style={tw`text-gray-400 text-lg ml-2`}>→</Text>
      </SketchBox>
    </Pressable>
  );
}
