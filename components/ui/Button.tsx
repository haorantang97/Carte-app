import { ActivityIndicator, Pressable, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import tw from '@/lib/tw';

type Variant = 'primary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md';

const variantStyles: Record<Variant, { bg: string; text: string; spinner: string }> = {
  primary: { bg: '#171717', text: '#FFFFFF', spinner: '#FFFFFF' },
  outline: { bg: 'transparent', text: '#171717', spinner: '#171717' },
  ghost: { bg: 'transparent', text: '#404040', spinner: '#404040' },
  destructive: { bg: '#A30000', text: '#FFFFFF', spinner: '#FFFFFF' },
};

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth,
}: ButtonProps) {
  const colors = variantStyles[variant];
  const handle = () => {
    if (disabled || loading) return;
    Haptics.selectionAsync().catch(() => {});
    onPress?.();
  };
  return (
    <Pressable
      onPress={handle}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        tw.style(
          'rounded-lg items-center justify-center',
          size === 'sm' ? 'px-4 py-2' : 'px-5 py-3',
          variant === 'outline' ? 'border border-gray-300' : '',
        ),
        { backgroundColor: colors.bg, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
        fullWidth ? { width: '100%' } : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.spinner} />
      ) : (
        <Text style={[tw.style(size === 'sm' ? 'text-xs' : 'text-sm', 'font-medium'), { color: colors.text }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
