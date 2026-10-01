import { describe, expect, it } from 'vitest';
import { blobs, fringedRing, petalRing, ruffle, scallop, serrated } from './paths';

const subpaths = (d: string) => d.split('Z').filter((s) => s.trim() !== '');
const points = (d: string) => (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);

describe('path builders', () => {
  it('emit one closed subpath per petal, lobe or blob', () => {
    expect(subpaths(petalRing(6, 2, 40, 10))).toHaveLength(6);
    expect(subpaths(petalRing(3, 2, 40, 10, 0, true))).toHaveLength(3);
    expect(
      subpaths(
        blobs(
          [
            [0, 0],
            [10, 20],
            [-5, 8],
          ],
          4,
          6,
        ),
      ),
    ).toHaveLength(3);
    expect(subpaths(scallop(5, 30, 6))).toHaveLength(1);
    expect(subpaths(serrated(12, 30, 4))).toHaveLength(1);
  });

  it('start the first petal pointing up and follow the angle clockwise', () => {
    // Tip of the first petal is the third point of the first curve: straight up at radius 40.
    expect(petalRing(4, 0, 40, 10, 0, true).startsWith('M0 0 Q')).toBe(true);
    expect(points(petalRing(4, 0, 40, 10, 0, true)).slice(4, 6)).toEqual([0, -40]);
    // A 90 degree offset turns the same petal to the right.
    expect(points(petalRing(4, 0, 40, 10, 90, true)).slice(4, 6)).toEqual([40, 0]);
  });

  it('keep every point within the outer radius and use absolute commands only', () => {
    const rings = [
      petalRing(16, 10, 79, 8.5),
      petalRing(3, 4, 88, 40, 60, true),
      serrated(16, 62, 7),
    ];
    for (const d of rings) {
      expect(d).not.toMatch(/[a-z]/);
      const p = points(d);
      for (let i = 0; i < p.length; i += 2) {
        expect(Math.hypot(p[i] ?? 0, p[i + 1] ?? 0)).toBeLessThanOrEqual(88.1);
      }
    }
  });

  it('serrated alternates tooth tips and shallower valleys', () => {
    const p = points(serrated(4, 50, 10));
    const radii = [];
    for (let i = 0; i < p.length; i += 2)
      radii.push(Math.round(Math.hypot(p[i] ?? 0, p[i + 1] ?? 0)));
    expect(radii).toEqual([50, 40, 50, 40, 50, 40, 50, 40, 50]);
  });

  it('scallop lobes bulge beyond the base radius', () => {
    const p = points(scallop(4, 30, 10));
    expect(Math.hypot(p[2] ?? 0, p[3] ?? 0)).toBeCloseTo(40, 0);
  });
});

describe('irregular builders', () => {
  const maxRadius = (d: string) => {
    const p = points(d);
    let max = 0;
    for (let i = 0; i < p.length; i += 2) max = Math.max(max, Math.hypot(p[i] ?? 0, p[i + 1] ?? 0));
    return max;
  };

  it('ruffle is one closed outline with uneven lobes inside its bound', () => {
    const d = ruffle(8, 40, 10);
    expect(subpaths(d)).toHaveLength(1);
    expect(d).not.toMatch(/[a-z]/);
    expect(maxRadius(d)).toBeLessThanOrEqual(40 + 10 * 1.5 + 0.1);
    const p = points(d);
    const controls = new Set<number>();
    for (let i = 2; i < p.length - 2; i += 4)
      controls.add(Math.round(Math.hypot(p[i] ?? 0, p[i + 1] ?? 0)));
    expect(controls.size).toBeGreaterThan(2); // a regular scallop has one control radius
    expect(ruffle(8, 40, 10)).toBe(d);
  });

  it('fringedRing draws one fringed petal per count with varied tooth depth', () => {
    const d = fringedRing(6, 4, 60, 28, 0, 4);
    expect(subpaths(d)).toHaveLength(6);
    expect(d).not.toMatch(/[a-z]/);
    expect(maxRadius(d)).toBeLessThanOrEqual(60.1);
    const first = (subpaths(d)[0] ?? '').split('L').slice(1, -1);
    const radii = new Set(
      first.map((s) => Math.round(Math.hypot(...(points(s) as [number, number])))),
    );
    expect(radii.size).toBeGreaterThan(3);
  });
});
