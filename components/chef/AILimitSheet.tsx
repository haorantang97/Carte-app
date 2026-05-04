import { AlertCircle } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Sheet } from '@/components/ui/Sheet';
import { Tappable } from '@/components/ui/Tappable';
import { SketchBox } from '@/components/ui/sketch';
import { useAiQuota } from '@/hooks/useAiQuota';
import { palette, handFont, noteFont } from '@/lib/palette';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPickManual?: () => void;
  onUpgrade?: () => void;
}

export function AILimitSheet({ visible, onClose, onPickManual, onUpgrade }: Props) {
  const quota = useAiQuota();
  return (
    <Sheet visible={visible} onClose={onClose} title=" ">
      <View style={{ alignItems: 'center', paddingBottom: 8 }}>
        <AlertCircle size={28} color={palette.ink} strokeWidth={1.5} />
        <Text
          style={{
            fontFamily: handFont,
            fontSize: 22,
            color: palette.ink,
            marginTop: 8,
            lineHeight: 24,
          }}
        >
          AI 额度用完了
        </Text>
        <Text
          style={{
            fontFamily: noteFont,
            fontSize: 13,
            color: palette.inkSoft,
            marginTop: 6,
            textAlign: 'center',
            paddingHorizontal: 24,
            lineHeight: 20,
          }}
        >
          本月已用 {quota.used} / {quota.limit} 次{'\n'}可继续手动添加,或升级 Pro 解除上限
        </Text>
        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            marginTop: 20,
            alignSelf: 'stretch',
          }}
        >
          <View style={{ flex: 1 }}>
            <Tappable
              feedback="press"
              onPress={() => {
                onClose();
                setTimeout(() => onPickManual?.(), 240);
              }}
            >
              <SketchBox
                seed={21}
                radius={999}
                fillColor={palette.paper}
                style={{ paddingVertical: 12 }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontFamily: handFont,
                    fontSize: 18,
                    color: palette.inkSoft,
                  }}
                >
                  手动添加
                </Text>
              </SketchBox>
            </Tappable>
          </View>
          <View style={{ flex: 1 }}>
            <Tappable
              feedback="press"
              onPress={() => {
                onClose();
                setTimeout(() => onUpgrade?.(), 240);
              }}
            >
              <SketchBox
                seed={22}
                radius={999}
                strokeWidth={2}
                fillColor={palette.paper}
                style={{ paddingVertical: 12 }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontFamily: handFont,
                    fontSize: 18,
                    color: palette.ink,
                    fontWeight: '700',
                  }}
                >
                  升级 Pro
                </Text>
              </SketchBox>
            </Tappable>
          </View>
        </View>
      </View>
    </Sheet>
  );
}
