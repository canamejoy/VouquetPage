/**
 * Path builders for the foliage illustrations. Angles are in degrees, 0 is up and they grow
 * clockwise; +y is down. Output uses absolute commands only so the drawing extent can be read
 * back from the markup.
 */

const round = (v: number) => Math.round(v * 10) / 10;
const pt = (x: number, y: number) => `${round(x)} ${round(y)}`;

function axes(angle: number) {
  const rad = (angle * Math.PI) / 180;
  return {
    dir: [Math.sin(rad), -Math.cos(rad)] as const,
    side: [Math.cos(rad), Math.sin(rad)] as const,
  };
}

/**
 * One leaf from its base (x, y) along `angle`. `width` is the half-width at the middle.
 * A pointed leaf swells in the middle; a round one (a coin) swells right from its base.
 */
export function leaf(
  x: number,
  y: number,
  angle: number,
  length: number,
  width: number,
  rounded = false,
): string {
  const { dir, side } = axes(angle);
  const at = (along: number, across: number) =>
    pt(
      x + dir[0] * length * along + side[0] * width * 1.33 * across,
      y + dir[1] * length * along + side[1] * width * 1.33 * across,
    );
  const [near, far] = rounded ? [0, 1] : [0.3, 0.7];
  return `M${pt(x, y)} C${at(near, -1)} ${at(far, -1)} ${at(1, 0)} C${at(far, 1)} ${at(near, 1)} ${pt(x, y)} Z`;
}

/** A thin tapered strip from the base (x, y) to a point `length` away along `angle`. */
export function rib(x: number, y: number, angle: number, length: number, width: number): string {
  const { dir, side } = axes(angle);
  const tx = x + dir[0] * length;
  const ty = y + dir[1] * length;
  const edge = (px: number, py: number, w: number, s: number) =>
    pt(px + side[0] * w * s, py + side[1] * w * s);
  return `M${edge(x, y, width, -1)} L${edge(tx, ty, width * 0.35, -1)} L${edge(tx, ty, width * 0.35, 1)} L${edge(x, y, width, 1)} Z`;
}

interface Pinnate {
  x: number;
  y: number;
  angle: number;
  /** Length of the rib the leaves hang on. */
  length: number;
  pairs: number;
  /** Per-leaf size and divergence from the rib; `t` runs from 0 at the base to 1 at the tip. */
  leafLength: (t: number) => number;
  leafWidth: (t: number) => number;
  spread: (t: number) => number;
  /** One leaf per node, alternating sides, instead of a pair. */
  alternate?: boolean;
  rounded?: boolean;
  /** A terminal leaf on the end of the rib. */
  tip?: boolean;
  /** Scales every leaf; a smaller copy drawn on top reads as a lighter inner tint. */
  shrink?: number;
}

/** Leaves along a rib, as one path: the layout shared by every sprig. */
export function pinnate(o: Pinnate): string {
  const { dir } = axes(o.angle);
  const k = o.shrink ?? 1;
  const draw = (px: number, py: number, angle: number, t: number, extra = 1) =>
    leaf(px, py, angle, o.leafLength(t) * k * extra, o.leafWidth(t) * k * extra, o.rounded);
  const leaves = Array.from({ length: o.pairs }, (_, i) => {
    const t = o.pairs === 1 ? 0 : i / (o.pairs - 1);
    const along = o.length * (0.08 + 0.84 * t);
    const px = o.x + dir[0] * along;
    const py = o.y + dir[1] * along;
    const left = draw(px, py, o.angle - o.spread(t), t);
    const right = draw(px, py, o.angle + o.spread(t), t);
    return o.alternate ? (i % 2 === 0 ? left : right) : `${left} ${right}`;
  });
  if (o.tip) {
    leaves.push(draw(o.x + dir[0] * o.length, o.y + dir[1] * o.length, o.angle, 1, 1.1));
  }
  return leaves.join(' ');
}
