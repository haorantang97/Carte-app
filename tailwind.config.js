/**
 * twrnc config — runtime Tailwind utility for React Native.
 * Mirrors the original PWA's brutalist-minimalist palette.
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        // Brand / accent (legacy tan for some flows; new sketch UI uses navy ink).
        brand: '#A68B6A',
        'brand-hover': '#8B7355',
        // Page background: Vite design uses pure white "paper".
        bg: '#FFFFFF',
        // Sketch ink palette — mirrors lib/palette.ts.
        ink: '#1E3A8A',
        'ink-soft': '#3A5BB8',
        'ink-mute': '#7B95D6',
        'ink-pale': '#BFCDEB',
        gray: {
          50: '#FAF9F6',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontFamily: {
        // Body / UI: Inter — neutral, premium grotesque used by Linear/Stripe/Vercel.
        sans: ['Inter_400Regular', 'system-ui', '-apple-system', 'sans-serif'],
        // Brand / display: Fraunces — modern serif with subtle warmth, replaces
        // the bare Times New Roman header.
        serif: ['Fraunces_400Regular', 'Georgia', 'Times', 'serif'],
        mono: ['Menlo', 'Courier', 'monospace'],
      },
    },
  },
};
