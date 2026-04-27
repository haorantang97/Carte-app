import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Camera } from 'lucide-react-native';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { IngredientsInput } from '@/components/chef/IngredientsInput';
import { showToast } from '@/components/ui/Toast';
import { useCreateDish, useUpdateDish } from '@/hooks/chef/useDishMutations';
import { usePickAndUploadImage } from '@/hooks/storage/useImageUpload';
import type { Dish } from '@/types/domain';
import { parsePrice } from '@/lib/price';
import tw from '@/lib/tw';

interface Props {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  categoryId: string | null;
  dish?: Dish | null;
}

export function DishSheet({ visible, onClose, groupId, categoryId, dish }: Props) {
  const { t } = useTranslation();
  const create = useCreateDish(groupId);
  const update = useUpdateDish(groupId);
  const upload = usePickAndUploadImage('menu-images');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [recipe, setRecipe] = useState('');
  const [recipeIsPrivate, setRecipeIsPrivate] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (dish) {
      setName(dish.name);
      setDescription(dish.description ?? '');
      setPriceStr(String(dish.price ?? ''));
      setImageUrl(dish.image_url);
      setRecipe(dish.recipe ?? '');
      setRecipeIsPrivate(dish.recipe_is_private);
      setIngredients(Array.isArray(dish.ingredients) ? (dish.ingredients as string[]) : []);
    } else {
      setName('');
      setDescription('');
      setPriceStr('');
      setImageUrl(null);
      setRecipe('');
      setRecipeIsPrivate(false);
      setIngredients([]);
    }
  }, [visible, dish]);

  const pickImage = async () => {
    try {
      const url = await upload.mutateAsync();
      if (url) setImageUrl(url);
    } catch (e: any) {
      if (e?.message !== 'Permission denied') {
        showToast.error(e?.message ?? 'Failed to upload');
      }
    }
  };

  const onSave = async () => {
    if (!name.trim()) {
      showToast.error(t('errors.missingFields'));
      return;
    }
    if (!categoryId && !dish) {
      showToast.error('No category selected');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        price: parsePrice(priceStr),
        image_url: imageUrl,
        recipe: recipe.trim() || null,
        recipe_is_private: recipeIsPrivate,
        ingredients,
      };
      if (dish) {
        await update.mutateAsync({ id: dish.id, patch: payload });
      } else {
        await create.mutateAsync({ ...payload, category_id: categoryId! });
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
      title={dish ? t('chef.editDish') : t('chef.addDish')}
    >
      <ScrollView style={{ maxHeight: 560 }} showsVerticalScrollIndicator={false}>
        <View style={tw`gap-3 mt-1`}>
          {/* Image picker */}
          <Pressable
            onPress={pickImage}
            disabled={upload.isPending}
            style={tw`bg-gray-100 rounded-xl overflow-hidden`}
          >
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={[tw`w-full`, { aspectRatio: 16 / 9 }]} contentFit="cover" />
            ) : (
              <View style={[tw`w-full items-center justify-center`, { aspectRatio: 16 / 9 }]}>
                {upload.isPending ? (
                  <ActivityIndicator size="small" color="#737373" />
                ) : (
                  <>
                    <Camera size={20} color="#737373" />
                    <Text style={tw`mt-1 text-xs text-gray-500`}>{t('chef.imageUrl')}</Text>
                  </>
                )}
              </View>
            )}
          </Pressable>

          <Input
            label={t('chef.dishName')}
            value={name}
            onChangeText={setName}
            maxLength={50}
          />

          <Input
            label={t('chef.description')}
            value={description}
            onChangeText={setDescription}
            placeholder={t('chef.dishDescriptionPlaceholder')}
            multiline
            numberOfLines={3}
            style={tw`min-h-20 py-2`}
          />

          <Input
            label={t('chef.price')}
            value={priceStr}
            onChangeText={setPriceStr}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />

          <IngredientsInput
            label={t('chef.ingredients')}
            value={ingredients}
            onChange={setIngredients}
          />

          <View>
            <Input
              label={t('chef.recipe')}
              value={recipe}
              onChangeText={setRecipe}
              multiline
              numberOfLines={3}
              style={tw`min-h-20 py-2`}
            />
            <View style={tw`mt-2 flex-row items-center justify-between`}>
              <Text style={tw`text-xs text-gray-700`}>{t('chef.recipeIsPrivate')}</Text>
              <Switch
                value={recipeIsPrivate}
                onValueChange={setRecipeIsPrivate}
                trackColor={{ false: '#D4D4D4', true: '#A68B6A' }}
                thumbColor="white"
              />
            </View>
          </View>

          <View style={tw`flex-row gap-2 mt-3`}>
            <View style={tw`flex-1`}>
              <Button label={t('common.cancel')} variant="outline" fullWidth onPress={onClose} />
            </View>
            <View style={tw`flex-1`}>
              <Button
                label={dish ? t('common.save') : t('common.create')}
                fullWidth
                loading={submitting}
                onPress={onSave}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </Sheet>
  );
}
