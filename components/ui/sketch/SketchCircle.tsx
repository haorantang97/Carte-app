import { ReactNode } from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { palette } from '@/lib/palette';

interface Props {
  size: number;
  children?: ReactNode;
  seed?: number; // accepted for API symmetry, currently unused
  strokeWidth?: number;
  color?: string;
  style?: ViewStyle;
  onPress?: () => void;
  testID?: string;
}

/**
 * Hand-style circle frame. We deliberately keep circles geometrically perfect
 * (per design call: "圆形按键不需要手绘") — the wobble system is for rectangles
 * and pills. Children are centered absolutely.
 */
export function SketchCircle({
  size,
  children,
  strokeWidth = 1.5,
  color = palette.ink,
  style,
  onPress,
  testID,
}: Props) {
  const inner = (
    <View
      style={[
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', top: 0, left: 0 }}
        pointerEvents="none"
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - strokeWidth / 2}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
        />
      </Svg>
      {children}
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      hitSlop={6}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
    >
      {inner}
    </Pressable>
  );
}
