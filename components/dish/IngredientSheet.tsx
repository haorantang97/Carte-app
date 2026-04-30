import { Text, View } from 'react-native';
import { Sheet } from '@/components/ui/Sheet';
import tw from '@/lib/tw';
import type { IngredientLike } from './HighlightedStepText';

interface Props {
  visible: boolean;
  onClose: () => void;
  ingredient: IngredientLike | null;
  /** 已按 servings ratio 缩放后的用量(可选)。未传则显示原 quantity。 */
  scaledQuantity?: string;
}

/**
 * 食材详情 bottom sheet — 步骤里点击食材 token 时弹出。
 * 显示:用量(原文 + 缩放后) + 备注(如果有)。
 */
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
      <View style={tw`gap-4 mt-2 pb-4`}>
        {ingredient?.quantity ? (
          <View>
            <Text style={tw`text-[10px] text-gray-500 mb-1`}>用量</Text>
            <Text style={tw`text-2xl font-semibold text-gray-900`}>
              {scaledQuantity ?? ingredient.quantity}
            </Text>
            {scaledQuantity && scaledQuantity !== ingredient.quantity ? (
              <Text style={tw`text-[11px] text-gray-500 mt-1`}>
                原 {ingredient.quantity}
              </Text>
            ) : null}
          </View>
        ) : (
          <View>
            <Text style={tw`text-[10px] text-gray-500 mb-1`}>用量</Text>
            <Text style={tw`text-sm text-gray-500`}>未注明,按口味添加</Text>
          </View>
        )}
        {ingredient?.note ? (
          <View>
            <Text style={tw`text-[10px] text-gray-500 mb-1`}>备注</Text>
            <Text style={tw`text-sm text-gray-700 leading-relaxed`}>
              {ingredient.note}
            </Text>
          </View>
        ) : null}
      </View>
    </Sheet>
  );
}
