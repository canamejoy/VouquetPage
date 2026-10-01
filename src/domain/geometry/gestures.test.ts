import { moveGesture, rotateGesture, scaleGesture, SCALE_MAX, SCALE_MIN } from './gestures';
import type { GestureStart } from './gestures';

const start: GestureStart = {
  pointer: { x: 100, y: -500 },
  position: { x: 0, y: -540 },
  rotation: 30,
  scale: 1,
};

describe('moveGesture', () => {
  it('moves the anchor by the pointer delta', () => {
    expect(moveGesture(start, { x: 160, y: -450 })).toEqual({ x: 60, y: -490 });
  });

  it('keeps the grab offset: no pointer movement leaves the anchor unchanged', () => {
    expect(moveGesture(start, start.pointer)).toEqual(start.position);
  });

  it('clamps the anchor to the model bounds on each axis', () => {
    expect(moveGesture(start, { x: 5000, y: -5000 })).toEqual({ x: 500, y: -1000 });
    expect(moveGesture(start, { x: -5000, y: 5000 })).toEqual({ x: -500, y: 300 });
  });
});

describe('rotateGesture', () => {
  // Anchor (0, -540). Angle 0 is up, clockwise, y down.
  const at = (x: number, y: number) => ({ x, y });

  it('adds the angle swept about the anchor to the starting rotation', () => {
    const quarter: GestureStart = { ...start, pointer: at(0, -640) }; // above the anchor
    expect(rotateGesture(quarter, at(100, -540))).toBeCloseTo(120, 10); // now to the right: +90
  });

  it('sweeps counter-clockwise as a negative delta', () => {
    const quarter: GestureStart = { ...start, pointer: at(0, -640) };
    expect(rotateGesture(quarter, at(-100, -540))).toBeCloseTo(300, 10); // 30 - 90 normalized
  });

  it('is independent of the distance from the anchor', () => {
    const quarter: GestureStart = { ...start, pointer: at(0, -640) };
    expect(rotateGesture(quarter, at(400, -540))).toBeCloseTo(120, 10);
  });

  it('returns the starting rotation when the pointer has not moved', () => {
    expect(rotateGesture(start, start.pointer)).toBeCloseTo(30, 10);
  });

  it('normalizes a full sweep past 360 degrees', () => {
    const top: GestureStart = { ...start, rotation: 350, pointer: at(0, -640) };
    expect(rotateGesture(top, at(100, -540))).toBeCloseTo(80, 10); // 350 + 90 = 440
  });
});

describe('scaleGesture', () => {
  const grab: GestureStart = { ...start, pointer: { x: 100, y: -540 } }; // 100 from the anchor

  it('multiplies the starting scale by the distance ratio about the anchor', () => {
    expect(scaleGesture(grab, { x: 150, y: -540 })).toBeCloseTo(1.5, 10);
    expect(scaleGesture({ ...grab, scale: 2 }, { x: 0, y: -590 })).toBeCloseTo(1, 10);
  });

  it('uses distance, not direction', () => {
    expect(scaleGesture(grab, { x: 0, y: -640 })).toBeCloseTo(1, 10);
  });

  it(`clamps to [${SCALE_MIN}, ${SCALE_MAX}]`, () => {
    expect(SCALE_MIN).toBe(0.4);
    expect(SCALE_MAX).toBe(2.5);
    expect(scaleGesture(grab, { x: 110, y: -540 })).toBeCloseTo(1.1, 10);
    expect(scaleGesture(grab, { x: 1000, y: -540 })).toBe(2.5);
    expect(scaleGesture(grab, { x: 20, y: -540 })).toBe(0.4);
  });

  it('keeps the starting scale when the grab point sits on the anchor', () => {
    const onAnchor: GestureStart = { ...start, pointer: start.position, scale: 1.3 };
    expect(scaleGesture(onAnchor, { x: 200, y: -540 })).toBe(1.3);
  });
});
