import tokensCss from './tokens.css?raw';

function tokens(): Record<string, string> {
  const root = /:root\s*{([^}]*)}/.exec(tokensCss)?.[1] ?? '';
  return Object.fromEntries(
    [...root.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [
      name,
      value!.trim(),
    ]),
  );
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const [a, b] = [luminance(foreground), luminance(background)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe('design tokens', () => {
  const t = tokens();

  it.each([
    // [foreground, background, minimum ratio]: 4.5 for text, 3 for UI boundaries and focus.
    ['--color-ink', '--color-paper', 4.5],
    ['--color-ink', '--color-surface', 4.5],
    ['--color-muted', '--color-paper', 4.5],
    ['--color-muted', '--color-surface', 4.5],
    ['--color-accent', '--color-paper', 4.5],
    ['--color-surface', '--color-accent', 4.5],
    ['--color-danger', '--color-paper', 4.5],
    ['--color-danger', '--color-surface', 4.5],
    ['--color-surface', '--color-danger', 4.5],
    ['--color-border-control', '--color-paper', 3],
    ['--color-border-control', '--color-surface', 3],
    ['--color-focus-ring', '--color-paper', 3],
    ['--color-focus-ring', '--color-surface', 3],
  ] as const)('%s on %s meets %s:1', (foreground, background, minimum) => {
    expect(contrast(t[foreground]!, t[background]!)).toBeGreaterThanOrEqual(minimum);
  });

  it('keeps the hairline decorative only: it is below the 3:1 control boundary ratio', () => {
    expect(contrast(t['--color-hairline']!, t['--color-surface']!)).toBeLessThan(3);
  });

  it('defines the 44 px touch target and the font stacks without web fonts', () => {
    expect(t['--size-target']).toBe('44px');
    expect(t['--font-serif']).toMatch(/Georgia/);
    expect(t['--font-sans']).toMatch(/system-ui/);
    expect(tokensCss).not.toMatch(/@font-face|@import|url\(/);
  });
});
