import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';
import {
  useCreateCategory,
  useUpdateCategory,
} from '@/hooks/chef/useCategoryMutations';
import type { Category } from '@/types/domain';
import tw from '@/lib/tw';

interface Props {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  category?: Category | null;
}

export function CategorySheet({ visible, onClose, groupId, category }: Props) {
  const { t } = useTranslation();
  const create = useCreateCategory(groupId);
  const update = useUpdateCategory(groupId);

  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(category?.name ?? '');
  }, [visible, category]);

  const onSave = async () => {
    if (!name.trim()) {
      showToast.error(t('errors.missingFields'));
      return;
    }
    setSubmitting(true);
    try {
      if (category) {
        await update.mutateAsync({ id: category.id, name });
      } else {
        await create.mutateAsync(name);
      }
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
      onClose={onClose}
      title={category ? t('chef.editCategory') : t('chef.addCategory')}
    >
      <View style={tw`gap-3 mt-1`}>
        <Input
          label={t('chef.categoryName')}
          value={name}
          onChangeText={setName}
          autoFocus
          maxLength={30}
        />
        <View style={tw`flex-row gap-2 mt-2`}>
          <View style={tw`flex-1`}>
            <Button label={t('common.cancel')} variant="outline" fullWidth onPress={onClose} />
          </View>
          <View style={tw`flex-1`}>
            <Button
              label={category ? t('common.save') : t('common.create')}
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
