import { Pressable, Text, View } from 'react-native';
import { Pencil, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Sheet } from '@/components/ui/Sheet';
import tw from '@/lib/tw';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPickManual: () => void;
  onPickSmart: () => void;
}

export function AddDishMethodSheet({ visible, onClose, onPickManual, onPickSmart }: Props) {
  const handle = (fn: () => void) => () => {
    Haptics.selectionAsync().catch(() => {});
    onClose();
    setTimeout(fn, 240);
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="添加菜品">
      <View style={tw`gap-2 mt-1 pb-2`}>
        <Pressable
          onPress={handle(onPickManual)}
          style={({ pressed }) => [
            tw`flex-row items-center bg-white border border-gray-200 rounded-2xl p-4`,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <View style={tw`w-11 h-11 rounded-full bg-gray-100 items-center justify-center`}>
            <Pencil size={20} color="#171717" strokeWidth={1.5} />
          </View>
          <View style={tw`flex-1 ml-3`}>
            <Text style={tw`text-base font-medium text-gray-900`}>自己填写</Text>
            <Text style={tw`text-xs text-gray-500 mt-0.5`}>
              输入菜名、描述、食材、做法
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={handle(onPickSmart)}
          style={({ pressed }) => [
            tw`flex-row items-center bg-white border border-[#A68B6A] rounded-2xl p-4`,
            { opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <View style={tw`w-11 h-11 rounded-full bg-[#FAF6EE] items-center justify-center`}>
            <Sparkles size={20} color="#A68B6A" strokeWidth={1.5} />
          </View>
          <View style={tw`flex-1 ml-3`}>
            <Text style={tw`text-base font-semibold text-gray-900`}>
              AI 帮我整理
            </Text>
            <Text style={tw`text-xs text-gray-500 mt-0.5`}>
              贴链接 / 截图 / 描述意图,AI 自动生成完整菜谱
            </Text>
          </View>
        </Pressable>
      </View>
    </Sheet>
  );
}
