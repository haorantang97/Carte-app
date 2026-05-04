import { Text, View } from 'react-native';
import { ChefHat, Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { Sheet } from '@/components/ui/Sheet';
import { Tappable } from '@/components/ui/Tappable';
import { SketchBox, SketchCircle } from '@/components/ui/sketch';
import { palette, handFont, noteFont } from '@/lib/palette';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreate: () => void;
  onJoin: () => void;
}

export function AddCarteSheet({ visible, onClose, onCreate, onJoin }: Props) {
  useTranslation();

  const handle = (fn: () => void) => () => {
    Haptics.selectionAsync().catch(() => {});
    onClose();
    setTimeout(fn, 240);
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="新建 / 加入">
      <View style={{ gap: 12, marginTop: 4, paddingBottom: 8 }}>
        <Choice
          seed={5}
          icon={<ChefHat size={22} color={palette.ink} strokeWidth={1.5} />}
          title="创建新 Carte"
          subtitle="开一张属于自己的私密菜单"
          onPress={handle(onCreate)}
        />
        <Choice
          seed={6}
          icon={<Users size={22} color={palette.ink} strokeWidth={1.5} />}
          title="加入朋友 Carte"
          subtitle="用 6 位访问码 + PIN 加入"
          onPress={handle(onJoin)}
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
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Tappable feedback="lift" onPress={onPress}>
      <SketchBox
        radius={16}
        seed={seed}
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
