import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Camera, Link2, Type as TypeIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Tappable } from '@/components/ui/Tappable';
import { SketchBox } from '@/components/ui/sketch';
import { showToast } from '@/components/ui/Toast';
import { useStartExtractDish } from '@/hooks/storage/useStartExtractDish';
import { palette, handFont, noteFont } from '@/lib/palette';

type Mode = 'text' | 'image' | 'url';

/**
 * 用户经常粘贴整段分享文案 (小红书 "...复制后直接打开【小红书】..."、
 * 抖音 "7.79 复制打开抖音" 等),URL 嵌在自然语言里。
 * Edge function 端也做了同样的兜底,这里只是给用户即时反馈。
 */
function extractUrlFromText(input: string): string | null {
  const m = input.match(/https?:\/\/[^\s)】」"',。、]+/i);
  return m ? m[0].replace(/[.,;!?]+$/, '') : null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Required to associate the placeholder dish with a carte + category. */
  groupId: string;
  categoryId: string | null;
  /** Notify caller a placeholder dish was inserted (so it can show toast / dismiss). */
  onStarted?: (dishId: string) => void;
}

export function SmartFillSheet({
  visible,
  onClose,
  groupId,
  categoryId,
  onStarted,
}: Props) {
  useTranslation();
  const start = useStartExtractDish();

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
    // 现在 submit 是非阻塞的,关闭无需等待
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
    if (!categoryId) {
      setLastError('请先选一个分类');
      return;
    }
    let payload: Parameters<typeof start.mutateAsync>[0];
    if (mode === 'text') {
      if (!text.trim()) {
        showToast.error('请描述一下你想做什么');
        return;
      }
      payload = { groupId, categoryId, text: text.trim() };
    } else if (mode === 'image') {
      if (!imageBase64) {
        showToast.error('请先选一张图');
        return;
      }
      payload = { groupId, categoryId, imageBase64, imageMimeType: 'image/jpeg' };
    } else {
      const trimmed = url.trim();
      if (!trimmed) {
        showToast.error('请贴一个链接');
        return;
      }
      const extracted = extractUrlFromText(trimmed);
      const finalUrl = extracted ?? trimmed;
      if (!/^https?:\/\//i.test(finalUrl)) {
        showToast.error('没找到 http/https 开头的链接');
        setLastError('没找到 http/https 开头的链接,请确认贴的内容里有完整 URL');
        return;
      }
      payload = { groupId, categoryId, url: finalUrl };
    }

    setLastError(null);
    try {
      const { dishId } = await start.mutateAsync(payload);
      // 占位卡已 insert + cache 已刷,关闭 sheet 让用户回列表看
      onStarted?.(dishId);
      showToast.info('✨ 已开始生成,可继续浏览');
      reset();
      onClose();
    } catch (e: any) {
      const msg = e?.message ?? '提交失败';
      setLastError(msg.slice(0, 200));
      showToast.error(msg.slice(0, 100));
    }
  };

  return (
    <Sheet visible={visible} onClose={handleClose} title="✨ 智能填充菜品">
      <View style={{ gap: 14, marginTop: 4 }}>
        {/* Mode picker */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(
            [
              { key: 'url', icon: Link2, label: '粘贴链接' },
              { key: 'text', icon: TypeIcon, label: '文字描述' },
              { key: 'image', icon: Camera, label: '上传图片' },
            ] as const
          ).map(({ key, icon: Icon, label }, i) => {
            const active = mode === key;
            return (
              <View key={key} style={{ flex: 1 }}>
                <Tappable
                  feedback="press"
                  onPress={() => setMode(key)}
                  disabled={start.isPending}
                >
                  <SketchBox
                    radius={12}
                    seed={300 + i}
                    fillColor={palette.paper}
                    strokeWidth={active ? 2 : 1.3}
                    style={{ paddingVertical: 12, alignItems: 'center' }}
                  >
                    <Icon size={18} color={palette.ink} strokeWidth={1.5} />
                    <Text
                      style={{
                        marginTop: 4,
                        fontFamily: handFont,
                        fontSize: 13,
                        color: palette.ink,
                        fontWeight: active ? '700' : '400',
                      }}
                    >
                      {label}
                    </Text>
                  </SketchBox>
                </Tappable>
              </View>
            );
          })}
        </View>

        {/* Inputs */}
        {mode === 'url' && (
          <View style={{ gap: 8 }}>
            <SketchBox
              radius={12}
              seed={310}
              fillColor={palette.paper}
              style={{ paddingHorizontal: 14, paddingVertical: 10 }}
            >
              <TextInput
                value={url}
                onChangeText={setUrl}
                placeholder="贴整段分享文案也可以,自动识别 URL"
                placeholderTextColor={palette.inkMute}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!start.isPending}
                multiline
                style={{
                  fontFamily: handFont,
                  fontSize: 16,
                  color: palette.ink,
                  padding: 0,
                  minHeight: 48,
                }}
              />
            </SketchBox>
            {(() => {
              const trimmed = url.trim();
              if (!trimmed) return null;
              const extracted = extractUrlFromText(trimmed);
              if (extracted && extracted !== trimmed) {
                return (
                  <Text
                    style={{
                      fontFamily: noteFont,
                      fontSize: 11,
                      color: palette.success,
                    }}
                  >
                    ✓ 识别到链接: {extracted}
                  </Text>
                );
              }
              if (!extracted && !/^https?:\/\//i.test(trimmed)) {
                return (
                  <Text
                    style={{
                      fontFamily: noteFont,
                      fontSize: 11,
                      color: palette.destructive,
                    }}
                  >
                    没在文本里找到 http/https 开头的链接
                  </Text>
                );
              }
              return null;
            })()}
            <Text
              style={{
                fontFamily: noteFont,
                fontSize: 11,
                color: palette.inkSoft,
                lineHeight: 16,
              }}
            >
              支持:YouTube / B站 / 抖音 / 小红书 / TikTok / Instagram / Facebook /
              快手 / 微博 / 知乎 / Allrecipes / 下厨房 等几十个平台
            </Text>
          </View>
        )}

        {mode === 'text' && (
          <SketchBox
            radius={12}
            seed={311}
            fillColor={palette.paper}
            style={{ paddingHorizontal: 14, paddingVertical: 10 }}
          >
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="比如:我想做奶奶的红烧肉,五花肉切方块炖到酥软,要带点甜味…"
              placeholderTextColor={palette.inkMute}
              multiline
              numberOfLines={5}
              editable={!start.isPending}
              style={{
                fontFamily: handFont,
                fontSize: 16,
                color: palette.ink,
                padding: 0,
                minHeight: 120,
              }}
            />
          </SketchBox>
        )}

        {mode === 'image' && (
          <Pressable
            onPress={pickImage}
            disabled={start.isPending}
            style={{
              backgroundColor: palette.inkPale,
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            {imagePreview ? (
              <Image
                source={{ uri: imagePreview }}
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
                <Camera size={26} color={palette.ink} strokeWidth={1.5} />
                <Text
                  style={{
                    marginTop: 8,
                    fontFamily: handFont,
                    fontSize: 16,
                    color: palette.ink,
                  }}
                >
                  点击选择菜品照片
                </Text>
                <Text
                  style={{
                    marginTop: 4,
                    fontFamily: noteFont,
                    fontSize: 11,
                    color: palette.inkSoft,
                  }}
                >
                  AI 会识别食物、估算食材和做法
                </Text>
              </View>
            )}
          </Pressable>
        )}

        {/* Error banner */}
        {lastError && !start.isPending && (
          <SketchBox
            radius={10}
            seed={312}
            color={palette.destructive}
            fillColor="#FFF5F5"
            style={{ paddingHorizontal: 12, paddingVertical: 10 }}
          >
            <Text
              style={{
                fontFamily: noteFont,
                fontSize: 12,
                color: palette.destructive,
                lineHeight: 18,
              }}
            >
              {lastError}
            </Text>
          </SketchBox>
        )}

        {/* Mini spinner */}
        {start.isPending && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingVertical: 4,
            }}
          >
            <ActivityIndicator size="small" color={palette.ink} />
            <Text
              style={{
                fontFamily: handFont,
                fontSize: 14,
                color: palette.ink,
              }}
            >
              正在加入队列…
            </Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <View style={{ flex: 1 }}>
            <Button
              label="取消"
              variant="outline"
              fullWidth
              onPress={handleClose}
              disabled={start.isPending}
              seed={320}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={start.isPending ? '生成中…' : '生成菜谱'}
              fullWidth
              loading={start.isPending}
              onPress={submit}
              seed={321}
            />
          </View>
        </View>
      </View>
    </Sheet>
  );
}

