import { formatMoney } from './formatMoney';

// The separator after the currency code is a non-breaking space (U+00A0) under Node 26 / ICU,
// matching the design's expectation; the strings below are the runtime's actual output.
const NBSP = ' ';

describe('formatMoney', () => {
  it.each([
    ['es', 'COP', 84000, `COP${NBSP}84.000`],
    ['en', 'COP', 84000, `COP${NBSP}84,000`],
    ['es', 'USD', 2471, `USD${NBSP}24,71`],
    ['en', 'USD', 2471, `USD${NBSP}24.71`],
    ['es', 'COP', 0, `COP${NBSP}0`],
    ['en', 'USD', 5, `USD${NBSP}0.05`],
    ['es', 'COP', 1234567, `COP${NBSP}1.234.567`],
  ] as const)('%s %s %d', (language, currency, amount, expected) => {
    expect(formatMoney(amount, currency, language)).toBe(expected);
  });
});
