// Hand-drawn rounded-rect SVG path generator.
// Mirrors the Vite prototype logic: every edge is a multi-segment cubic Bézier
// and every corner is a quadratic Bézier. Control points are perturbed by a
// deterministic seed so each box has a unique-but-stable hand-drawn look.

export type WobbleLevel = 'soft' | 'mid' | 'strong';

// Tuned softer than Vite's 1.8 — at native iOS 3x DPI the SVG path renders
// crisper than Figma's web preview, so the same numeric jitter looks "more
// wobbly" on device. 1.2 gives a wobble visually comparable to what the user
// sees in Figma at iPhone 14 preview size.
export const JITTER_BY_LEVEL: Record<WobbleLevel, number> = {
  soft: 1.2,
  mid: 2.2,
  strong: 3.6,
};

/** Pseudo-random in [-1, 1] from (seed, index). */
function srand(seed: number, i: number): number {
  const x = Math.sin(seed * 137.13 + i * 31.71) * 10000;
  return (x - Math.floor(x)) * 2 - 1;
}

/**
 * Build an SVG `d` string for a rounded rectangle whose edges have a smooth
 * hand-drawn wobble. Long edges are split into multiple cubic segments so the
 * wobble has multiple gentle waves rather than one big stretched bow.
 *
 * Radius is clamped to min(w, h) / 2 so pill shapes (`radius=999`) work.
 */
export function buildHandPath(
  w: number,
  h: number,
  radius: number,
  seed: number,
  jitter: number,
): string {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  let cursor = 0;
  const j = (idx: number, amp = jitter) => srand(seed, idx) * amp;

  const edge = (
    ax: number,
    ay: number,
    bx: number,
    by: number,
    nx: number,
    ny: number,
  ): string => {
    const length = Math.hypot(bx - ax, by - ay);
    const segs = Math.max(1, Math.ceil(length / 100));
    const ampScale = 0.85 + Math.min(length, 350) * 0.004;
    let str = '';
    for (let s = 0; s < segs; s++) {
      const t1 = s / segs;
      const t2 = (s + 1) / segs;
      const tA = t1 + 1 / 3 / segs;
      const tB = t1 + 2 / 3 / segs;
      const ex = ax + (bx - ax) * t2;
      const ey = ay + (by - ay) * t2;
      const c1x = ax + (bx - ax) * tA + nx * j(cursor++, jitter * ampScale);
      const c1y = ay + (by - ay) * tA + ny * j(cursor++, jitter * ampScale);
      const c2x = ax + (bx - ax) * tB + nx * j(cursor++, jitter * ampScale);
      const c2y = ay + (by - ay) * tB + ny * j(cursor++, jitter * ampScale);
      str += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${ex} ${ey}`;
    }
    return str;
  };

  const corner = (cx: number, cy: number, ex: number, ey: number): string =>
    ` Q ${cx + j(cursor++, jitter * 0.6)} ${cy + j(cursor++, jitter * 0.6)}, ${ex} ${ey}`;

  const x1 = r;
  const y1 = 0;
  const x2 = w - r;
  const y2 = 0;
  const x3 = w;
  const y3 = r;
  const x4 = w;
  const y4 = h - r;
  const x5 = w - r;
  const y5 = h;
  const x6 = r;
  const y6 = h;
  const x7 = 0;
  const y7 = h - r;
  const x8 = 0;
  const y8 = r;

  let d = `M ${x1} ${y1}`;
  d += edge(x1, y1, x2, y2, 0, 1);
  d += corner(w, 0, x3, y3);
  d += edge(x3, y3, x4, y4, -1, 0);
  d += corner(w, h, x5, y5);
  d += edge(x5, y5, x6, y6, 0, -1);
  d += corner(0, h, x7, y7);
  d += edge(x7, y7, x8, y8, 1, 0);
  d += corner(0, 0, x1, y1);
  d += ' Z';
  return d;
}
