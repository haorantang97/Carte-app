import { useEffect, useState } from 'react';
import { Switch, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react-native';

import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Tappable } from '@/components/ui/Tappable';
import { SketchBox, SketchCircle } from '@/components/ui/sketch';
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
import { palette, handFont, noteFont, uiFont } from '@/lib/palette';

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
      <View style={{ gap: 14, marginTop: 4 }}>
        <Input
          label={t('chef.groupName')}
          value={name}
          onChangeText={setName}
          placeholder={t('chef.menuNamePlaceholder')}
          autoFocus={!isEdit}
          maxLength={40}
          seed={200}
        />

        <View>
          <Text
            style={{
              fontFamily: handFont,
              fontSize: 16,
              color: palette.ink,
              marginBottom: 6,
            }}
          >
            {t('chef.accessCode')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <SketchBox
                radius={12}
                seed={201}
                fillColor={palette.paper}
                style={{ paddingHorizontal: 14, paddingVertical: 10 }}
              >
                <TextInput
                  value={code}
                  onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  autoCapitalize="characters"
                  maxLength={6}
                  placeholderTextColor={palette.inkMute}
                  style={{
                    fontFamily: uiFont,
                    fontSize: 22,
                    letterSpacing: 8,
                    color: palette.ink,
                    fontWeight: '700',
                    textAlign: 'center',
                    padding: 0,
                    minHeight: 26,
                  }}
                />
              </SketchBox>
            </View>
            <Tappable feedback="press" onPress={() => setCode(generateCarteCode())}>
              <SketchCircle size={44} seed={202}>
                <RefreshCw size={16} color={palette.ink} strokeWidth={1.6} />
              </SketchCircle>
            </Tappable>
          </View>
        </View>

        {/* Privacy + PIN inline */}
        <SketchBox
          radius={14}
          seed={203}
          fillColor={palette.paper}
          style={{ padding: 14 }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: handFont,
                  fontSize: 18,
                  color: palette.ink,
                  lineHeight: 20,
                }}
              >
                {t('chef.private')}
              </Text>
              <Text
                style={{
                  fontFamily: noteFont,
                  fontSize: 11,
                  color: palette.inkSoft,
                  marginTop: 2,
                }}
              >
                {t('chef.enterPasswordToMakePrivate')}
              </Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: palette.inkPale, true: palette.ink }}
              thumbColor={palette.paper}
              ios_backgroundColor={palette.inkPale}
            />
          </View>
          {isPrivate ? (
            <View style={{ marginTop: 12 }}>
              <Input
                value={pin}
                onChangeText={(v) => setPinValue(v.replace(/[^0-9]/g, '').slice(0, 8))}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={8}
                placeholder={isEdit && wasPrivate ? '留空保持原 PIN' : '4–8 digits'}
                seed={204}
              />
            </View>
          ) : null}
        </SketchBox>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <View style={{ flex: 1 }}>
            <Button
              label={t('common.cancel')}
              variant="outline"
              fullWidth
              onPress={onClose}
              seed={205}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={isEdit ? t('common.save') : t('common.create')}
              fullWidth
              loading={submitting}
              onPress={onSave}
              seed={206}
            />
          </View>
        </View>
      </View>
    </Sheet>
  );
}
