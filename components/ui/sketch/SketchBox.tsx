import { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';

import { palette } from '@/lib/palette';

import { HandPathBorder } from './HandPathBorder';
import { WobbleLevel } from './handPath';

interface Props {
  children?: ReactNode;
  radius?: number;
  seed?: number;
  strokeWidth?: number;
  wobble?: WobbleLevel;
  color?: string;
  /** When set, the wobble path is filled with this color (perfectly clipped). */
  fillColor?: string;
  style?: ViewStyle;
}

/**
 * A `<View>` with a hand-drawn rounded border. Lay out children inside as
 * usual; the wobble border is rendered absolutely on top via `HandPathBorder`.
 */
export function SketchBox({
  children,
  radius = 14,
  seed = 1,
  strokeWidth = 1.5,
  wobble = 'soft',
  color = palette.ink,
  fillColor,
  style,
}: Props) {
  return (
    <View style={[{ position: 'relative' }, style]}>
      <HandPathBorder
        radius={radius}
        seed={seed}
        strokeWidth={strokeWidth}
        wobble={wobble}
        color={color}
        fillColor={fillColor}
      />
      {children}
    </View>
  );
}
