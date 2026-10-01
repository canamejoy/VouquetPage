describe('jsdom pointer support probe', () => {
  it('constructs a PointerEvent that carries pointerId and coordinates', () => {
    const event = new PointerEvent('pointerdown', {
      pointerId: 7,
      clientX: 12,
      clientY: 34,
      bubbles: true,
    });
    expect(event.pointerId).toBe(7);
    expect(event.clientX).toBe(12);
    expect(event.clientY).toBe(34);
  });

  it('delivers a dispatched PointerEvent to a listener', () => {
    const element = document.createElement('div');
    const received: number[] = [];
    element.addEventListener('pointermove', (e) => {
      received.push((e as PointerEvent).pointerId);
    });
    element.dispatchEvent(new PointerEvent('pointermove', { pointerId: 3 }));
    expect(received).toEqual([3]);
  });

  it('supports setPointerCapture and hasPointerCapture on elements', () => {
    const element = document.createElement('div');
    expect(typeof element.setPointerCapture).toBe('function');
    element.setPointerCapture(1);
    expect(element.hasPointerCapture(1)).toBe(true);
    element.releasePointerCapture(1);
    expect(element.hasPointerCapture(1)).toBe(false);
  });
});
