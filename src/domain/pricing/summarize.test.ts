import { describe, expect, it } from 'vitest';
import { addElement, emptyBouquet, recolorElement, setWrapping } from '../bouquet';
import type { Bouquet } from '../bouquet';
import type { Catalog, FlowerId, FoliageId } from '../catalog';
import { CATALOG } from '../catalog';
import { summarize } from './summarize';

const at = { x: 0, y: -100 };

const withStems = (ids: readonly (FlowerId | FoliageId)[]): Bouquet =>
  ids.reduce((bouquet, id) => addElement(bouquet, id, at), emptyBouquet());

describe('summarize', () => {
  it('returns no groups and a zero total for an empty bouquet', () => {
    expect(summarize(emptyBouquet())).toEqual({ groups: [], totalCop: 0, totalUsdCents: 0 });
  });

  it('groups flowers, foliage and wrapping with quantity and line amounts', () => {
    const bouquet = setWrapping(withStems(['rose', 'rose', 'fern']), 'kraft');
    expect(summarize(bouquet)).toEqual({
      groups: [
        {
          kind: 'flowers',
          lines: [
            {
              catalogId: 'rose',
              colorId: 'red',
              quantity: 2,
              unitCop: 6000,
              lineCop: 12000,
              lineUsdCents: 353,
            },
          ],
        },
        {
          kind: 'foliage',
          lines: [
            {
              catalogId: 'fern',
              colorId: null,
              quantity: 1,
              unitCop: 2000,
              lineCop: 2000,
              lineUsdCents: 59,
            },
          ],
        },
        {
          kind: 'wrapping',
          lines: [
            {
              catalogId: 'kraft',
              colorId: null,
              quantity: 1,
              unitCop: 4000,
              lineCop: 4000,
              lineUsdCents: 117,
            },
          ],
        },
      ],
      totalCop: 18000,
      totalUsdCents: 529,
    });
  });

  it('omits empty groups', () => {
    expect(summarize(withStems(['tulip'])).groups.map((g) => g.kind)).toEqual(['flowers']);
    expect(summarize(withStems(['fern'])).groups.map((g) => g.kind)).toEqual(['foliage']);
    expect(summarize(setWrapping(emptyBouquet(), 'burlap')).groups.map((g) => g.kind)).toEqual([
      'wrapping',
    ]);
  });

  it('prices a wrapping-only bouquet', () => {
    const summary = summarize(setWrapping(emptyBouquet(), 'blush'));
    expect(summary.totalCop).toBe(7000);
    expect(summary.totalUsdCents).toBe(206);
  });

  it('orders lines by catalog order, not by the order the stems were added', () => {
    const summary = summarize(withStems(['lavender', 'tulip', 'rose', 'olive', 'eucalyptus']));
    const [flowers, foliage] = summary.groups;
    expect(flowers?.lines.map((l) => l.catalogId)).toEqual(['rose', 'tulip', 'lavender']);
    expect(foliage?.lines.map((l) => l.catalogId)).toEqual(['eucalyptus', 'olive']);
  });

  it('keeps one line per colour and orders colours by the flower colour list', () => {
    let bouquet = withStems(['rose', 'rose', 'rose']);
    bouquet = recolorElement(bouquet, 'e1', 'white');
    bouquet = recolorElement(bouquet, 'e2', 'blush');
    const lines = summarize(bouquet).groups[0]?.lines;
    expect(lines?.map((l) => [l.colorId, l.quantity])).toEqual([
      ['red', 1],
      ['blush', 1],
      ['white', 1],
    ]);
    expect(lines?.every((l) => l.unitCop === 6000 && l.lineCop === 6000)).toBe(true);
  });

  it('shows fixed-colour flowers with a null colour', () => {
    const line = summarize(withStems(['sunflower', 'sunflower'])).groups[0]?.lines[0];
    expect(line).toMatchObject({
      catalogId: 'sunflower',
      colorId: null,
      quantity: 2,
      lineCop: 14000,
    });
  });

  it('exposes exactly one total equal to the sum of the lines in both currencies', () => {
    const bouquet = setWrapping(
      withStems(['rose', 'peony', 'carnation', 'carnation', 'lavender', 'fern', 'olive', 'olive']),
      'ivory',
    );
    const summary = summarize(bouquet);
    const lines = summary.groups.flatMap((g) => g.lines);
    expect(summary.totalCop).toBe(lines.reduce((sum, l) => sum + l.lineCop, 0));
    expect(summary.totalUsdCents).toBe(lines.reduce((sum, l) => sum + l.lineUsdCents, 0));
    expect(summary.totalCop).toBe(6000 + 12000 + 6000 + 3500 + 2000 + 7000 + 5000);
  });

  it('converts three lines of 1000 COP to 0.88 USD with lines summing exactly', () => {
    const catalog: Catalog = {
      flowers: [],
      foliage: [
        { kind: 'foliage', id: 'fern', priceCop: 1000, size: { width: 1, height: 1 } },
        { kind: 'foliage', id: 'olive', priceCop: 1000, size: { width: 1, height: 1 } },
        { kind: 'foliage', id: 'ruscus', priceCop: 1000, size: { width: 1, height: 1 } },
      ],
      wrappings: [],
    };
    const bouquet = withStems(['fern', 'olive', 'ruscus']);
    const summary = summarize(bouquet, catalog);
    expect(summary.totalCop).toBe(3000);
    expect(summary.totalUsdCents).toBe(88);
    expect(summary.groups[0]?.lines.map((l) => l.lineUsdCents)).toEqual([30, 29, 29]);
  });

  it('reports 34000 COP as exactly 1000 cents', () => {
    const catalog: Catalog = {
      flowers: [],
      foliage: [{ kind: 'foliage', id: 'fern', priceCop: 34000, size: { width: 1, height: 1 } }],
      wrappings: [],
    };
    const summary = summarize(withStems(['fern']), catalog);
    expect(summary.totalCop).toBe(34000);
    expect(summary.totalUsdCents).toBe(1000);
  });

  it('skips ids the catalog does not know', () => {
    const empty: Catalog = { flowers: [], foliage: [], wrappings: [] };
    expect(summarize(setWrapping(withStems(['rose', 'fern']), 'kraft'), empty)).toEqual({
      groups: [],
      totalCop: 0,
      totalUsdCents: 0,
    });
  });

  it('is derived from the bouquet only and does not mutate it', () => {
    const bouquet = withStems(['rose', 'fern']);
    const snapshot = JSON.stringify(bouquet);
    expect(summarize(bouquet, CATALOG)).toEqual(summarize(bouquet));
    expect(JSON.stringify(bouquet)).toBe(snapshot);
  });
});
