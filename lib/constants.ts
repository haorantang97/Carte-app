/** Apple HIG: minimum tappable area */
export const TOUCH_TARGET_MIN = 44;

/** Bottom tab bar height (matches the original PWA's BOTTOM_NAV_HEIGHT) */
export const BOTTOM_NAV_HEIGHT = 64;

/** Single-source brand palette (mirrors twrnc theme.extend.colors) */
export const BRAND = {
  primary: '#A68B6A',
  primaryHover: '#8B7355',
  background: '#FAF9F6',
  textPrimary: '#171717',
  textSecondary: '#737373',
  border: '#E5E5E5',
  destructive: '#A30000',
} as const;

/** Toast default durations */
export const TOAST_DURATION = {
  short: 700,
  medium: 1500,
  long: 3000,
} as const;

/** Carte Code: 6 chars, uppercase alphanumeric (no 0/O, 1/I/L for legibility) */
export const CARTE_CODE_LENGTH = 6;
export const CARTE_CODE_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
