import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useSetCartePassword } from '@/hooks/chef/useMenuGroups';
import { showToast } from '@/components/ui/Toast';
import tw from '@/lib/tw';

interface Props {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  /** When true, sheet is asking to set a NEW PIN (becoming private). */
  isMakingPrivate: boolean;
}

export function PrivacyPasswordSheet({ visible, onClose, groupId, isMakingPrivate }: Props) {
  const { t } = useTranslation();
  const setPin = useSetCartePassword();
  const [pin, setPinValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onConfirm = async () => {
    if (isMakingPrivate && pin.length < 4) {
      showToast.error(t('errors.missingFields'));
      return;
    }
    setSubmitting(true);
    try {
      await setPin.mutateAsync({ groupId, pin: isMakingPrivate ? pin : '' });
      setPinValue('');
      onClose();
    } catch (e: any) {
      showToast.error(e?.message ?? 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={() => {
        setPinValue('');
        onClose();
      }}
      title={
        isMakingPrivate ? t('chef.setPasswordForPrivateCarte') : t('chef.public')
      }
    >
      <View style={tw`gap-3 mt-1`}>
        {isMakingPrivate ? (
          <Input
            label={t('chef.enterPasswordForPrivate')}
            value={pin}
            onChangeText={(v) => setPinValue(v.replace(/[^0-9]/g, '').slice(0, 8))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={8}
            placeholder="4–8 digits"
            hint={t('chef.enterPasswordToMakePrivate')}
          />
        ) : null}
        <View style={tw`flex-row gap-2 mt-3`}>
          <View style={tw`flex-1`}>
            <Button
              label={t('common.cancel')}
              variant="outline"
              fullWidth
              onPress={() => {
                setPinValue('');
                onClose();
              }}
            />
          </View>
          <View style={tw`flex-1`}>
            <Button
              label={t('common.confirm')}
              fullWidth
              loading={submitting}
              onPress={onConfirm}
            />
          </View>
        </View>
      </View>
    </Sheet>
  );
}
