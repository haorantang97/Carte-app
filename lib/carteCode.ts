import { CARTE_CODE_CHARSET, CARTE_CODE_LENGTH } from './constants';

/** Random 6-char Carte Code (uppercase, ambiguous chars excluded). */
export function generateCarteCode(): string {
  let code = '';
  for (let i = 0; i < CARTE_CODE_LENGTH; i++) {
    code += CARTE_CODE_CHARSET[Math.floor(Math.random() * CARTE_CODE_CHARSET.length)];
  }
  return code;
}

/** Normalize user input: trim + uppercase. */
export function normalizeCarteCode(input: string): string {
  return input.trim().toUpperCase();
}

/** Strict format check (matches DB constraint: ^[A-Z0-9]{6}$). */
export function isValidCarteCode(input: string): boolean {
  return /^[A-Z0-9]{6}$/.test(input);
}
