import { Camera, Pencil, Sparkles } from 'lucide-react-native';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Sheet } from '@/components/ui/Sheet';
import { Tappable } from '@/components/ui/Tappable';
import { SketchBox, SketchCircle } from '@/components/ui/sketch';
import { showToast } from '@/components/ui/Toast';
import { palette, handFont, noteFont } from '@/lib/palette';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPickManual: () => void;
  onPickSmart: () => void;
  onPickPhoto?: () => void;
}

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
      <View style={{ gap: 12, marginTop: 4, paddingBottom: 8 }}>
        <Choice
          seed={3}
          icon={<Sparkles size={22} color={palette.ink} strokeWidth={1.5} />}
          title="AI 智能填充"
          subtitle="链接 / 文字 / 图片 → 自动生成菜谱"
          onPress={handle(onPickSmart)}
        />
        <Choice
          seed={5}
          icon={<Camera size={22} color={palette.ink} strokeWidth={1.5} />}
          title="拍照识别"
          subtitle="拍菜谱、食材清单或成菜图"
          onPress={handle(onPhoto)}
        />
        <Choice
          seed={7}
          icon={<Pencil size={22} color={palette.ink} strokeWidth={1.5} />}
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
    <Tappable feedback="lift" onPress={onPress}>
      <SketchBox
        seed={seed}
        radius={16}
        fillColor={palette.paper}
        style={{ padding: 14, flexDirection: 'row', alignItems: 'center' }}
      >
        <SketchCircle size={42} seed={seed + 100}>
          {icon}
        </SketchCircle>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            style={{
              fontFamily: handFont,
              fontSize: 22,
              color: palette.ink,
              lineHeight: 23,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontFamily: noteFont,
              fontSize: 12,
              color: palette.inkSoft,
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: handFont,
            fontSize: 22,
            color: palette.inkMute,
            marginLeft: 8,
          }}
        >
          →
        </Text>
      </SketchBox>
    </Tappable>
  );
}
