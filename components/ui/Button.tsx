import { ActivityIndicator, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Tappable } from '@/components/ui/Tappable';
import { SketchBox } from '@/components/ui/sketch';
import { palette, handFont } from '@/lib/palette';

type Variant = 'primary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  /** Optional sketch seed for stable wobble shape */
  seed?: number;
}

/**
 * Sketch-styled button — uses SketchBox 999-radius pill with handFont label.
 * `primary` is strokeWidth 2 (emphasized); `outline` and others are 1.5.
 * `destructive` colors the stroke red.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth,
  seed = 1,
}: ButtonProps) {
  const handle = () => {
    if (disabled || loading) return;
    Haptics.selectionAsync().catch(() => {});
    onPress?.();
  };

  const isDestructive = variant === 'destructive';
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';

  const strokeColor = isDestructive ? '#A30000' : palette.ink;
  const textColor = isDestructive ? '#A30000' : palette.ink;
  const fontSize = size === 'sm' ? 16 : 18;
  const paddingV = size === 'sm' ? 8 : 12;

  if (isGhost) {
    return (
      <Tappable feedback="press" onPress={handle} disabled={disabled || loading}>
        <View
          style={{
            paddingVertical: paddingV,
            paddingHorizontal: 16,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: disabled ? 0.4 : 1,
            width: fullWidth ? '100%' : undefined,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={textColor} />
          ) : (
            <Text
              style={{
                fontFamily: handFont,
                fontSize,
                color: textColor,
              }}
            >
              {label}
            </Text>
          )}
        </View>
      </Tappable>
    );
  }

  return (
    <Tappable feedback="press" onPress={handle} disabled={disabled || loading}>
      <View
        style={{
          opacity: disabled ? 0.4 : 1,
          width: fullWidth ? '100%' : undefined,
        }}
      >
        <SketchBox
          radius={999}
          seed={seed}
          color={strokeColor}
          fillColor={palette.paper}
          strokeWidth={isPrimary ? 2 : 1.5}
          style={{ paddingVertical: paddingV }}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={textColor}
              style={{ alignSelf: 'center' }}
            />
          ) : (
            <Text
              style={{
                textAlign: 'center',
                fontFamily: handFont,
                fontSize,
                color: textColor,
                fontWeight: isPrimary ? '700' : '400',
              }}
            >
              {label}
            </Text>
          )}
        </SketchBox>
      </View>
    </Tappable>
  );
}
