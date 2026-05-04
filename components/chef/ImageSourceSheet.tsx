import { Text, View } from 'react-native';
import { Camera, ImageIcon, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Sheet } from '@/components/ui/Sheet';
import { Tappable } from '@/components/ui/Tappable';
import { SketchBox, SketchCircle } from '@/components/ui/sketch';
import { palette, handFont, noteFont } from '@/lib/palette';

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
  seed: number;
  onPress: () => void;
  disabled?: boolean;
  highlight?: boolean;
}

function OptionRow({
  Icon,
  title,
  hint,
  seed,
  onPress,
  disabled,
  highlight,
}: OptionRowProps) {
  return (
    <Tappable feedback="lift" onPress={onPress} disabled={disabled}>
      <View style={{ opacity: disabled ? 0.4 : 1 }}>
        <SketchBox
          radius={16}
          seed={seed}
          fillColor={palette.paper}
          strokeWidth={highlight ? 2 : 1.5}
          style={{ padding: 14, flexDirection: 'row', alignItems: 'center' }}
        >
          <SketchCircle size={42} seed={seed + 100}>
            <Icon size={20} color={palette.ink} strokeWidth={1.5} />
          </SketchCircle>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text
              style={{
                fontFamily: handFont,
                fontSize: 22,
                color: palette.ink,
                lineHeight: 23,
                fontWeight: highlight ? '700' : '400',
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
              {hint}
            </Text>
          </View>
        </SketchBox>
      </View>
    </Tappable>
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
      <View style={{ gap: 12, marginTop: 4, paddingBottom: 8 }}>
        <OptionRow
          Icon={ImageIcon}
          title="从相册选择"
          hint="挑一张已有的菜品照片"
          seed={500}
          onPress={handle(onPickGallery)}
        />
        <OptionRow
          Icon={Camera}
          title="拍照"
          hint="现拍现传"
          seed={501}
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
          seed={502}
          onPress={handle(onPickAI)}
          disabled={!aiAvailable}
          highlight={aiAvailable}
        />
      </View>
    </Sheet>
  );
}
