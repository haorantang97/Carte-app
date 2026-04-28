import { useEffect, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react-native';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  useCreateMenuGroup,
  useSetCartePassword,
  useUpdateMenuGroup,
} from '@/hooks/chef/useMenuGroups';
import {
  generateCarteCode,
  isValidCarteCode,
  normalizeCarteCode,
} from '@/lib/carteCode';
import { showToast } from '@/components/ui/Toast';
import type { MenuGroup } from '@/types/domain';
import tw from '@/lib/tw';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** If provided, sheet is in edit mode; otherwise create. */
  group?: MenuGroup | null;
}

/**
 * Single-form Carte editor.
 * 修复:原版"切换私密"和"设置 PIN"是两个独立操作 + 中间不存在状态。
 * 这里把 name / access_code / is_private / PIN 全放在一张表单,一次保存。
 */
export function MenuGroupSheet({ visible, onClose, group }: Props) {
  const { t } = useTranslation();
  const create = useCreateMenuGroup();
  const update = useUpdateMenuGroup();
  const setPin = useSetCartePassword();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [pin, setPinValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const wasPrivate = !!group?.is_private;

  useEffect(() => {
    if (!visible) return;
    if (group) {
      setName(group.name);
      setCode(group.access_code);
      setIsPrivate(group.is_private);
    } else {
      setName('');
      setCode(generateCarteCode());
      setIsPrivate(false);
    }
    setPinValue('');
  }, [visible, group]);

  const onSave = async () => {
    const cleanCode = normalizeCarteCode(code);
    if (!name.trim()) {
      showToast.error(t('errors.missingFields'));
      return;
    }
    if (!isValidCarteCode(cleanCode)) {
      showToast.error('Invalid Carte Code');
      return;
    }
    // If user wants private but new carte (or never set PIN), require a PIN
    if (isPrivate && !group && !pin.trim()) {
      showToast.error(t('chef.enterPasswordToMakePrivate'));
      return;
    }
    if (isPrivate && !wasPrivate && !pin.trim()) {
      showToast.error(t('chef.enterPasswordToMakePrivate'));
      return;
    }

    setSubmitting(true);
    try {
      let groupId: string;

      if (group) {
        const updated = await update.mutateAsync({
          id: group.id,
          name: name.trim(),
          access_code: cleanCode,
        });
        groupId = updated.id;
      } else {
        const created = await create.mutateAsync({
          name: name.trim(),
          access_code: cleanCode,
        });
        groupId = created.id;
      }

      // Privacy / PIN
      const togglingPrivacy = isPrivate !== wasPrivate;
      const settingPinFresh = isPrivate && pin.trim().length > 0;
      const turningPublic = !isPrivate && wasPrivate;

      if (togglingPrivacy || settingPinFresh) {
        // PIN to send: empty string clears (turns public); non-empty sets/replaces
        await setPin.mutateAsync({
          groupId,
          pin: turningPublic ? '' : pin.trim(),
        });
      }

      onClose();
    } catch (e: any) {
      showToast.error(e?.message ?? 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const isEdit = !!group;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={isEdit ? t('chef.editMenuGroup') : t('chef.createMenuGroup')}
    >
      <View style={tw`gap-3 mt-1`}>
        <Input
          label={t('chef.groupName')}
          value={name}
          onChangeText={setName}
          placeholder={t('chef.menuNamePlaceholder')}
          autoFocus={!isEdit}
          maxLength={40}
        />

        <View>
          <Text style={tw`text-xs font-medium text-gray-700 mb-1.5`}>
            {t('chef.accessCode')}
          </Text>
          <View style={tw`flex-row gap-2`}>
            <View style={tw`flex-1`}>
              <Input
                value={code}
                onChangeText={(v) => setCode(v.toUpperCase())}
                autoCapitalize="characters"
                maxLength={6}
                style={[tw`text-base text-center`, { letterSpacing: 4, fontFamily: 'Menlo' }]}
              />
            </View>
            <Pressable
              onPress={() => setCode(generateCarteCode())}
              style={tw`w-12 h-12 items-center justify-center bg-gray-100 rounded-lg`}
            >
              <RefreshCw size={16} color="#404040" />
            </Pressable>
          </View>
        </View>

        {/* Privacy + PIN inline */}
        <View style={tw`bg-gray-50 rounded-lg p-3`}>
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-1`}>
              <Text style={tw`text-sm font-medium text-gray-900`}>{t('chef.private')}</Text>
              <Text style={tw`text-[11px] text-gray-500 mt-0.5`}>
                {t('chef.enterPasswordToMakePrivate')}
              </Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: '#D4D4D4', true: '#A68B6A' }}
              thumbColor="white"
            />
          </View>
          {isPrivate ? (
            <View style={tw`mt-3`}>
              <Input
                value={pin}
                onChangeText={(v) => setPinValue(v.replace(/[^0-9]/g, '').slice(0, 8))}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={8}
                placeholder={
                  isEdit && wasPrivate
                    ? '留空保持原 PIN'
                    : '4–8 digits'
                }
              />
            </View>
          ) : null}
        </View>

        <View style={tw`flex-row gap-2 mt-3`}>
          <View style={tw`flex-1`}>
            <Button label={t('common.cancel')} variant="outline" fullWidth onPress={onClose} />
          </View>
          <View style={tw`flex-1`}>
            <Button
              label={isEdit ? t('common.save') : t('common.create')}
              fullWidth
              loading={submitting}
              onPress={onSave}
            />
          </View>
        </View>
      </View>
    </Sheet>
  );
}
