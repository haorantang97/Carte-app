import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Pencil, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Tappable } from '@/components/ui/Tappable';
import { showToast } from '@/components/ui/Toast';
import { useProfile, useUpdateProfile } from '@/hooks/auth/useProfile';
import { usePickAndUploadImage } from '@/hooks/storage/useImageUpload';
import { useAiQuota } from '@/hooks/useAiQuota';
import { useMyCartes } from '@/hooks/carte/useMyCartes';
import {
  SketchBox,
  SketchCircle,
  SketchPill,
  SketchUnderline,
  SketchPhotoCircle,
} from '@/components/ui/sketch';
import { palette, handFont, noteFont, titleFont } from '@/lib/palette';
import { useResponsive } from '@/lib/responsive';

export default function ProfileEdit() {
  const insets = useSafeAreaInsets();
  const r = useResponsive();
  const contentPadH = r.isTablet
    ? Math.max(28, (r.width - r.contentMaxWidth) / 2)
    : r.scale(20, { min: 14, max: 28 });
  const innerPadH = r.isTablet
    ? Math.max(32, (r.width - r.contentMaxWidth) / 2 + 4)
    : r.scale(24, { min: 16, max: 32 });
  const { t } = useTranslation();
  const { data: profile, isLoading } = useProfile();
  const update = useUpdateProfile();
  const upload = usePickAndUploadImage('avatars', { square: true });
  const ai = useAiQuota();
  const aiPct = Math.min(100, Math.round((ai.used / ai.limit) * 100));
  const { data: cartes } = useMyCartes();

  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const onPickAvatar = async () => {
    try {
      const url = await upload.mutateAsync('gallery');
      if (url) setAvatarUrl(url);
    } catch (e: any) {
      if (e?.message !== 'Permission denied') {
        showToast.error(e?.message ?? t('errors.generic'));
      }
    }
  };

  const onSave = async () => {
    if (!username.trim()) {
      showToast.error(t('errors.missingFields'));
      return;
    }
    setSubmitting(true);
    try {
      await update.mutateAsync({
        username: username.trim(),
        avatar_url: avatarUrl,
      });
      showToast.success(t('common.save'));
      router.back();
    } catch (e: any) {
      showToast.error(e?.message ?? t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.paper,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="small" color={palette.inkSoft} />
      </View>
    );
  }

  const myCartes = (cartes ?? []).filter((c) => c.is_mine).length;

  return (
    <View style={{ flex: 1, backgroundColor: palette.paper }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 100,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View
            style={{
              paddingHorizontal: contentPadH,
              paddingBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Tappable feedback="press" onPress={() => router.back()}>
              <SketchCircle size={r.scale(40, { min: 36, max: 48 })} seed={1}>
                <ArrowLeft size={18} color={palette.ink} strokeWidth={1.5} />
              </SketchCircle>
            </Tappable>
            <Text
              style={{
                fontFamily: handFont,
                fontSize: r.fontScale(26, { min: 22, max: 30 }),
                color: palette.ink,
                lineHeight: r.fontScale(26, { min: 22, max: 30 }),
              }}
            >
              编辑资料
            </Text>
          </View>

          {/* Avatar */}
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <View style={{ position: 'relative' }}>
              <Tappable feedback="press" onPress={onPickAvatar} disabled={upload.isPending}>
                <SketchPhotoCircle
                  src={avatarUrl}
                  size={r.scale(140, { min: 110, max: 180 })}
                  seed={2}
                />
              </Tappable>
              <View
                style={{
                  position: 'absolute',
                  bottom: 4,
                  right: 4,
                  backgroundColor: palette.paper,
                  borderRadius: 999,
                  padding: 3,
                }}
              >
                <Tappable feedback="press" onPress={onPickAvatar}>
                  <SketchCircle size={r.scale(36, { min: 32, max: 44 })} seed={3}>
                    {upload.isPending ? (
                      <ActivityIndicator size="small" color={palette.ink} />
                    ) : (
                      <Pencil size={16} color={palette.ink} strokeWidth={1.5} />
                    )}
                  </SketchCircle>
                </Tappable>
              </View>
            </View>
            <Text
              style={{
                marginTop: 12,
                fontFamily: noteFont,
                fontSize: 13,
                color: palette.inkMute,
              }}
            >
              点头像更换
            </Text>
          </View>

          {/* Username field */}
          <View style={{ paddingHorizontal: innerPadH, marginTop: 32 }}>
            <Text
              style={{
                fontFamily: handFont,
                fontSize: 18,
                color: palette.ink,
                lineHeight: 18,
              }}
            >
              用户名
            </Text>
            <SketchUnderline width={50} seed={4} color={palette.ink} />
            <Tappable
              feedback="press"
              onPress={() => setEditingUsername(true)}
              haptic={false}
            >
              <SketchBox
                radius={12}
                seed={5}
                fillColor={palette.paper}
                style={{ paddingHorizontal: 16, paddingVertical: 14, marginTop: 12 }}
              >
                {editingUsername ? (
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    onBlur={() => setEditingUsername(false)}
                    autoFocus
                    maxLength={30}
                    autoCapitalize="none"
                    placeholder={t('profile.username')}
                    placeholderTextColor={palette.inkMute}
                    style={{
                      fontFamily: handFont,
                      fontSize: 22,
                      color: palette.ink,
                      lineHeight: 24,
                      padding: 0,
                    }}
                  />
                ) : (
                  <Text
                    style={{
                      fontFamily: handFont,
                      fontSize: 22,
                      color: username ? palette.ink : palette.inkMute,
                      lineHeight: 24,
                    }}
                  >
                    {username || t('profile.username')}
                  </Text>
                )}
              </SketchBox>
            </Tappable>
            <Text
              style={{
                marginTop: 8,
                fontFamily: noteFont,
                fontSize: 12,
                color: palette.inkMute,
                lineHeight: 18,
              }}
            >
              会显示给加入你 carte 的 diners、以及你下单的 chef
            </Text>
          </View>

          {/* Stats */}
          <View
            style={{
              paddingHorizontal: innerPadH,
              marginTop: 32,
              flexDirection: 'row',
              gap: 12,
            }}
          >
            {[
              { n: String(myCartes), l: '我的 cartes' },
              {
                n: String((cartes ?? []).filter((c) => !c.is_mine).length),
                l: '加入的',
              },
              { n: String(ai.used), l: '本月 AI' },
            ].map((s, i) => (
              <View key={i} style={{ flex: 1 }}>
                <SketchBox
                  radius={12}
                  seed={i + 6}
                  fillColor={palette.paper}
                  style={{ paddingVertical: 12 }}
                >
                  <Text
                    style={{
                      textAlign: 'center',
                      fontFamily: handFont,
                      fontSize: 26,
                      color: palette.ink,
                      lineHeight: 26,
                      fontWeight: '700',
                    }}
                  >
                    {s.n}
                  </Text>
                  <Text
                    style={{
                      textAlign: 'center',
                      fontFamily: noteFont,
                      fontSize: 11,
                      color: palette.inkSoft,
                      marginTop: 4,
                    }}
                  >
                    {s.l}
                  </Text>
                </SketchBox>
              </View>
            ))}
          </View>

          {/* AI usage */}
          <View style={{ paddingHorizontal: innerPadH, marginTop: 32 }}>
            <Text
              style={{
                fontFamily: handFont,
                fontSize: 18,
                color: palette.ink,
                lineHeight: 18,
              }}
            >
              AI 用量
            </Text>
            <SketchUnderline width={50} seed={10} color={palette.ink} />
            <SketchBox
              radius={14}
              seed={11}
              fillColor={palette.paper}
              style={{ paddingHorizontal: 16, paddingVertical: 14, marginTop: 12 }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                }}
              >
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                >
                  <Sparkles size={16} color={palette.ink} strokeWidth={1.5} />
                  <Text
                    style={{
                      fontFamily: handFont,
                      fontSize: 18,
                      color: palette.ink,
                    }}
                  >
                    本月已用
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: titleFont,
                    fontStyle: 'italic',
                    fontSize: 22,
                    color: palette.ink,
                    fontWeight: '700',
                  }}
                >
                  {ai.used}
                  <Text style={{ fontSize: 14, color: palette.inkSoft }}>
                    {' '}
                    / {ai.limit}
                  </Text>
                </Text>
              </View>
              <View
                style={{
                  marginTop: 12,
                  height: 5,
                  backgroundColor: palette.inkPale,
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    width: `${aiPct}%`,
                    height: '100%',
                    backgroundColor: palette.ink,
                  }}
                />
              </View>
              <Tappable
                feedback="press"
                onPress={() => showToast.info('升级 Pro 即将上线')}
              >
                <View
                  style={{
                    marginTop: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: noteFont,
                      fontSize: 12,
                      color: palette.inkSoft,
                    }}
                  >
                    升级 Pro 解除上限
                  </Text>
                  <SketchPill seed={12} style={{ paddingTop: 3, paddingBottom: 3 }}>
                    <Text
                      style={{
                        fontFamily: handFont,
                        fontSize: 12,
                        color: palette.ink,
                      }}
                    >
                      Pro →
                    </Text>
                  </SketchPill>
                </View>
              </Tappable>
            </SketchBox>
          </View>
        </ScrollView>

        {/* Save bar */}
        <View
          style={{
            paddingHorizontal: contentPadH,
            paddingTop: 12,
            paddingBottom: insets.bottom + 12,
            backgroundColor: palette.paper,
          }}
        >
          <Tappable feedback="press" onPress={onSave} disabled={submitting}>
            <SketchBox
              radius={999}
              seed={9}
              strokeWidth={2}
              fillColor={palette.paper}
              style={{ paddingVertical: 14 }}
            >
              <Text
                style={{
                  textAlign: 'center',
                  fontFamily: handFont,
                  fontSize: 22,
                  color: palette.ink,
                  fontWeight: '700',
                }}
              >
                {submitting ? '保存中…' : '保存'}
              </Text>
            </SketchBox>
          </Tappable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
