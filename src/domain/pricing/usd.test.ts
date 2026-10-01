import { describe, expect, it } from 'vitest';
import { COP_PER_USD, allocateUsdCents, toUsdCents } from './usd';

describe('COP_PER_USD', () => {
  it('is the fixed rate of 3400 COP per USD', () => {
    expect(COP_PER_USD).toBe(3400);
  });
});

describe('toUsdCents', () => {
  it.each([
    [0, 0],
    [16, 0],
    [17, 1],
    [33, 1],
    [34, 1],
    [50, 1],
    [51, 2],
    [3000, 88],
    [34000, 1000],
  ])('converts %i COP to %i cents (half up)', (cop, cents) => {
    expect(toUsdCents(cop)).toBe(cents);
  });

  it('is half-up rounding of cop * 100 / 3400 for every value up to 20000', () => {
    for (let cop = 0; cop <= 20000; cop += 1) {
      // The cent count c is right when cop * 100 lies in [c * 3400 - 1700, c * 3400 + 1700).
      const offset = cop * 100 - toUsdCents(cop) * COP_PER_USD;
      expect(offset).toBeGreaterThanOrEqual(-1700);
      expect(offset).toBeLessThan(1700);
    }
  });
});

describe('allocateUsdCents', () => {
  it('returns an empty list for no lines', () => {
    expect(allocateUsdCents([])).toEqual([]);
  });

  it('gives each line its exact share when the total divides evenly', () => {
    expect(allocateUsdCents([34000])).toEqual([1000]);
    expect(allocateUsdCents([34, 68])).toEqual([1, 2]);
  });

  it('allocates three lines of 1000 COP to 0.88 USD in total', () => {
    const lines = allocateUsdCents([1000, 1000, 1000]);
    expect(lines.reduce((a, b) => a + b, 0)).toBe(88);
    // floors are 29 each (87); one missing cent goes to the first tied line.
    expect(lines).toEqual([30, 29, 29]);
  });

  it('breaks remainder ties by line order', () => {
    // 17 COP each: floors 0, total 1 cent, remainders tie so the first line wins.
    expect(allocateUsdCents([17, 17])).toEqual([1, 0]);
    expect(allocateUsdCents([17, 17, 17, 17])).toEqual([1, 1, 0, 0]);
  });

  it('gives the missing cents to the largest remainders first', () => {
    // 1000 % 34 = 14, 1020 % 34 = 0, 33 % 34 = 33; total 2053 COP -> 60 cents.
    // floors 29 + 30 + 0 = 59, one missing cent goes to the remainder 33.
    expect(allocateUsdCents([1000, 1020, 33])).toEqual([29, 30, 1]);
  });

  it('keeps zero-COP lines at zero', () => {
    expect(allocateUsdCents([0, 17, 0])).toEqual([0, 1, 0]);
  });

  it('always sums exactly to the converted total and never strays one cent from a line share', () => {
    let seed = 12345;
    const next = (): number => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed;
    };
    for (let run = 0; run < 2000; run += 1) {
      const count = 1 + (next() % 12);
      const lines = Array.from({ length: count }, () => (next() % 40) * 500 + (next() % 3) * 17);
      const total = lines.reduce((a, b) => a + b, 0);
      const cents = allocateUsdCents(lines);
      expect(cents).toHaveLength(count);
      expect(cents.reduce((a, b) => a + b, 0)).toBe(toUsdCents(total));
      cents.forEach((value, i) => {
        const floor = Math.floor((lines[i] ?? 0) / 34);
        expect(value === floor || value === floor + 1).toBe(true);
      });
    }
  });
});
