import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Camera, Link2, Sparkles, Type as TypeIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';
import {
  recipeToFormFields,
  useExtractRecipe,
  type ExtractedRecipe,
} from '@/hooks/storage/useExtractRecipe';
import tw from '@/lib/tw';

type Mode = 'text' | 'image' | 'url';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Called when extraction succeeds. Caller fills DishSheet fields with these. */
  onExtracted: (fields: {
    name: string;
    description: string;
    ingredients: string[];
    recipe: string;
    source?: string;
  }) => void;
}

export function SmartFillSheet({ visible, onClose, onExtracted }: Props) {
  const { t } = useTranslation();
  const extract = useExtractRecipe();

  const [mode, setMode] = useState<Mode>('url');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const reset = () => {
    setMode('url');
    setText('');
    setUrl('');
    setImageBase64(null);
    setImagePreview(null);
    setLastError(null);
  };

  const handleClose = () => {
    if (extract.isPending) return; // 防止生成中关闭
    reset();
    onClose();
  };

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showToast.error('需要相册权限');
        return;
      }
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 1,
        allowsEditing: false,
      });
      if (picked.canceled || picked.assets.length === 0) return;
      const asset = picked.assets[0];
      // Compress + resize, request base64 inline (no extra FileSystem call)
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1280 } }],
        {
          compress: 0.85,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        },
      );
      if (!manipulated.base64) throw new Error('Failed to encode image');
      setImageBase64(manipulated.base64);
      setImagePreview(manipulated.uri);
    } catch (e: any) {
      showToast.error(e?.message ?? '选图失败');
    }
  };

  const submit = async () => {
    let payload: Parameters<typeof extract.mutateAsync>[0];
    if (mode === 'text') {
      if (!text.trim()) {
        showToast.error('请描述一下你想做什么');
        return;
      }
      payload = { text: text.trim() };
    } else if (mode === 'image') {
      if (!imageBase64) {
        showToast.error('请先选一张图');
        return;
      }
      payload = { imageBase64, imageMimeType: 'image/jpeg' };
    } else {
      if (!url.trim()) {
        showToast.error('请贴一个链接');
        return;
      }
      payload = { url: url.trim() };
    }

    setLastError(null);
    try {
      const result = await extract.mutateAsync(payload);
      const fields = recipeToFormFields(result.recipe);
      onExtracted({
        ...fields,
        source: result.source.platform || result.source.mode,
      });
      showToast.success('✨ 智能填充完成', `置信度: ${result.recipe.confidence}`);
      reset();
      onClose();
    } catch (e: any) {
      const msg = e?.message ?? '解析失败';
      // Friendly error mapping
      let displayMsg: string;
      if (msg.includes('closed_platform')) {
        displayMsg = '该平台无法直接解析,请截图或粘贴文字';
      } else if (msg.includes('apify_failed')) {
        displayMsg = `视频解析服务暂时不可用 (${msg.slice(0, 80)})`;
      } else {
        displayMsg = msg.slice(0, 200);
      }
      showToast.error(displayMsg);
      // 同时把错误内嵌显示在 sheet 里(Toast 可能被 BottomSheet 挡住)
      setLastError(displayMsg);
    }
  };

  return (
    <Sheet visible={visible} onClose={handleClose} title="✨ 智能填充菜品">
      <View style={tw`gap-3 mt-1`}>
        {/* Mode picker */}
        <View style={tw`flex-row gap-2`}>
          {(
            [
              { key: 'url', icon: Link2, label: '粘贴链接' },
              { key: 'text', icon: TypeIcon, label: '文字描述' },
              { key: 'image', icon: Camera, label: '上传图片' },
            ] as const
          ).map(({ key, icon: Icon, label }) => {
            const active = mode === key;
            return (
              <Pressable
                key={key}
                onPress={() => setMode(key)}
                disabled={extract.isPending}
                style={tw.style(
                  'flex-1 items-center py-3 rounded-lg border',
                  active ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-200',
                )}
              >
                <Icon size={16} color={active ? 'white' : '#404040'} />
                <Text
                  style={tw.style(
                    'mt-1 text-[10px] font-medium',
                    active ? 'text-white' : 'text-gray-700',
                  )}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Inputs */}
        {mode === 'url' && (
          <View style={tw`gap-2`}>
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="https://...(YouTube / 抖音 / 小红书 / IG / B站 ...)"
              placeholderTextColor="#A3A3A3"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!extract.isPending}
              style={tw`bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900`}
            />
            <Text style={tw`text-[11px] text-gray-500 leading-relaxed`}>
              支持:YouTube / B站 / 抖音 / 小红书 / TikTok / Instagram / Facebook /
              快手 / 微博 / 知乎 / Allrecipes / 下厨房 等几十个平台。视频会自动提取字幕,
              图文笔记自动识别多图内容。
            </Text>
          </View>
        )}

        {mode === 'text' && (
          <View>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="比如:我想做奶奶的红烧肉,五花肉切方块炖到酥软,要带点甜味…"
              placeholderTextColor="#A3A3A3"
              multiline
              numberOfLines={5}
              editable={!extract.isPending}
              style={tw`bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 min-h-32`}
            />
          </View>
        )}

        {mode === 'image' && (
          <View>
            <Pressable
              onPress={pickImage}
              disabled={extract.isPending}
              style={tw`bg-gray-100 rounded-xl overflow-hidden`}
            >
              {imagePreview ? (
                <Image
                  source={{ uri: imagePreview }}
                  style={[tw`w-full`, { aspectRatio: 1 }]}
                  contentFit="cover"
                />
              ) : (
                <View
                  style={[
                    tw`w-full items-center justify-center`,
                    { aspectRatio: 1 },
                  ]}
                >
                  <Camera size={24} color="#737373" />
                  <Text style={tw`mt-2 text-xs text-gray-500`}>
                    点击选择菜品照片
                  </Text>
                  <Text style={tw`mt-1 text-[10px] text-gray-400`}>
                    AI 会识别食物、估算食材和做法
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        )}

        {/* Error banner — Toast 在 sheet 上方时可能被挡,这里兜底显示 */}
        {lastError && !extract.isPending && (
          <View
            style={tw`bg-red-50 border border-red-200 rounded-lg px-3 py-2.5`}
          >
            <Text style={tw`text-xs text-red-700 leading-relaxed`}>
              {lastError}
            </Text>
          </View>
        )}

        {/* Status hint */}
        {extract.isPending && (
          <View style={tw`flex-row items-center justify-center gap-2 py-2`}>
            <ActivityIndicator size="small" color="#A68B6A" />
            <Text style={tw`text-xs text-[#A68B6A]`}>
              {mode === 'url'
                ? '解析链接中…(10-90 秒,视频较慢)'
                : mode === 'image'
                  ? 'AI 识图中…(10-30 秒)'
                  : 'AI 整理中…(5-15 秒)'}
            </Text>
          </View>
        )}

        <View style={tw`flex-row gap-2 mt-2`}>
          <View style={tw`flex-1`}>
            <Button
              label="取消"
              variant="outline"
              fullWidth
              onPress={handleClose}
              disabled={extract.isPending}
            />
          </View>
          <View style={tw`flex-1`}>
            <Button
              label={extract.isPending ? '生成中…' : '生成菜谱'}
              fullWidth
              loading={extract.isPending}
              onPress={submit}
            />
          </View>
        </View>
      </View>
    </Sheet>
  );
}
