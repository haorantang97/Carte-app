import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react-native';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  useCreateMenuGroup,
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

export function MenuGroupSheet({ visible, onClose, group }: Props) {
  const { t } = useTranslation();
  const create = useCreateMenuGroup();
  const update = useUpdateMenuGroup();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (group) {
      setName(group.name);
      setCode(group.access_code);
    } else {
      setName('');
      setCode(generateCarteCode());
    }
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
    setSubmitting(true);
    try {
      if (group) {
        await update.mutateAsync({ id: group.id, name: name.trim(), access_code: cleanCode });
      } else {
        await create.mutateAsync({ name: name.trim(), access_code: cleanCode });
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
          <Text style={tw`mt-1 text-[11px] text-gray-500`}>
            6 chars (A–Z, 2–9). Long-press a Carte card later to copy.
          </Text>
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
