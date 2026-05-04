import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { palette, handFont } from '@/lib/palette';
import { useResponsive } from '@/lib/responsive';

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Sheet({ visible, onClose, title, children }: Props) {
  const insets = useSafeAreaInsets();
  const r = useResponsive();
  // On tablets, present sheet as centered card. On phones, slide up from bottom.
  const isCard = r.isTablet;
  const padH = r.scale(22, { min: 16, max: 28 });

  return (
    <Modal
      visible={visible}
      transparent
      animationType={isCard ? 'fade' : 'slide'}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          justifyContent: isCard ? 'center' : 'flex-end',
          alignItems: isCard ? 'center' : 'stretch',
          paddingHorizontal: isCard ? 24 : 0,
          backgroundColor: 'rgba(30, 58, 138, 0.35)',
        }}
      >
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={onClose}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={isCard ? { width: '100%', maxWidth: 560 } : undefined}
        >
          <View
            style={{
              backgroundColor: palette.paper,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderBottomLeftRadius: isCard ? 24 : 0,
              borderBottomRightRadius: isCard ? 24 : 0,
              paddingHorizontal: padH,
              paddingTop: 12,
              paddingBottom: isCard ? 22 : insets.bottom + 16,
            }}
          >
            <View style={{ alignItems: 'center', paddingBottom: 4 }}>
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 999,
                  backgroundColor: palette.inkPale,
                }}
              />
            </View>
            {title ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 8,
                }}
              >
                <Text
                  style={{
                    fontFamily: handFont,
                    fontSize: r.fontScale(24, { min: 20, max: 28 }),
                    color: palette.ink,
                    lineHeight: r.fontScale(26, { min: 22, max: 30 }),
                  }}
                >
                  {title}
                </Text>
                <Pressable
                  onPress={onClose}
                  hitSlop={8}
                  style={{ padding: 4 }}
                >
                  <X size={18} color={palette.ink} />
                </Pressable>
              </View>
            ) : null}
            {children}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
