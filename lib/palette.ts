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
  // Semantic accent colors. Used sparingly — only for destructive actions
  // (delete buttons, error inline) and success confirmations (URL detected,
  // upload OK). All other UI sticks with the navy ink scale.
  destructive: '#A30000',
  success: '#0A6E2A',
} as const;

// =============================================================================
// Typography — match Vite tokens.ts verbatim (Latin-only fonts + CJK fallback)
// =============================================================================
//
// Vite tokens.ts is the source of truth:
//   handFont = "'Caveat', 'Kalam', cursive"   ← prefer Caveat, fallback Kalam
//   noteFont = "'Kalam', 'Caveat', cursive"   ← prefer Kalam, fallback Caveat
//   uiFont   = "'Inter', system-ui, sans-serif"
//   titleFont = "'Fraunces', serif"
//
// Caveat / Kalam are LATIN-ONLY, so iOS auto-falls-back to system PingFang SC
// for Chinese glyphs — exactly mirroring how Figma/Chrome renders ("我的
// Cartes" → 中文 PingFang + Latin Caveat).
//
// The "warm hand-crafted" feel comes from THREE places, NOT the Chinese:
//   1. Sketch wobbly borders (HandPathBorder / SketchBox / SketchPill)
//   2. Caveat / Kalam handwriting on Latin labels ("Carte", "PJWBBS", "DINER")
//   3. Italic Fraunces serif on numerics (¥68, step numbers)
//
// HISTORY:
//   - 5/4 first attempt: noteFont swapped to Inter — user pushed back ("我感觉
//     字体还是不一样的啊"). Inter is mechanical sans-serif; Vite's noteFont is
//     handwriting (Kalam). The CJK fallback was right, the Latin face was wrong.
//   - Now: noteFont = Kalam (matches Vite verbatim per pixel-port directive).
//   - DO NOT use ZCOOL XiaoWei / Liu Jian Mao Cao / etc. for Chinese — that
//     was tried earlier in 5/4 and looked brushy/noisy.
//
//   titleFont (Fraunces italic) — brand display + numeric values only.
//                                 e.g. "Carte" logo, ¥68 prices, step numbers
//   handFont  (Caveat)          — WARM display moments (≥18px).
//                                 e.g. section titles, card names, pill labels
//   noteFont  (Kalam)           — NEUTRAL body / meta (≤16px), still handwriting
//                                 just calmer than Caveat.
//   uiFont    (Inter)           — letter-spaced codes + global <Text> default.
//                                 e.g. "PJWBBS" 6-char carte code

export const handFont = 'Caveat_400Regular';
export const noteFont = 'Kalam_400Regular';
// Kalam ships only 300/400/700 — no Medium 500. Map "Medium" emphasis to Bold.
export const noteFontMedium = 'Kalam_700Bold';
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
