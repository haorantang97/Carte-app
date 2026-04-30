import { useMemo, useState } from 'react';
import { LayoutChangeEvent, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { BRAND } from '@/lib/constants';

import { buildHandPath, JITTER_BY_LEVEL, WobbleLevel } from './handPath';

interface Props {
  radius: number;
  seed: number;
  strokeWidth?: number;
  wobble?: WobbleLevel;
  color?: string;
  style?: ViewStyle;
}

/**
 * Absolutely-positioned hand-drawn border. Drop inside a relatively-positioned
 * parent — it measures its own size via onLayout and renders an SVG path.
 */
export function HandPathBorder({
  radius,
  seed,
  strokeWidth = 1.5,
  wobble = 'soft',
  color = BRAND.textPrimary,
  style,
}: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  };

  const d = useMemo(
    () =>
      size.w > 0 && size.h > 0
        ? buildHandPath(size.w, size.h, radius, seed, JITTER_BY_LEVEL[wobble])
        : '',
    [size.w, size.h, radius, seed, wobble],
  );

  return (
    <View
      onLayout={onLayout}
      pointerEvents="none"
      style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, style]}
    >
      {d ? (
        <Svg width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`}>
          <Path
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>
      ) : null}
    </View>
  );
}
