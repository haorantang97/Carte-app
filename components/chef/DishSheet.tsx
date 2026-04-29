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
import { Camera, Sparkles } from 'lucide-react-native';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { IngredientsInput } from '@/components/chef/IngredientsInput';
import { ImageSourceSheet } from '@/components/chef/ImageSourceSheet';
import { SmartFillSheet } from '@/components/chef/SmartFillSheet';
import { showToast } from '@/components/ui/Toast';
import { useCreateDish, useUpdateDish } from '@/hooks/chef/useDishMutations';
import { usePickAndUploadImage } from '@/hooks/storage/useImageUpload';
import { useGenerateDishImage } from '@/hooks/storage/useGenerateDishImage';
import type { Dish } from '@/types/domain';
import { parsePrice } from '@/lib/price';
import tw from '@/lib/tw';

export type DishSheetMode = 'manual' | 'smart_review';

export interface DishPrefill {
  name?: string;
  description?: string;
  ingredients?: string[];
  recipe?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  categoryId: string | null;
  /** When set, sheet is in edit mode (existing dish) */
  dish?: Dish | null;
  /**
   * 'manual' = 自己填写, no AI content button at top
   * 'smart_review' = AI 整理后预览编辑模式, AI button replaced by 重新生成
   */
  mode?: DishSheetMode;
  /** Initial values from upstream AI extraction (smart_review mode) */
  prefill?: DishPrefill | null;
}

export function DishSheet({
  visible,
  onClose,
  groupId,
  categoryId,
  dish,
  mode = 'manual',
  prefill,
}: Props) {
  const { t } = useTranslation();
  const create = useCreateDish(groupId);
  const update = useUpdateDish(groupId);
  const upload = usePickAndUploadImage('menu-images');
  const generate = useGenerateDishImage();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [recipe, setRecipe] = useState('');
  const [recipeIsPrivate, setRecipeIsPrivate] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [smartFillOpen, setSmartFillOpen] = useState(false);
  const [imgSourceOpen, setImgSourceOpen] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (dish) {
      // Editing an existing dish — load from DB
      setName(dish.name);
      setDescription(dish.description ?? '');
      setPriceStr(String(dish.price ?? ''));
      setImageUrl(dish.image_url);
      setRecipe(dish.recipe ?? '');
      setRecipeIsPrivate(dish.recipe_is_private);
      setIngredients(Array.isArray(dish.ingredients) ? (dish.ingredients as string[]) : []);
    } else if (prefill) {
      // New dish, prefilled by upstream AI extraction
      setName(prefill.name ?? '');
      setDescription(prefill.description ?? '');
      setPriceStr('');
      setImageUrl(null);
      setRecipe(prefill.recipe ?? '');
      setRecipeIsPrivate(false);
      setIngredients(prefill.ingredients ?? []);
    } else {
      // New dish, blank
      setName('');
      setDescription('');
      setPriceStr('');
      setImageUrl(null);
      setRecipe('');
      setRecipeIsPrivate(false);
      setIngredients([]);
    }
  }, [visible, dish, prefill]);

  const pickFromGallery = async () => {
    try {
      const url = await upload.mutateAsync('gallery');
      if (url) setImageUrl(url);
    } catch (e: any) {
      if (!String(e?.message ?? '').includes('Permission')) {
        showToast.error(e?.message ?? 'Failed to upload');
      }
    }
  };

  const pickFromCamera = async () => {
    try {
      const url = await upload.mutateAsync('camera');
      if (url) setImageUrl(url);
    } catch (e: any) {
      if (!String(e?.message ?? '').includes('Permission')) {
        showToast.error(e?.message ?? 'Failed to take photo');
      }
    }
  };

  const aiGenerate = async () => {
    if (!name.trim()) {
      showToast.error('先填菜品名,AI 才能根据它生成图');
      return;
    }
    try {
      const url = await generate.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setImageUrl(url);
      showToast.success('AI 生图完成');
    } catch (e: any) {
      showToast.error(e?.message ?? 'Failed to generate');
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

  const isBusyImage = upload.isPending || generate.isPending;
  const isCreating = !dish; // editing existing dish hides mode-specific entries
  const showSmartReviewBanner = isCreating && mode === 'smart_review';

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={dish ? t('chef.editDish') : t('chef.addDish')}
    >
      <ScrollView style={{ maxHeight: 580 }} showsVerticalScrollIndicator={false}>
        <View style={tw`gap-3 mt-1`}>
          {/* Smart review banner: tells user this was AI-filled, offers to regenerate */}
          {showSmartReviewBanner && (
            <Pressable
              onPress={() => setSmartFillOpen(true)}
              style={({ pressed }) => [
                tw`flex-row items-center bg-[#FAF6EE] border border-[#A68B6A] rounded-xl px-3 py-2.5`,
                { opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <Sparkles size={14} color="#A68B6A" />
              <Text style={tw`ml-1.5 flex-1 text-xs text-[#A68B6A] font-medium`}>
                AI 已为你整理 ✓ 可继续编辑或
              </Text>
              <Text style={tw`text-xs text-[#A68B6A] font-semibold underline`}>重新生成</Text>
            </Pressable>
          )}

          {/* Image preview area — tap to open ImageSourceSheet (3 options) */}
          <Pressable
            onPress={() => !isBusyImage && setImgSourceOpen(true)}
            disabled={isBusyImage}
            style={tw`bg-gray-100 rounded-xl overflow-hidden`}
          >
            {imageUrl && !isBusyImage ? (
              <Image
                source={{ uri: imageUrl }}
                style={[tw`w-full`, { aspectRatio: 1 }]}
                contentFit="cover"
              />
            ) : (
              <View style={[tw`w-full items-center justify-center`, { aspectRatio: 1 }]}>
                {generate.isPending ? (
                  <>
                    <ActivityIndicator size="small" color="#A68B6A" />
                    <Text style={tw`mt-2 text-xs text-[#A68B6A] font-medium`}>
                      AI 正在画…
                    </Text>
                    <Text style={tw`mt-1 text-[10px] text-gray-500`}>约 60-90 秒</Text>
                  </>
                ) : upload.isPending ? (
                  <ActivityIndicator size="small" color="#737373" />
                ) : (
                  <>
                    <Camera size={20} color="#737373" />
                    <Text style={tw`mt-1 text-xs text-gray-500`}>
                      点击上传 / 拍照 / AI 生图
                    </Text>
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

          {/* 逃生通道:仅在 manual 新建模式下,底部提供 AI 整理入口 */}
          {isCreating && mode === 'manual' && (
            <Pressable
              onPress={() => setSmartFillOpen(true)}
              style={tw`mt-1 items-center py-1`}
            >
              <Text style={tw`text-[11px] text-gray-500`}>
                不太确定怎么填?{' '}
                <Text style={tw`text-[#A68B6A] underline font-medium`}>
                  ✨ 让 AI 帮我整理
                </Text>
              </Text>
            </Pressable>
          )}

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

      <ImageSourceSheet
        visible={imgSourceOpen}
        onClose={() => setImgSourceOpen(false)}
        onPickGallery={pickFromGallery}
        onPickCamera={pickFromCamera}
        onPickAI={aiGenerate}
        aiAvailable={!!name.trim()}
      />

      <SmartFillSheet
        visible={smartFillOpen}
        onClose={() => setSmartFillOpen(false)}
        onExtracted={(fields) => {
          // Replace fields directly when invoked from smart_review banner (regenerate),
          // but only fill empty fields when invoked from manual escape hatch.
          if (mode === 'smart_review') {
            setName(fields.name);
            setDescription(fields.description);
            setIngredients(fields.ingredients);
            setRecipe(fields.recipe);
          } else {
            if (!name.trim()) setName(fields.name);
            if (!description.trim()) setDescription(fields.description);
            if (ingredients.length === 0) setIngredients(fields.ingredients);
            if (!recipe.trim()) setRecipe(fields.recipe);
          }
        }}
      />
    </Sheet>
  );
}
