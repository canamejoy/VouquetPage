import { fireEvent, render } from '@testing-library/react';
import type { BouquetElement } from '@/domain/bouquet';
import { SelectionOverlay } from './SelectionOverlay';

const element: BouquetElement = {
  id: 'a',
  kind: 'flower',
  catalogId: 'rose',
  colorId: 'red',
  position: { x: 50, y: -400 },
  rotation: 20,
  scale: 2,
};
const size = { width: 100, height: 80 };

function renderOverlay(modelPerPixel: number, onHandlePointerDown = vi.fn()) {
  const { container } = render(
    <svg>
      <SelectionOverlay
        element={element}
        size={size}
        modelPerPixel={modelPerPixel}
        onHandlePointerDown={onHandlePointerDown}
      />
    </svg>,
  );
  return { container, onHandlePointerDown };
}

const num = (node: Element | null | undefined, name: string) => Number(node?.getAttribute(name));

describe('SelectionOverlay', () => {
  it('frames the element at size times scale, rotated about the anchor', () => {
    const { container } = renderOverlay(1);
    expect(container.querySelector('[data-layer="overlay"]')).toHaveAttribute(
      'transform',
      'translate(50 -400) rotate(20)',
    );
    const frame = container.querySelector('[data-part="frame"]');
    expect([num(frame, 'x'), num(frame, 'y'), num(frame, 'width'), num(frame, 'height')]).toEqual([
      -100, -80, 200, 160,
    ]);
  });

  it.each([1, 2.5])(
    'sizes handles at 12 px and hit areas at 44 px for %s model units per pixel',
    (mpp) => {
      const { container } = renderOverlay(mpp);
      const handles = container.querySelectorAll('[data-handle]');
      expect(handles).toHaveLength(5);
      for (const handle of handles) {
        const [mark, hit] = Array.from(handle.children);
        expect(num(mark, 'width')).toBeCloseTo(12 * mpp);
        expect(num(hit, 'width')).toBeCloseTo(44 * mpp);
        expect(num(hit, 'height')).toBeCloseTo(44 * mpp);
      }
    },
  );

  it('puts four scale handles on the corners and the rotate handle above the top edge', () => {
    const { container } = renderOverlay(1);
    const at = (handle: Element) =>
      handle.getAttribute('transform')?.replace('translate(', '').replace(')', '');
    const scale = Array.from(container.querySelectorAll('[data-handle="scale"]'), at);
    expect(scale.sort()).toEqual(['-100 -80', '-100 80', '100 -80', '100 80']);
    const rotate = at(container.querySelector('[data-handle="rotate"]') as Element)?.split(' ');
    expect(Number(rotate?.[0])).toBe(0);
    expect(Number(rotate?.[1])).toBeLessThan(-80);
  });

  it('lets the frame pass pointer events through and reports handle presses by kind', () => {
    const { container, onHandlePointerDown } = renderOverlay(1);
    expect(container.querySelector('[data-part="frame"]')).toHaveStyle({ pointerEvents: 'none' });
    fireEvent.pointerDown(container.querySelector('[data-handle="rotate"]') as Element);
    fireEvent.pointerDown(container.querySelector('[data-handle="scale"]') as Element);
    expect(onHandlePointerDown.mock.calls.map(([kind]) => kind)).toEqual(['rotate', 'scale']);
  });
});
