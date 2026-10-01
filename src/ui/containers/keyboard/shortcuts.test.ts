import { describe, expect, it } from 'vitest';
import type { BouquetElement } from '@/domain/bouquet';
import { shortcutFor, type KeyDescription } from './shortcuts';

const element: BouquetElement = {
  id: 'a',
  kind: 'foliage',
  catalogId: 'fern',
  position: { x: 100, y: -500 },
  rotation: 350,
  scale: 1.2,
};

const press = (key: string, modifiers: Partial<KeyDescription> = {}): KeyDescription => ({
  key,
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  ...modifiers,
});
const transform = (change: object) => ({ type: 'element/transform', id: 'a', change });
const reorder = (direction: string) => ({ type: 'element/reorder', id: 'a', direction });

describe('shortcutFor', () => {
  it.each([
    ['ArrowLeft', {}, transform({ position: { x: 90, y: -500 } })],
    ['ArrowRight', {}, transform({ position: { x: 110, y: -500 } })],
    ['ArrowUp', {}, transform({ position: { x: 100, y: -510 } })],
    ['ArrowDown', {}, transform({ position: { x: 100, y: -490 } })],
    ['ArrowLeft', { shiftKey: true }, transform({ position: { x: 50, y: -500 } })],
    ['ArrowDown', { shiftKey: true }, transform({ position: { x: 100, y: -450 } })],
    ['r', {}, transform({ rotation: 365 })],
    ['R', { shiftKey: true }, transform({ rotation: 335 })],
    ['+', { shiftKey: true }, transform({ scale: 1.3 })],
    ['=', {}, transform({ scale: 1.3 })],
    ['-', {}, transform({ scale: 1.1 })],
    ['[', {}, reorder('backward')],
    [']', {}, reorder('forward')],
    ['[', { shiftKey: true }, reorder('back')],
    ['{', { shiftKey: true }, reorder('back')],
    [']', { shiftKey: true }, reorder('front')],
    ['}', { shiftKey: true }, reorder('front')],
    ['Delete', {}, { type: 'element/delete', id: 'a' }],
    ['Backspace', {}, { type: 'element/delete', id: 'a' }],
    ['d', { ctrlKey: true }, { type: 'element/duplicate', id: 'a' }],
    ['D', { metaKey: true }, { type: 'element/duplicate', id: 'a' }],
    ['Escape', {}, { type: 'element/select', id: null }],
  ])('%s %o maps to its action', (key, modifiers, expected) => {
    expect(shortcutFor(press(key, modifiers), element)).toEqual(expected);
  });

  it.each([
    ['without a selection', press('Delete'), null],
    ['an unmapped key', press('x'), element],
    ['Ctrl+R (browser reload)', press('r', { ctrlKey: true }), element],
    ['Cmd+minus (browser zoom)', press('-', { metaKey: true }), element],
    ['Alt+ArrowLeft (browser back)', press('ArrowLeft', { altKey: true }), element],
    ['plain d without a modifier', press('d'), element],
  ])('ignores %s', (_name, event, selected) => {
    expect(shortcutFor(event, selected)).toBeNull();
  });
});
