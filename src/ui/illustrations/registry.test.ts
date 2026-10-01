import { describe, expect, it } from 'vitest';
import { CATALOG } from '@/domain/catalog';
import { illustrationRegistry } from './registry';

describe('illustrationRegistry', () => {
  it('resolves every catalog id', () => {
    const ids = [...CATALOG.flowers, ...CATALOG.foliage, ...CATALOG.wrappings].map((i) => i.id);
    expect(ids).toHaveLength(18);
    for (const id of ids) expect(illustrationRegistry[id]).toBeDefined();
    expect(Object.keys(illustrationRegistry).sort()).toEqual([...ids].sort());
  });

  it('gives wrappings a back and front part and the others one component', () => {
    expect(illustrationRegistry.kraft).toEqual({
      Back: expect.any(Function),
      Front: expect.any(Function),
    });
    expect(illustrationRegistry.rose).toEqual(expect.any(Function));
    expect(illustrationRegistry.fern).toEqual(expect.any(Function));
  });
});
