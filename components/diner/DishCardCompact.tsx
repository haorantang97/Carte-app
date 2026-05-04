import { Text, View } from 'react-native';
import { Minus, Plus, UtensilsCrossed } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

import { Tappable } from '@/components/ui/Tappable';
import { SketchBox, SketchCircle, SketchPhoto } from '@/components/ui/sketch';
import { palette, handFont, noteFont, titleFont } from '@/lib/palette';
import { useResponsive } from '@/lib/responsive';
import { formatPrice } from '@/lib/price';
import type { DinerDish } from '@/hooks/diner/useDinerMenu';

interface Props {
  dish: DinerDish;
  index: number;
  qty: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function DishCardCompact({
  dish,
  index,
  qty,
  onAdd,
  onIncrement,
  onDecrement,
}: Props) {
  const r = useResponsive();
  const photoSize = r.scale(78, { min: 64, max: 108 });
  const meta = [
    dish.cuisine,
    dish.total_time_min ? `${dish.total_time_min} min` : null,
    dish.calories ? `${dish.calories} cal` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <SketchBox
      radius={16}
      seed={index + 1}
      fillColor={palette.paper}
      style={{ padding: 12 }}
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Tappable
          feedback="lift"
          onPress={() => router.push(`/dish/${dish.id}` as any)}
        >
          {dish.image_url ? (
            <SketchPhoto
              src={dish.image_url}
              radius={10}
              seed={index + 5}
              style={{ width: photoSize, height: photoSize, flexShrink: 0 }}
            />
          ) : (
            <View
              style={{
                width: photoSize,
                height: photoSize,
                borderRadius: 10,
                backgroundColor: palette.inkPale,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UtensilsCrossed size={24} color={palette.ink} strokeWidth={1.4} />
            </View>
          )}
        </Tappable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontFamily: handFont,
              fontSize: r.fontScale(22, { min: 18, max: 26 }),
              color: palette.ink,
              lineHeight: r.fontScale(23, { min: 19, max: 27 }),
            }}
            numberOfLines={1}
          >
            {dish.name}
          </Text>
          {dish.description ? (
            <Text
              style={{
                fontFamily: noteFont,
                fontSize: 12,
                color: palette.inkSoft,
                lineHeight: 17,
                marginTop: 2,
              }}
              numberOfLines={2}
            >
              {dish.description}
            </Text>
          ) : null}
          {meta ? (
            <Text
              style={{
                fontFamily: noteFont,
                fontSize: 11,
                color: palette.inkMute,
                marginTop: 4,
              }}
              numberOfLines={1}
            >
              {meta}
            </Text>
          ) : null}
          <View
            style={{
              marginTop: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text
              style={{
                fontFamily: titleFont,
                fontStyle: 'italic',
                fontSize: 18,
                color: palette.ink,
              }}
            >
              {Number(dish.price) > 0 ? formatPrice(Number(dish.price)) : ' '}
            </Text>
            {qty === 0 ? (
              <Tappable
                feedback="press"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  onAdd();
                }}
              >
                <SketchCircle size={32} seed={index + 7}>
                  <Plus size={16} color={palette.ink} strokeWidth={1.6} />
                </SketchCircle>
              </Tappable>
            ) : (
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <Tappable feedback="press" onPress={onDecrement}>
                  <SketchCircle size={26} seed={index + 8}>
                    <Minus size={13} color={palette.ink} strokeWidth={1.6} />
                  </SketchCircle>
                </Tappable>
                <Text
                  style={{
                    fontFamily: handFont,
                    fontSize: 20,
                    color: palette.ink,
                    minWidth: 16,
                    textAlign: 'center',
                  }}
                >
                  {qty}
                </Text>
                <Tappable feedback="press" onPress={onIncrement}>
                  <SketchCircle size={26} seed={index + 9}>
                    <Plus size={13} color={palette.ink} strokeWidth={1.6} />
                  </SketchCircle>
                </Tappable>
              </View>
            )}
          </View>
        </View>
      </View>
    </SketchBox>
  );
}
