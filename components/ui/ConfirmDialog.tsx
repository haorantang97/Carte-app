import { Modal, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { SketchBox } from '@/components/ui/sketch';
import { palette, handFont, noteFont } from '@/lib/palette';
import { useResponsive } from '@/lib/responsive';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  destructive,
  loading,
}: Props) {
  const { t } = useTranslation();
  const r = useResponsive();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(30, 58, 138, 0.35)',
          paddingHorizontal: 32,
        }}
      >
        <Pressable
          onPress={onClose}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View style={{ width: '100%', maxWidth: 340 }}>
          <SketchBox
            radius={20}
            seed={9}
            fillColor={palette.paper}
            style={{ padding: 22 }}
          >
            <Text
              style={{
                fontFamily: handFont,
                fontSize: r.fontScale(22, { min: 19, max: 26 }),
                color: palette.ink,
                lineHeight: r.fontScale(24, { min: 21, max: 28 }),
              }}
            >
              {title}
            </Text>
            {message ? (
              <Text
                style={{
                  marginTop: 8,
                  fontFamily: noteFont,
                  fontSize: r.fontScale(14, { min: 13, max: 17 }),
                  color: palette.inkSoft,
                  lineHeight: r.fontScale(20, { min: 18, max: 24 }),
                }}
              >
                {message}
              </Text>
            ) : null}
            <View style={{ marginTop: 18, flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Button
                  label={t('common.cancel')}
                  variant="outline"
                  fullWidth
                  onPress={onClose}
                  seed={10}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label={confirmLabel ?? t('common.confirm')}
                  variant={destructive ? 'destructive' : 'primary'}
                  fullWidth
                  loading={loading}
                  onPress={onConfirm}
                  seed={11}
                />
              </View>
            </View>
          </SketchBox>
        </View>
      </View>
    </Modal>
  );
}
