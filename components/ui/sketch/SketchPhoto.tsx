import { useMemo, useState } from 'react';
import { LayoutChangeEvent, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';

import { palette } from '@/lib/palette';

import { buildHandPath, JITTER_BY_LEVEL, WobbleLevel } from './handPath';

interface PhotoProps {
  src: string | { uri: string } | number | null | undefined;
  radius?: number;
  seed?: number;
  wobble?: WobbleLevel;
  /** Optional contentFit for the inner image (default 'cover') */
  contentFit?: 'cover' | 'contain' | 'fill';
  style?: ViewStyle;
  /** When true, no fallback bg is shown if src is missing — caller renders fallback */
  noFallback?: boolean;
}

const FRAME_OFFSET = 4; // px the wobble frame floats outside the image
const FRAME_STROKE = 1.5;

/**
 * Image with a hand-drawn rounded frame floating ~4px outside it.
 *
 * Mirrors `SketchPhoto` from the Vite prototype. The CSS-filter approach
 * (`filter: url(#sketchy-N)`) doesn't translate to RN, so the wobble border
 * is drawn via the same `buildHandPath` algorithm used by SketchBox/SketchPill.
 */
export function SketchPhoto({
  src,
  radius = 12,
  seed = 1,
  wobble = 'soft',
  contentFit = 'cover',
  style,
  noFallback = false,
}: PhotoProps) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  };

  const frameW = size.w + FRAME_OFFSET * 2;
  const frameH = size.h + FRAME_OFFSET * 2;
  const frameRadius = radius + FRAME_OFFSET;

  const d = useMemo(
    () =>
      frameW > 0 && frameH > 0
        ? buildHandPath(frameW, frameH, frameRadius, seed, JITTER_BY_LEVEL[wobble])
        : '',
    [frameW, frameH, frameRadius, seed, wobble],
  );

  const imageSource =
    typeof src === 'string'
      ? { uri: src }
      : (src as any);

  return (
    <View style={[{ position: 'relative' }, style]} onLayout={onLayout}>
      {/* Image with rounded clip */}
      <View
        style={{
          width: '100%',
          height: '100%',
          borderRadius: radius,
          overflow: 'hidden',
          backgroundColor: noFallback ? 'transparent' : '#F5F5F5',
        }}
      >
        {src ? (
          <Image
            source={imageSource}
            style={{ width: '100%', height: '100%' }}
            contentFit={contentFit}
          />
        ) : null}
      </View>
      {/* Wobble frame floating outside */}
      {d ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -FRAME_OFFSET,
            left: -FRAME_OFFSET,
            width: frameW,
            height: frameH,
          }}
        >
          <Svg width={frameW} height={frameH} viewBox={`0 0 ${frameW} ${frameH}`}>
            <Path
              d={d}
              fill="none"
              stroke={palette.ink}
              strokeWidth={FRAME_STROKE}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </Svg>
        </View>
      ) : null}
    </View>
  );
}

interface CircleProps {
  src: string | { uri: string } | number | null | undefined;
  size: number;
  seed?: number;
  /** Override stroke color */
  color?: string;
  /** Show a fallback bg if src is missing (default true) */
  fallback?: boolean;
}

/**
 * Circular avatar with a hand-drawn frame floating ~3px outside.
 */
export function SketchPhotoCircle({
  src,
  size,
  seed = 1,
  color = palette.ink,
  fallback = true,
}: CircleProps) {
  const offset = 3;
  const frameSize = size + offset * 2;
  const imageSource =
    typeof src === 'string'
      ? { uri: src }
      : (src as any);

  return (
    <View style={{ position: 'relative', width: size, height: size }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          backgroundColor: fallback ? '#F5F5F5' : 'transparent',
        }}
      >
        {src ? (
          <Image
            source={imageSource}
            style={{ width: size, height: size }}
            contentFit="cover"
          />
        ) : null}
      </View>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -offset,
          left: -offset,
          width: frameSize,
          height: frameSize,
        }}
      >
        <Svg width={frameSize} height={frameSize}>
          {/* Slightly imperfect circle: two SVG circles offset by sub-pixel
              stroke so it reads as a hand-drawn ring without visible asymmetry. */}
          <Path
            d={describeCircle(frameSize / 2, frameSize / 2, frameSize / 2 - FRAME_STROKE / 2, seed)}
            fill="none"
            stroke={color}
            strokeWidth={FRAME_STROKE}
            strokeLinecap="round"
          />
        </Svg>
      </View>
    </View>
  );
}

// Slightly wobbly circle path. We trace 12 points around the circumference
// with seeded radial jitter so the ring reads as hand-drawn but stays
// recognizable as a circle (no clear ovaling).
function describeCircle(cx: number, cy: number, r: number, seed: number): string {
  const SEGMENTS = 12;
  const jitter = 0.6;
  const points: [number, number][] = [];
  for (let i = 0; i < SEGMENTS; i++) {
    const ang = (i / SEGMENTS) * Math.PI * 2;
    const noise = Math.sin(seed * 137.13 + i * 31.71);
    const rJitter = (noise - Math.floor(noise)) * 2 - 1; // -1..1
    const radius = r + rJitter * jitter;
    points.push([cx + Math.cos(ang) * radius, cy + Math.sin(ang) * radius]);
  }
  // smooth via quadratic bezier through points
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i <= SEGMENTS; i++) {
    const [x1, y1] = points[(i - 1) % SEGMENTS];
    const [x2, y2] = points[i % SEGMENTS];
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    d += ` Q ${x1} ${y1}, ${mx} ${my}`;
  }
  d += ' Z';
  return d;
}
