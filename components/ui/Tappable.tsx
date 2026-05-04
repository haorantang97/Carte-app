import { ReactNode } from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

interface Props {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  /** 'press' = subtle opacity; 'lift' = scale + opacity; 'none' = no effect */
  feedback?: 'press' | 'lift' | 'none';
  /** Whether to fire light haptic on press (default true) */
  haptic?: boolean;
  hitSlop?: number;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Mirror of the Vite `Tappable` wrapper. Native Pressable with simple
 * pressed-state feedback (opacity / scale) and an optional light haptic.
 *
 * Keep wrapping shallow — never put complex layout children inside; instead
 * wrap a SketchBox / SketchPill / SketchCircle.
 */
export function Tappable({
  children,
  onPress,
  onLongPress,
  disabled = false,
  feedback = 'lift',
  haptic = true,
  hitSlop = 4,
  style,
  testID,
}: Props) {
  if (!onPress && !onLongPress) {
    return <View style={style}>{children}</View>;
  }

  const handlePress = () => {
    if (haptic) {
      Haptics.selectionAsync().catch(() => {});
    }
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      disabled={disabled}
      hitSlop={hitSlop}
      testID={testID}
      style={({ pressed }) => {
        const base: any = { opacity: disabled ? 0.5 : 1 };
        if (pressed && feedback !== 'none') {
          base.opacity = 0.75;
          if (feedback === 'lift') {
            base.transform = [{ scale: 0.97 }];
          }
        }
        return [base, style];
      }}
    >
      {children}
    </Pressable>
  );
}
