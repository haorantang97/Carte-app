import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useProfile, useUpdateProfile } from '@/hooks/auth/useProfile';
import { Button } from '@/components/ui/Button';
import { Tappable } from '@/components/ui/Tappable';
import { SketchBox } from '@/components/ui/sketch';
import { showToast } from '@/components/ui/Toast';
import { palette, handFont, noteFont } from '@/lib/palette';

export function UsernamePrompt() {
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    if (profile.username === 'Guest' || !profile.username.trim()) {
      setOpen(true);
    }
  }, [profile]);

  const onSave = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await update.mutateAsync({ username: name.trim() });
      setOpen(false);
    } catch (e: any) {
      showToast.error(e?.message ?? t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => setOpen(false)}
    >
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 28,
          backgroundColor: 'rgba(30, 58, 138, 0.35)',
        }}
      >
        <Pressable
          onPress={() => setOpen(false)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View style={{ width: '100%', maxWidth: 340 }}>
          <SketchBox
            radius={20}
            seed={9}
            fillColor={palette.paper}
            style={{ padding: 22 }}
          >
            <Text
              style={{
                fontFamily: handFont,
                fontSize: 28,
                color: palette.ink,
                lineHeight: 30,
              }}
            >
              {t('home.welcome')}
            </Text>
            <Text
              style={{
                marginTop: 6,
                fontFamily: noteFont,
                fontSize: 14,
                color: palette.inkSoft,
              }}
            >
              叫你什么呢?
            </Text>
            <View style={{ marginTop: 16 }}>
              <SketchBox
                radius={12}
                seed={11}
                fillColor={palette.paper}
                style={{ paddingHorizontal: 14, paddingVertical: 10 }}
              >
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={t('profile.username')}
                  placeholderTextColor={palette.inkMute}
                  autoFocus
                  maxLength={30}
                  returnKeyType="done"
                  onSubmitEditing={onSave}
                  style={{
                    fontFamily: handFont,
                    fontSize: 20,
                    color: palette.ink,
                    padding: 0,
                    minHeight: 24,
                  }}
                />
              </SketchBox>
            </View>
            <View
              style={{ marginTop: 16, flexDirection: 'row', gap: 8 }}
            >
              <View style={{ flex: 1 }}>
                <Tappable feedback="press" onPress={() => setOpen(false)}>
                  <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                    <Text
                      style={{
                        fontFamily: handFont,
                        fontSize: 18,
                        color: palette.inkSoft,
                      }}
                    >
                      稍后
                    </Text>
                  </View>
                </Tappable>
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label={t('common.save')}
                  fullWidth
                  disabled={!name.trim()}
                  loading={submitting}
                  onPress={onSave}
                  seed={13}
                />
              </View>
            </View>
          </SketchBox>
        </View>
      </View>
    </Modal>
  );
}
