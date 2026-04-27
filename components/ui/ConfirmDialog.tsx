import { Modal, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import tw from '@/lib/tw';

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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={tw`flex-1 items-center justify-center bg-black/40 px-8`}>
        <Pressable onPress={onClose} style={tw`absolute inset-0`} />
        <View style={tw`w-full max-w-sm bg-white rounded-2xl p-5`}>
          <Text style={tw`text-base font-semibold text-gray-900`}>{title}</Text>
          {message ? (
            <Text style={tw`mt-2 text-sm text-gray-600 leading-relaxed`}>{message}</Text>
          ) : null}
          <View style={tw`mt-5 flex-row gap-2`}>
            <View style={tw`flex-1`}>
              <Button label={t('common.cancel')} variant="outline" fullWidth onPress={onClose} />
            </View>
            <View style={tw`flex-1`}>
              <Button
                label={confirmLabel ?? t('common.confirm')}
                variant={destructive ? 'destructive' : 'primary'}
                fullWidth
                loading={loading}
                onPress={onConfirm}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
