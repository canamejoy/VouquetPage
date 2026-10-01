import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom implements PointerEvent but not pointer capture (verified by pointer-probe.test.ts).
// This minimal stub tracks captured pointer ids per element so gesture code can be tested.
const capturedPointers = new WeakMap<Element, Set<number>>();

function capturedFor(element: Element): Set<number> {
  let ids = capturedPointers.get(element);
  if (!ids) {
    ids = new Set();
    capturedPointers.set(element, ids);
  }
  return ids;
}

if (typeof Element.prototype.setPointerCapture !== 'function') {
  Element.prototype.setPointerCapture = function setPointerCapture(pointerId: number) {
    capturedFor(this).add(pointerId);
  };
  Element.prototype.releasePointerCapture = function releasePointerCapture(pointerId: number) {
    capturedFor(this).delete(pointerId);
  };
  Element.prototype.hasPointerCapture = function hasPointerCapture(pointerId: number) {
    return capturedFor(this).has(pointerId);
  };
}

afterEach(() => {
  cleanup();
});
