/** Fixed conversion rate: 3400 COP buy 1 USD (design D6). */
export const COP_PER_USD = 3400;

/** COP per US cent (3400 / 100); the integer divisor behind every cent calculation. */
const COP_PER_CENT = COP_PER_USD / 100;

/**
 * USD total in integer cents: `totalCop * 100 / 3400` rounded half up, in integer arithmetic.
 * Rounding happens once, on the total.
 */
export function toUsdCents(totalCop: number): number {
  return Math.floor((totalCop + COP_PER_CENT / 2) / COP_PER_CENT);
}

/**
 * Splits `toUsdCents(sum of linesCop)` over the lines by largest remainder, so the lines always
 * add up to the converted total. Each line first gets `floor(lineCop / 34)` cents; the cents
 * still missing go one each to the lines with the largest `lineCop % 34`. Ties go to the earlier
 * line, so the caller's order (the summary order) decides.
 */
export function allocateUsdCents(linesCop: readonly number[]): number[] {
  const cents = linesCop.map((cop) => Math.floor(cop / COP_PER_CENT));
  const total = toUsdCents(linesCop.reduce((sum, cop) => sum + cop, 0));
  const missing = total - cents.reduce((sum, value) => sum + value, 0);
  const byRemainder = linesCop
    .map((cop, index) => ({ index, remainder: cop % COP_PER_CENT }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (const { index } of byRemainder.slice(0, missing)) {
    cents[index] = (cents[index] ?? 0) + 1;
  }
  return cents;
}
