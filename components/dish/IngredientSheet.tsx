import { Text, View } from 'react-native';
import { Sheet } from '@/components/ui/Sheet';
import { palette, handFont, noteFont, titleFont } from '@/lib/palette';
import type { IngredientLike } from './HighlightedStepText';

interface Props {
  visible: boolean;
  onClose: () => void;
  ingredient: IngredientLike | null;
  scaledQuantity?: string;
}

export function IngredientSheet({
  visible,
  onClose,
  ingredient,
  scaledQuantity,
}: Props) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={ingredient?.name ?? '食材'}
    >
      <View style={{ gap: 16, marginTop: 8, paddingBottom: 16 }}>
        {ingredient?.quantity ? (
          <View>
            <Text
              style={{
                fontFamily: noteFont,
                fontSize: 11,
                color: palette.inkMute,
                marginBottom: 4,
              }}
            >
              用量
            </Text>
            <Text
              style={{
                fontFamily: titleFont,
                fontStyle: 'italic',
                fontSize: 28,
                color: palette.ink,
                fontWeight: '700',
              }}
            >
              {scaledQuantity ?? ingredient.quantity}
            </Text>
            {scaledQuantity && scaledQuantity !== ingredient.quantity ? (
              <Text
                style={{
                  fontFamily: noteFont,
                  fontSize: 12,
                  color: palette.inkSoft,
                  marginTop: 4,
                }}
              >
                原 {ingredient.quantity}
              </Text>
            ) : null}
          </View>
        ) : (
          <View>
            <Text
              style={{
                fontFamily: noteFont,
                fontSize: 11,
                color: palette.inkMute,
                marginBottom: 4,
              }}
            >
              用量
            </Text>
            <Text
              style={{
                fontFamily: handFont,
                fontSize: 16,
                color: palette.inkSoft,
              }}
            >
              未注明,按口味添加
            </Text>
          </View>
        )}
        {ingredient?.note ? (
          <View>
            <Text
              style={{
                fontFamily: noteFont,
                fontSize: 11,
                color: palette.inkMute,
                marginBottom: 4,
              }}
            >
              备注
            </Text>
            <Text
              style={{
                fontFamily: noteFont,
                fontSize: 14,
                color: palette.ink,
                lineHeight: 22,
              }}
            >
              {ingredient.note}
            </Text>
          </View>
        ) : null}
      </View>
    </Sheet>
  );
}
