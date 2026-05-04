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
import { ImageSourceSheet } from '@/components/chef/ImageSourceSheet';
import { showToast } from '@/components/ui/Toast';
import { useCreateDish, useUpdateDish } from '@/hooks/chef/useDishMutations';
import { usePickAndUploadImage } from '@/hooks/storage/useImageUpload';
import { useGenerateDishImage } from '@/hooks/storage/useGenerateDishImage';
import type { Dish } from '@/types/domain';
import { parsePrice } from '@/lib/price';
import { palette, handFont, noteFont } from '@/lib/palette';

// 保留这两个 type export 是为了向后兼容(chef/group/[id].tsx 还 import 着),
// 实际运行时 mode 永远是 'manual',prefill 永远是 null。AI 路径已经走非阻塞
// 占位卡流程,不再通过 DishSheet 预览。
export type DishSheetMode = 'manual';
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
  /** Deprecated — kept for back-compat, ignored. */
  mode?: DishSheetMode;
  /** Deprecated — kept for back-compat, ignored. */
  prefill?: DishPrefill | null;
}

/** AI 提取后 ingredients 可能是 [{name, quantity}] 形态。归一化为字符串数组用于编辑器。 */
function normalizeIngredients(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((it) => {
      if (typeof it === 'string') return it;
      if (it && typeof it === 'object') {
        const o = it as Record<string, unknown>;
        const name = typeof o.name === 'string' ? o.name : '';
        const qty = typeof o.quantity === 'string' ? o.quantity : '';
        return [name, qty].filter(Boolean).join(' ');
      }
      return '';
    })
    .filter(Boolean);
}

export function DishSheet({
  visible,
  onClose,
  groupId,
  categoryId,
  dish,
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
      setIngredients(normalizeIngredients(dish.ingredients));
    } else {
      // New manual dish
      setName('');
      setDescription('');
      setPriceStr('');
      setImageUrl(null);
      setRecipe('');
      setRecipeIsPrivate(false);
      setIngredients([]);
    }
  }, [visible, dish]);

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

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={dish ? t('chef.editDish') : t('chef.addDish')}
    >
      <ScrollView style={{ maxHeight: 580 }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 14, marginTop: 4 }}>
          {/* Image preview area — tap to open ImageSourceSheet (3 options) */}
          <Pressable
            onPress={() => !isBusyImage && setImgSourceOpen(true)}
            disabled={isBusyImage}
            style={{
              backgroundColor: palette.inkPale,
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            {imageUrl && !isBusyImage ? (
              <Image
                source={{ uri: imageUrl }}
                style={{ width: '100%', aspectRatio: 1 }}
                contentFit="cover"
              />
            ) : (
              <View
                style={{
                  width: '100%',
                  aspectRatio: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {generate.isPending ? (
                  <>
                    <ActivityIndicator size="small" color={palette.ink} />
                    <Text
                      style={{
                        marginTop: 8,
                        fontFamily: handFont,
                        fontSize: 14,
                        color: palette.ink,
                      }}
                    >
                      AI 正在画…
                    </Text>
                    <Text
                      style={{
                        marginTop: 4,
                        fontFamily: noteFont,
                        fontSize: 11,
                        color: palette.inkSoft,
                      }}
                    >
                      约 60-90 秒
                    </Text>
                  </>
                ) : upload.isPending ? (
                  <ActivityIndicator size="small" color={palette.ink} />
                ) : (
                  <>
                    <Camera size={22} color={palette.ink} strokeWidth={1.5} />
                    <Text
                      style={{
                        marginTop: 6,
                        fontFamily: handFont,
                        fontSize: 14,
                        color: palette.ink,
                      }}
                    >
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
            style={{ minHeight: 80, paddingVertical: 8 }}
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
              style={{ minHeight: 80, paddingVertical: 8 }}
            />
            <View
              style={{
                marginTop: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ fontFamily: handFont, fontSize: 16, color: palette.ink }}>
                {t('chef.recipeIsPrivate')}
              </Text>
              <Switch
                value={recipeIsPrivate}
                onValueChange={setRecipeIsPrivate}
                trackColor={{ false: palette.inkPale, true: palette.ink }}
                thumbColor={palette.paper}
                ios_backgroundColor={palette.inkPale}
              />
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              gap: 8,
              marginTop: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Button
                label={t('common.cancel')}
                variant="outline"
                fullWidth
                onPress={onClose}
                seed={700}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={dish ? t('common.save') : t('common.create')}
                fullWidth
                loading={submitting}
                onPress={onSave}
                seed={701}
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
    </Sheet>
  );
}
