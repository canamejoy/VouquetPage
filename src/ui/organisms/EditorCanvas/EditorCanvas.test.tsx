import { fireEvent, render, screen, within } from '@testing-library/react';
import type { Bouquet } from '@/domain/bouquet';
import { CATALOG, COLOR_HEX } from '@/domain/catalog';
import { I18nContext } from '@/ui/i18n/I18nContext';
import { createTranslate, type Language } from '@/ui/i18n/translate';
import { EditorCanvas } from './EditorCanvas';

const bouquet: Bouquet = {
  schemaVersion: 1,
  wrappingId: 'kraft',
  elements: [
    {
      id: 'a',
      kind: 'flower',
      catalogId: 'rose',
      colorId: 'red',
      position: { x: -120, y: -400 },
      rotation: 30,
      scale: 1.5,
    },
    {
      id: 'b',
      kind: 'foliage',
      catalogId: 'fern',
      position: { x: 60, y: -300 },
      rotation: 0,
      scale: 1,
    },
    {
      id: 'c',
      kind: 'flower',
      catalogId: 'sunflower',
      colorId: null,
      position: { x: 0, y: -500 },
      rotation: 0,
      scale: 1,
    },
  ],
};

function renderCanvas(
  props: Partial<Parameters<typeof EditorCanvas>[0]> = {},
  language: Language = 'en',
) {
  return render(
    <I18nContext value={createTranslate(language)}>
      <EditorCanvas
        bouquet={bouquet}
        catalog={CATALOG}
        selectedId={null}
        modelPerPixel={1}
        {...props}
      />
    </I18nContext>,
  );
}

const layers = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('svg > [data-layer]'), (node) =>
    node.getAttribute('data-layer'),
  );

describe('EditorCanvas', () => {
  it('draws background, wrapping back, stems, wrapping front, elements and overlay in that order', () => {
    const { container } = renderCanvas({ selectedId: 'a' });
    expect(layers(container)).toEqual([
      'background',
      'wrapping-back',
      'stems',
      'wrapping-front',
      'elements',
      'overlay',
    ]);
  });

  it('omits the wrapping layers without a wrapping and the overlay without a selection', () => {
    const { container } = renderCanvas({
      bouquet: { ...bouquet, wrappingId: null },
      selectedId: 'missing',
    });
    expect(layers(container)).toEqual(['background', 'stems', 'elements']);
  });

  it('renders an empty bouquet without elements or stems', () => {
    const { container } = renderCanvas({ bouquet: { ...bouquet, elements: [], wrappingId: null } });
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(container.querySelectorAll('[data-layer="stems"] path')).toHaveLength(0);
  });

  it.each([
    ['en', 'Bouquet canvas'],
    ['es', 'Lienzo del ramo'],
  ] as const)('names the canvas in %s', (language, name) => {
    renderCanvas({}, language);
    expect(screen.getByRole('group', { name })).toBeInTheDocument();
  });

  it.each([
    ['en', ['Rose, Red, layer 1 of 3', 'Fern, layer 2 of 3', 'Sunflower, layer 3 of 3']],
    ['es', ['Rosa, Rojo, capa 1 de 3', 'Helecho, capa 2 de 3', 'Girasol, capa 3 de 3']],
  ] as const)('names elements by item, colour and layer in %s', (language, names) => {
    renderCanvas({}, language);
    expect(screen.getAllByRole('button').map((node) => node.getAttribute('aria-label'))).toEqual(
      names,
    );
  });

  it('keeps each element focusable and its illustration hidden from assistive technology', () => {
    renderCanvas();
    const [rose] = screen.getAllByRole('button');
    expect(rose).toHaveAttribute('tabindex', '0');
    expect(rose?.querySelector('g')).toHaveAttribute('aria-hidden', 'true');
  });

  it('places an element at its anchor with clockwise rotation and uniform scale', () => {
    renderCanvas();
    const [rose, fern] = screen.getAllByRole('button');
    expect(rose).toHaveAttribute('transform', 'translate(-120 -400) rotate(30) scale(1.5)');
    expect(fern).toHaveAttribute('transform', 'translate(60 -300) rotate(0) scale(1)');
  });

  it('colours recolourable flowers through CSS color and leaves fixed ones alone', () => {
    renderCanvas();
    const [rose, fern, sunflower] = screen.getAllByRole('button');
    expect(rose).toHaveStyle({ color: COLOR_HEX.red });
    expect(fern?.style.color).toBe('');
    expect(sunflower?.style.color).toBe('');
  });

  it('draws one stem per element and no stem without elements', () => {
    const { container } = renderCanvas();
    expect(container.querySelectorAll('[data-layer="stems"] path')).toHaveLength(3);
  });

  it('keeps the wrapping out of the focus order, the accessibility tree and hit testing', () => {
    const { container } = renderCanvas();
    for (const layer of ['wrapping-back', 'wrapping-front']) {
      const group = container.querySelector(`[data-layer="${layer}"]`);
      expect(group).toHaveStyle({ pointerEvents: 'none' });
      expect(group).toHaveAttribute('aria-hidden', 'true');
      expect(group?.querySelector('[tabindex], [role]')).toBeNull();
    }
  });

  it('keeps stems out of the accessibility tree', () => {
    const { container } = renderCanvas();
    expect(container.querySelector('[data-layer="stems"]')).toHaveAttribute('aria-hidden', 'true');
    expect(within(screen.getByRole('group')).getAllByRole('button')).toHaveLength(3);
  });

  it('reports presses on the background, an element and a handle to the container', () => {
    const onBackgroundPointerDown = vi.fn();
    const onElementPointerDown = vi.fn();
    const onHandlePointerDown = vi.fn();
    const { container } = renderCanvas({
      selectedId: 'b',
      onBackgroundPointerDown,
      onElementPointerDown,
      onHandlePointerDown,
    });
    fireEvent.pointerDown(container.querySelector('[data-layer="background"]') as Element);
    fireEvent.pointerDown(screen.getAllByRole('button')[1] as Element);
    fireEvent.pointerDown(container.querySelector('[data-handle="rotate"]') as Element);
    expect(onBackgroundPointerDown).toHaveBeenCalledTimes(1);
    expect(onElementPointerDown).toHaveBeenCalledWith('b', expect.anything());
    expect(onHandlePointerDown).toHaveBeenCalledWith('rotate', expect.anything());
  });
});
