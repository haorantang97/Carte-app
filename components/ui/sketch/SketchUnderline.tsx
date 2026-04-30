import Svg, { Path } from 'react-native-svg';

import { BRAND } from '@/lib/constants';

interface Props {
  width?: number;
  seed?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Hand-drawn squiggly underline. Used under section titles and active labels.
 * The control-point wobble is seeded so each instance has a stable shape.
 */
export function SketchUnderline({
  width = 80,
  seed = 1,
  color = BRAND.textPrimary,
  strokeWidth = 1.5,
}: Props) {
  const wobble1 = 2 + Math.sin(seed * 1.3) * 2;
  const wobble2 = 6 + Math.cos(seed * 0.7) * 1.5;
  const d = `M 2 5 Q ${width * 0.25} ${wobble1} ${width * 0.5} ${wobble2} T ${width - 2} 5`;
  return (
    <Svg width={width} height={10}>
      <Path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
