import { stemPath } from './stems';

describe('stemPath', () => {
  it.each([
    [{ x: 0, y: -500 }, 'M 0 -500 Q 0 -250 0 0'],
    [{ x: -200, y: -300 }, 'M -200 -300 Q -140 -150 0 0'],
    [{ x: 100, y: 0 }, 'M 100 0 Q 70 0 0 0'],
  ])('runs from the anchor %j to the binding point at the origin', (anchor, expected) => {
    expect(stemPath(anchor)).toBe(expected);
  });
});
