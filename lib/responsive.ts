import { useWindowDimensions, PixelRatio, Dimensions } from 'react-native';

/**
 * Reference design width (iPhone 14 / 15 standard). All "design tokens" in
 * the codebase are expressed against this baseline; everything else scales
 * relative to it.
 */
export const BASE_WIDTH = 390;

/**
 * Tablet breakpoint. Anything ≥ this in width gets the tablet layout
 * (max-width content frame, multi-column grids).
 */
export const TABLET_THRESHOLD = 600;

/**
 * Cap how much we scale up on very wide devices — at 1.4× even body fonts
 * get gigantic, so we clamp here to keep proportions reasonable.
 */
const MAX_RATIO = 1.4;

/**
 * Cap user accessibility text scale — beyond ~1.3× many of our compact
 * layouts (pills, sidebar) overflow. We still respect the user's
 * preference up to that ceiling.
 */
const MAX_FONT_ACC_SCALE = 1.3;

interface ScaleOpts {
  min?: number;
  max?: number;
}

/**
 * Live, rotation-aware responsive helpers. Use this hook inside
 * components — values update if the user resizes (iPad split) or rotates.
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  return makeResponsive(width, height);
}

function makeResponsive(width: number, height: number) {
  const ratio = Math.min(width / BASE_WIDTH, MAX_RATIO);
  const isSmall = width < 360; // iPhone SE 1st gen, iPhone 5/5s
  const isCompact = width < 390; // SE 2/3, mini
  const isRegular = width >= 390 && width < 414;
  const isLarge = width >= 414 && width < TABLET_THRESHOLD;
  const isTablet = width >= TABLET_THRESHOLD;

  /**
   * Scale a numeric size by the screen ratio and clamp to [min, max].
   * Defaults preserve the original size on the reference device.
   */
  const scale = (n: number, opts?: ScaleOpts): number => {
    let v = n * ratio;
    if (opts?.min !== undefined) v = Math.max(v, opts.min);
    if (opts?.max !== undefined) v = Math.min(v, opts.max);
    return Math.round(v);
  };

  /**
   * Scale a font size, optionally respecting the user's text-size
   * accessibility setting. Capped to avoid breaking compact layouts.
   */
  const fontScale = (n: number, opts?: ScaleOpts & { respectA11y?: boolean }): number => {
    const sized = scale(n, opts);
    if (opts?.respectA11y === false) return sized;
    const acc = Math.min(PixelRatio.getFontScale(), MAX_FONT_ACC_SCALE);
    return Math.round(sized * acc);
  };

  /** Viewport-width percentage. */
  const vw = (pct: number): number => Math.round(width * (pct / 100));

  /** Viewport-height percentage. */
  const vh = (pct: number): number => Math.round(height * (pct / 100));

  /**
   * Max content width — caps the readable column on tablets so lines don't
   * stretch absurdly. Returns the full screen width on phones.
   */
  const contentMaxWidth = isTablet ? 560 : width;

  return {
    width,
    height,
    ratio,
    isSmall,
    isCompact,
    isRegular,
    isLarge,
    isTablet,
    scale,
    fontScale,
    vw,
    vh,
    contentMaxWidth,
  };
}

// =====================================================================
// Static (non-hook) helpers — use sparingly, only for module-level
// constants that don't need rotation updates. Hook is preferred for
// component code.
// =====================================================================

const { width: _SW, height: _SH } = Dimensions.get('window');

export const STATIC = makeResponsive(_SW, _SH);

/** Module-level scale (no rotation reactivity). */
export const scale = STATIC.scale;
export const fontScale = STATIC.fontScale;
export const vw = STATIC.vw;
export const vh = STATIC.vh;
export const isTablet = STATIC.isTablet;
export const isSmall = STATIC.isSmall;
export const isCompact = STATIC.isCompact;
