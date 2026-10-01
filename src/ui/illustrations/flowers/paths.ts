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

/** Deterministic pseudo-random value in [0, 1): the same input always draws the same flower. */
const jitter = (i: number) => (i * 0.618034) % 1;

/**
 * Like `scallop`, but with uneven lobes: each vertex sits a little inside `radius` and each
 * lobe bulges between 0.5 and 1.5 times `bulge`. Used for dense, ruffled petal masses.
 */
export function ruffle(count: number, radius: number, bulge: number, offset = 0): string {
  const step = 360 / count;
  const vertex = (i: number) =>
    polar(radius * (1 - 0.12 * jitter(i + 3)), offset + step * (i % count));
  const lobes = steps(count).map((i) => {
    const reach = radius + bulge * (0.5 + jitter(i * 2 + 1));
    return `Q${xy(polar(reach, offset + step * (i + 0.5)))} ${xy(vertex(i + 1))}`;
  });
  return `M${xy(vertex(0))} ${lobes.join(' ')} Z`;
}

/**
 * A ring of fan-shaped petals whose outer edge is a fringe of `teeth` + 1 teeth of uneven
 * depth, so the serration belongs to each petal rather than to a ring outline.
 */
export function fringedRing(
  count: number,
  inner: number,
  outer: number,
  halfWidth: number,
  offset = 0,
  teeth = 4,
): string {
  const depth = (outer - inner) * 0.18;
  return steps(count)
    .map((i) => {
      const a = offset + (360 * i) / count;
      const angleAt = (k: number) => a - halfWidth + (2 * halfWidth * k) / teeth;
      const edge = steps(teeth + 1).map((k) => {
        const tip = xy(polar(outer - depth * 0.5 * jitter(i * 7 + k), angleAt(k)));
        if (k === teeth) return `L${tip}`;
        const valley = xy(
          polar(
            outer - depth * (0.6 + 0.4 * jitter(i * 7 + k + 11)),
            (angleAt(k) + angleAt(k + 1)) / 2,
          ),
        );
        return `L${tip} L${valley}`;
      });
      const base = xy(polar(inner, a));
      return `M${base} ${edge.join(' ')} L${base} Z`;
    })
    .join(' ');
}
