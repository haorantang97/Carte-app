import { useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChefHat, Lock, LogOut, Pencil, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';

import { Tappable } from '@/components/ui/Tappable';
import { SketchBox, SketchPill, SketchPhoto } from '@/components/ui/sketch';
import { showToast } from '@/components/ui/Toast';
import { palette, handFont, noteFont, uiFont } from '@/lib/palette';
import { useResponsive } from '@/lib/responsive';
import type { MyCarte } from '@/hooks/carte/useMyCartes';

interface Props {
  carte: MyCarte;
  index: number;
  onEdit: (carte: MyCarte) => void;
  onDelete: (carte: MyCarte) => void;
  onLeave: (carte: MyCarte) => void;
}

export function CarteCard({ carte, index, onEdit, onDelete, onLeave }: Props) {
  const r = useResponsive();
  const { t } = useTranslation();
  const swipeRef = useRef<Swipeable>(null);
  const photoSize = r.scale(78, { min: 64, max: 108 });

  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    if (carte.is_mine) {
      router.push(`/chef/group/${carte.id}` as any);
    } else {
      router.push(`/diner/group/${carte.id}` as any);
    }
  };

  const handleLongPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await Clipboard.setStringAsync(carte.access_code);
    showToast.success(t('chef.carteCodeCopied'), carte.access_code);
  };

  const closeAndCall = (fn: () => void) => () => {
    swipeRef.current?.close();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    fn();
  };

  const renderRightActions = () => (
    <View style={{ flexDirection: 'row', alignItems: 'stretch', paddingLeft: 8 }}>
      {carte.is_mine ? (
        <>
          <Pressable
            onPress={closeAndCall(() => onEdit(carte))}
            style={{
              width: 64,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: palette.inkSoft,
              borderRadius: 16,
              marginRight: 6,
            }}
          >
            <Pencil size={16} color="white" />
            <Text style={{ fontFamily: noteFont, fontSize: 11, color: 'white', marginTop: 2 }}>
              {t('common.edit')}
            </Text>
          </Pressable>
          <Pressable
            onPress={closeAndCall(() => onDelete(carte))}
            style={{
              width: 64,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#A30000',
              borderRadius: 16,
            }}
          >
            <Trash2 size={16} color="white" />
            <Text style={{ fontFamily: noteFont, fontSize: 11, color: 'white', marginTop: 2 }}>
              {t('common.delete')}
            </Text>
          </Pressable>
        </>
      ) : (
        <Pressable
          onPress={closeAndCall(() => onLeave(carte))}
          style={{
            width: 80,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#A30000',
            borderRadius: 16,
          }}
        >
          <LogOut size={16} color="white" />
          <Text style={{ fontFamily: noteFont, fontSize: 11, color: 'white', marginTop: 2 }}>
            退出
          </Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(280)}>
      <Swipeable
        ref={swipeRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
        rightThreshold={40}
      >
        <Tappable feedback="lift" onPress={handlePress} onLongPress={handleLongPress}>
          <SketchBox
            radius={16}
            seed={index + 4}
            fillColor={palette.paper}
            style={{ padding: 12 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {/* Thumb (left) */}
              {carte.chef_avatar_url ? (
                <SketchPhoto
                  src={carte.chef_avatar_url}
                  radius={12}
                  seed={index + 10}
                  style={{ width: photoSize, height: photoSize, flexShrink: 0 }}
                />
              ) : (
                <View
                  style={{
                    width: photoSize,
                    height: photoSize,
                    borderRadius: 12,
                    backgroundColor: palette.inkPale,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ChefHat size={28} color={palette.ink} strokeWidth={1.4} />
                </View>
              )}

              {/* Text + pill (right, flex 1) */}
              <View style={{ flex: 1, minWidth: 0 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: handFont,
                      fontSize: r.fontScale(22, { min: 18, max: 26 }),
                      color: palette.ink,
                      lineHeight: r.fontScale(24, { min: 20, max: 28 }),
                      flexShrink: 1,
                    }}
                    numberOfLines={1}
                  >
                    {carte.name}
                  </Text>
                  {carte.is_private ? (
                    <Lock size={13} color={palette.inkSoft} strokeWidth={1.5} />
                  ) : null}
                  <View style={{ flex: 1 }} />
                  <SketchPill active={carte.is_mine} seed={index + 6}>
                    {carte.is_mine ? 'CHEF' : 'DINER'}
                  </SketchPill>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 6,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: uiFont,
                      fontSize: 11,
                      color: palette.inkMute,
                      letterSpacing: 2.5,
                    }}
                  >
                    {carte.access_code}
                  </Text>
                  <Text
                    style={{ fontFamily: uiFont, fontSize: 11, color: palette.inkMute }}
                  >
                    ·
                  </Text>
                  <Text
                    style={{
                      fontFamily: noteFont,
                      fontSize: 11,
                      color: palette.inkMute,
                      flexShrink: 1,
                    }}
                    numberOfLines={1}
                  >
                    {carte.is_mine ? '我的' : carte.chef_username}
                  </Text>
                </View>
              </View>
            </View>
          </SketchBox>
        </Tappable>
      </Swipeable>
    </Animated.View>
  );
}
