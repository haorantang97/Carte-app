import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { ChefHat, ScrollText } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { SketchBox, HandPathBorder } from '@/components/ui/sketch';
import { Tappable } from '@/components/ui/Tappable';
import { palette, handFont } from '@/lib/palette';
import { useResponsive } from '@/lib/responsive';

interface Props {
  active: 'kitchen' | 'orders';
}

/**
 * Custom sticky bottom tab bar matching the Vite prototype's design.
 * Renders inside each tab screen (we hide expo-router's default bar).
 *
 * Visually: a hand-drawn rounded-pill SketchBox containing two halves;
 * the active half has its own inner wobble border (drawn over the outer).
 */
export function SketchBottomTabs({ active }: Props) {
  const r = useResponsive();
  // On tablets, cap pill width so tabs don't stretch the whole iPad screen.
  const padH = r.isTablet
    ? Math.max(28, (r.width - r.contentMaxWidth) / 2)
    : r.scale(22, { min: 16, max: 32 });
  const labelSize = r.fontScale(18, { min: 16, max: 22 });
  const iconSize = r.scale(16, { min: 14, max: 20 });
  const goKitchen = () => {
    if (active === 'kitchen') return;
    router.replace('/(tabs)/kitchen' as any);
  };
  const goOrders = () => {
    if (active === 'orders') return;
    router.replace('/(tabs)/orders' as any);
  };

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
      }}
      pointerEvents="box-none"
    >
      <LinearGradient
        colors={['rgba(255,255,255,0)', '#FFFFFF']}
        locations={[0, 0.5]}
        style={{
          paddingTop: 16,
          paddingBottom: r.scale(22, { min: 18, max: 32 }),
          paddingHorizontal: padH,
        }}
      >
        <SketchBox
          radius={999}
          seed={8}
          fillColor="#FFFFFF"
          style={{ padding: 6 }}
        >
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <Tappable
              feedback="press"
              onPress={goKitchen}
              style={{ flex: 1 }}
            >
              <View
                style={{
                  paddingVertical: 11,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  position: 'relative',
                }}
              >
                {active === 'kitchen' ? (
                  <View
                    pointerEvents="none"
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                  >
                    <HandPathBorder
                      radius={999}
                      seed={2}
                      strokeWidth={1.5}
                      wobble="soft"
                    />
                  </View>
                ) : null}
                <ChefHat
                  size={iconSize}
                  color={active === 'kitchen' ? palette.ink : palette.inkSoft}
                  strokeWidth={1.5}
                />
                <Text
                  style={{
                    fontFamily: handFont,
                    fontSize: labelSize,
                    color: active === 'kitchen' ? palette.ink : palette.inkSoft,
                  }}
                >
                  Kitchen
                </Text>
              </View>
            </Tappable>
            <Tappable
              feedback="press"
              onPress={goOrders}
              style={{ flex: 1 }}
            >
              <View
                style={{
                  paddingVertical: 11,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  position: 'relative',
                }}
              >
                {active === 'orders' ? (
                  <View
                    pointerEvents="none"
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                  >
                    <HandPathBorder
                      radius={999}
                      seed={2}
                      strokeWidth={1.5}
                      wobble="soft"
                    />
                  </View>
                ) : null}
                <ScrollText
                  size={iconSize}
                  color={active === 'orders' ? palette.ink : palette.inkSoft}
                  strokeWidth={1.5}
                />
                <Text
                  style={{
                    fontFamily: handFont,
                    fontSize: labelSize,
                    color: active === 'orders' ? palette.ink : palette.inkSoft,
                  }}
                >
                  后厨
                </Text>
              </View>
            </Tappable>
          </View>
        </SketchBox>
      </LinearGradient>
    </View>
  );
}
