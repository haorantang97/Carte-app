import { AlertCircle } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Sheet } from '@/components/ui/Sheet';
import { SketchBox } from '@/components/ui/sketch';
import { useAiQuota } from '@/hooks/useAiQuota';
import tw from '@/lib/tw';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** "Keep going manually" fallback — opens the manual entry path. */
  onPickManual?: () => void;
  /** Pro upgrade CTA — currently a placeholder; wire to paywall when ready. */
  onUpgrade?: () => void;
}

/**
 * Gentle "you're out of AI runs" sheet — non-blocking, offers the manual path
 * as a fallback so the user is never stranded. Triggered when the user picks
 * "AI 智能填充" while their monthly quota is exhausted.
 */
export function AILimitSheet({ visible, onClose, onPickManual, onUpgrade }: Props) {
  const quota = useAiQuota();
  return (
    <Sheet visible={visible} onClose={onClose} title=" ">
      <View style={tw`items-center pb-2`}>
        <AlertCircle size={26} color="#171717" strokeWidth={1.5} />
        <Text style={tw`text-lg text-gray-900 mt-2`}>AI 额度用完了</Text>
        <Text
          style={[
            tw`text-xs text-gray-500 mt-1 text-center px-6`,
            { lineHeight: 18 },
          ]}
        >
          本月已用 {quota.used} / {quota.limit} 次{'\n'}可继续手动添加,或升级 Pro 解除上限
        </Text>
        <View style={tw`flex-row gap-2 mt-5 w-full`}>
          <Pressable
            onPress={() => {
              onClose();
              setTimeout(() => onPickManual?.(), 240);
            }}
            style={({ pressed }) => [tw`flex-1`, { opacity: pressed ? 0.7 : 1 }]}
          >
            <SketchBox seed={11} radius={999} style={tw`py-3 items-center`}>
              <Text style={tw`text-sm text-gray-500`}>手动添加</Text>
            </SketchBox>
          </Pressable>
          <Pressable
            onPress={() => {
              onClose();
              setTimeout(() => onUpgrade?.(), 240);
            }}
            style={({ pressed }) => [tw`flex-1`, { opacity: pressed ? 0.7 : 1 }]}
          >
            <SketchBox
              seed={13}
              radius={999}
              strokeWidth={2}
              style={tw`py-3 items-center`}
            >
              <Text style={tw`text-sm font-bold text-gray-900`}>升级 Pro</Text>
            </SketchBox>
          </Pressable>
        </View>
      </View>
    </Sheet>
  );
}
