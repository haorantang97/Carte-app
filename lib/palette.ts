// Mirrors /Downloads/UI Redesign Brief new/src/app/components/tokens.ts.
// Source-of-truth navy-ink palette for the new sketch-style UI.

export const palette = {
  paper: '#FFFFFF',
  paperTint: '#FCFBF7',
  ink: '#1E3A8A',
  inkSoft: '#3A5BB8',
  inkMute: '#7B95D6',
  inkPale: '#BFCDEB',
  hand: '#1E3A8A',
} as const;

// =============================================================================
// Typography — match Figma's actual rendering (Latin-only fonts + CJK fallback)
// =============================================================================
//
// Figma uses Caveat / Kalam / Inter / Fraunces — all LATIN-ONLY fonts. Chinese
// characters auto-fall-back to the browser's system Chinese (PingFang SC on
// macOS). We replicate the same behavior here: Latin-only fonts in JS, iOS
// silently falls back to PingFang SC for CJK glyphs.
//
// On mixed-script text like "我的 Cartes" — Chinese renders as PingFang,
// "Cartes" as Caveat — exactly what Figma shows.
//
// The "warm hand-crafted" feel in Figma comes from THREE places, NOT the
// Chinese characters:
//   1. Sketch wobbly borders (HandPathBorder / SketchBox / SketchPill)
//   2. Caveat handwriting on Latin labels ("Carte", "PJWBBS", "DINER")
//   3. Italic Fraunces serif on numerics (¥68, step numbers)
//
// Forcing a Chinese handwritten font (ZCOOL XiaoWei, Long Cang, Liu Jian Mao
// Cao) for handFont made Chinese text brushy & noisy while Figma's actual
// render is clean PingFang on Chinese. We tried that, looked wrong, reverted.
//
//   titleFont (Fraunces italic) — brand display + numeric values only.
//                                 e.g. "Carte" logo, ¥68 prices, step numbers
//   handFont  (Caveat)          — WARM display moments (≥18px).
//                                 e.g. section titles, card names, pill labels
//   noteFont  (Inter→PingFang)  — NEUTRAL body / meta (≤16px).
//                                 e.g. descriptions, dates, captions, secondary
//   uiFont    (Inter)           — letter-spaced codes only.
//                                 e.g. "PJWBBS" 6-char carte code

export const handFont = 'Caveat_400Regular';
export const noteFont = 'Inter_400Regular';
export const noteFontMedium = 'Inter_500Medium';
// Optional brush display for very rare emphasis moments (not used by default)
export const displayFont = 'MaShanZheng_400Regular';
export const uiFont = 'Inter_400Regular';
export const uiFontMedium = 'Inter_500Medium';
export const uiFontSemi = 'Inter_600SemiBold';
export const titleFont = 'Fraunces_400Regular';
export const titleFontMedium = 'Fraunces_500Medium';
export const titleFontSemi = 'Fraunces_600SemiBold';

// English-only handwriting — for Latin-only labels where Caveat's casual feel
// is preferable to ZCOOL XiaoWei's romanized glyphs.
export const handFontEn = 'Caveat_400Regular';
export const handFontEnBold = 'Caveat_700Bold';
