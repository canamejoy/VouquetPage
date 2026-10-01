/**
 * Path builders for the flower illustrations. Angles are in degrees, 0 is up and they grow
 * clockwise; the origin is the flower centre. Output uses absolute commands only so the
 * drawing extent can be read back from the markup.
 */

type Pt = readonly [number, number];

const round = (v: number) => Math.round(v * 10) / 10;

function polar(radius: number, degrees: number): Pt {
  const rad = (degrees * Math.PI) / 180;
  return [radius * Math.sin(rad), -radius * Math.cos(rad)];
}

const xy = ([x, y]: Pt) => `${round(x)} ${round(y)}`;

const steps = (count: number) => Array.from({ length: count }, (_, i) => i);

/** A ring of petals, one closed subpath each, pointing outwards from `inner` to `outer`. */
export function petalRing(
  count: number,
  inner: number,
  outer: number,
  halfWidth: number,
  offset = 0,
  pointed = false,
): string {
  const mid = inner + (outer - inner) * 0.5;
  return steps(count)
    .map((i) => {
      const a = offset + (360 * i) / count;
      const base = xy(polar(inner, a));
      const tip = xy(polar(outer, a));
      if (pointed) {
        return `M${base} Q${xy(polar(mid, a - halfWidth))} ${tip} Q${xy(polar(mid, a + halfWidth))} ${base} Z`;
      }
      return `M${base} C${xy(polar(mid, a - halfWidth * 1.3))} ${xy(polar(outer, a - halfWidth * 0.8))} ${tip} C${xy(polar(outer, a + halfWidth * 0.8))} ${xy(polar(mid, a + halfWidth * 1.3))} ${base} Z`;
    })
    .join(' ');
}

/** A closed outline of `count` rounded lobes; each lobe peaks near `radius + bulge / 2`. */
export function scallop(count: number, radius: number, bulge: number, offset = 0): string {
  const step = 360 / count;
  const lobes = steps(count).map((i) => {
    const a = offset + step * i;
    return `Q${xy(polar(radius + bulge, a + step / 2))} ${xy(polar(radius, a + step))}`;
  });
  return `M${xy(polar(radius, offset))} ${lobes.join(' ')} Z`;
}

/** A closed zigzag edge: `count` teeth reaching `radius`, valleys `depth` closer in. */
export function serrated(count: number, radius: number, depth: number, offset = 0): string {
  const step = 360 / count;
  const teeth = steps(count).map(
    (i) =>
      `L${xy(polar(radius - depth, offset + step * (i + 0.5)))} ${xy(polar(radius, offset + step * (i + 1)))}`,
  );
  return `M${xy(polar(radius, offset))} ${teeth.join(' ')} Z`;
}

/** Small rounded blobs (florets, anthers) centred on the given points, as one path. */
export function blobs(centers: readonly Pt[], rx: number, ry: number): string {
  return centers
    .map(([x, y]) => {
      const dx = rx * 1.3;
      return `M${xy([x, y - ry])} C${xy([x + dx, y - ry])} ${xy([x + dx, y + ry])} ${xy([x, y + ry])} C${xy([x - dx, y + ry])} ${xy([x - dx, y - ry])} ${xy([x, y - ry])} Z`;
    })
    .join(' ');
}
