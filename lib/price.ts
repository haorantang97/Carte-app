/** Format a numeric price as "$12.50" (default USD) */
export function formatPrice(value: number, currency: string = '$'): string {
  return `${currency}${value.toFixed(2)}`;
}

/** Parse a user-typed price string into a number; returns 0 for invalid input. */
export function parsePrice(input: string): number {
  const cleaned = input.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return Number.isFinite(num) && num >= 0 ? num : 0;
}
