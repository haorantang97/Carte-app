import { useEffect, useRef, useState } from 'react';
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
import { useStartExtractDish } from '@/hooks/storage/useStartExtractDish';
import tw from '@/lib/tw';

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

/**
 * 根据 URL host 推测走哪条路径 → 决定阶段提示。
 * 这只是 UX 层的"假进度",真实状态由 edge function 内部决定。
 */
type Path = 'youtube' | 'apify_video' | 'apify_note' | 'recipe_html' | 'html_text' | 'unknown';

function guessPathFromUrl(rawUrl: string): Path {
  const url = extractUrlFromText(rawUrl) ?? rawUrl;
  const host = (() => {
    try {
      return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      return '';
    }
  })();
  if (/youtube\.com|youtu\.be/.test(host)) return 'youtube';
  if (/douyin|tiktok|bilibili|b23\.tv|kuaishou|fb\.watch|nicovideo|dailymotion/.test(host)) {
    return 'apify_video';
  }
  if (/xiaohongshu|xhslink|instagram|threads|pinterest|pin\.it|weibo|reddit|twitter|x\.com|facebook/.test(host)) {
    return 'apify_note';
  }
  if (
    /allrecipes|cookpad|kurashiru|xiachufang|meishij|marmiton|giallozafferano|seriouseats|foodnetwork|nytimes|bonappetit|10000recipe|icook|food\.com|tarladalal|tudogostoso/.test(
      host,
    )
  ) {
    return 'recipe_html';
  }
  if (/zhihu|medium|substack/.test(host)) return 'html_text';
  return 'unknown';
}

interface Stage {
  /** Seconds elapsed at which this stage activates */
  at: number;
  label: string;
}

function stagesFor(path: Path, mode: Mode): Stage[] {
  if (mode === 'text') {
    return [
      { at: 0, label: '理解你的描述…' },
      { at: 3, label: 'AI 生成菜谱…' },
      { at: 10, label: '快好了…' },
    ];
  }
  if (mode === 'image') {
    return [
      { at: 0, label: '上传图片…' },
      { at: 3, label: 'AI 看图识菜…' },
      { at: 12, label: '生成做法步骤…' },
      { at: 25, label: '快好了…' },
    ];
  }
  // URL mode — 按路径不同
  switch (path) {
    case 'youtube':
      return [
        { at: 0, label: '提交给 Gemini…' },
        { at: 4, label: 'AI 看视频中…' },
        { at: 20, label: '提取菜谱要点…' },
        { at: 40, label: '快好了…' },
      ];
    case 'apify_video':
      return [
        { at: 0, label: '解析短链接…' },
        { at: 3, label: '排队抓取视频字幕…' },
        { at: 25, label: '提取字幕中…' },
        { at: 60, label: 'AI 整理菜谱…' },
        { at: 95, label: '快好了…' },
      ];
    case 'apify_note':
      return [
        { at: 0, label: '解析短链接…' },
        { at: 3, label: '排队抓取笔记…' },
        { at: 20, label: '提取图文内容…' },
        { at: 50, label: 'AI 整理菜谱…' },
        { at: 90, label: '快好了…' },
      ];
    case 'recipe_html':
      return [
        { at: 0, label: '下载页面…' },
        { at: 3, label: '解析菜谱结构…' },
        { at: 8, label: 'AI 整理…' },
        { at: 18, label: '快好了…' },
      ];
    case 'html_text':
      return [
        { at: 0, label: '下载文章…' },
        { at: 3, label: '提取正文…' },
        { at: 8, label: 'AI 整理…' },
        { at: 18, label: '快好了…' },
      ];
    default:
      return [
        { at: 0, label: '正在打开链接…' },
        { at: 5, label: '抓取内容中…' },
        { at: 30, label: 'AI 整理…' },
        { at: 60, label: '快好了…' },
      ];
  }
}

function useStageProgress(active: boolean, stages: Stage[]) {
  const [elapsed, setElapsed] = useState(0);
  const start = useRef<number | null>(null);
  useEffect(() => {
    if (!active) {
      start.current = null;
      setElapsed(0);
      return;
    }
    start.current = Date.now();
    const id = setInterval(() => {
      if (start.current) setElapsed(Math.floor((Date.now() - start.current) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, [active]);
  // 找到 elapsed >= at 的最大那个
  let current = stages[0];
  for (const s of stages) {
    if (elapsed >= s.at) current = s;
    else break;
  }
  return { elapsed, current };
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
  const { t } = useTranslation();
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
                disabled={start.isPending}
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
              placeholder="贴整段分享文案也可以,自动识别 URL"
              placeholderTextColor="#A3A3A3"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!start.isPending}
              multiline
              style={tw`bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 min-h-12`}
            />
            {(() => {
              const trimmed = url.trim();
              if (!trimmed) return null;
              const extracted = extractUrlFromText(trimmed);
              if (extracted && extracted !== trimmed) {
                return (
                  <Text style={tw`text-[11px] text-emerald-700`}>
                    ✓ 识别到链接: {extracted}
                  </Text>
                );
              }
              if (!extracted && !/^https?:\/\//i.test(trimmed)) {
                return (
                  <Text style={tw`text-[11px] text-red-600`}>
                    没在文本里找到 http/https 开头的链接
                  </Text>
                );
              }
              return null;
            })()}
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
              editable={!start.isPending}
              style={tw`bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 min-h-32`}
            />
          </View>
        )}

        {mode === 'image' && (
          <View>
            <Pressable
              onPress={pickImage}
              disabled={start.isPending}
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
        {lastError && !start.isPending && (
          <View
            style={tw`bg-red-50 border border-red-200 rounded-lg px-3 py-2.5`}
          >
            <Text style={tw`text-xs text-red-700 leading-relaxed`}>
              {lastError}
            </Text>
          </View>
        )}

        {/* 提交瞬间的微 spinner — 之后非阻塞,sheet 自己会关 */}
        {start.isPending && (
          <View style={tw`flex-row items-center gap-2 py-2`}>
            <ActivityIndicator size="small" color="#A68B6A" />
            <Text style={tw`text-xs text-[#A68B6A]`}>正在加入队列…</Text>
          </View>
        )}

        <View style={tw`flex-row gap-2 mt-2`}>
          <View style={tw`flex-1`}>
            <Button
              label="取消"
              variant="outline"
              fullWidth
              onPress={handleClose}
              disabled={start.isPending}
            />
          </View>
          <View style={tw`flex-1`}>
            <Button
              label={start.isPending ? '生成中…' : '生成菜谱'}
              fullWidth
              loading={start.isPending}
              onPress={submit}
            />
          </View>
        </View>
      </View>
    </Sheet>
  );
}

// =============================================================================
// ProgressStages — 进度阶段提示
// =============================================================================

function ProgressStages({ mode, url }: { mode: Mode; url: string }) {
  const path = mode === 'url' ? guessPathFromUrl(url) : 'unknown';
  const stages = stagesFor(path, mode);
  const { elapsed, current } = useStageProgress(true, stages);

  // 找到当前阶段在 stages 里的 index 用于高亮已完成项
  const currentIdx = stages.findIndex((s) => s.label === current.label);

  return (
    <View style={tw`bg-[#FAF6EE] border border-[#E8DEC8] rounded-lg px-3 py-3 gap-2`}>
      <View style={tw`flex-row items-center gap-2`}>
        <ActivityIndicator size="small" color="#A68B6A" />
        <Text style={tw`text-xs font-medium text-[#A68B6A] flex-1`}>
          {current.label}
        </Text>
        <Text style={tw`text-[10px] text-gray-500`}>{elapsed}s</Text>
      </View>

      {/* 阶段列表 — 已完成 ✓,当前 →,未到 · */}
      <View style={tw`gap-1 mt-1`}>
        {stages.map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const upcoming = i > currentIdx;
          return (
            <View key={i} style={tw`flex-row items-center gap-2`}>
              <Text
                style={tw.style(
                  'text-[10px] w-3',
                  done ? 'text-emerald-600' : active ? 'text-[#A68B6A]' : 'text-gray-300',
                )}
              >
                {done ? '✓' : active ? '→' : '·'}
              </Text>
              <Text
                style={tw.style(
                  'text-[11px] flex-1',
                  done
                    ? 'text-gray-500 line-through'
                    : active
                      ? 'text-gray-900 font-medium'
                      : 'text-gray-400',
                )}
              >
                {s.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
