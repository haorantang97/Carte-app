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
import tw from '@/lib/tw';

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Sheet({ visible, onClose, title, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={tw`flex-1 justify-end bg-black/40`}>
        <Pressable style={tw`absolute inset-0`} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={[
              tw`bg-white rounded-t-2xl px-5 pt-3`,
              { paddingBottom: insets.bottom + 16 },
            ]}
          >
            <View style={tw`items-center pb-1`}>
              <View style={tw`w-10 h-1 rounded-full bg-gray-300`} />
            </View>
            {title ? (
              <View style={tw`flex-row items-center justify-between py-2`}>
                <Text style={tw`text-base font-semibold text-gray-900`}>{title}</Text>
                <Pressable onPress={onClose} hitSlop={8} style={tw`p-1`}>
                  <X size={18} color="#737373" />
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
