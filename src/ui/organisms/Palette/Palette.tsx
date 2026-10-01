import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { COLOR_HEX } from '@/domain/catalog';
import type {
  Catalog,
  FlowerId,
  FlowerItem,
  FoliageId,
  FoliageItem,
  WrappingId,
} from '@/domain/catalog';
import { useT } from '@/ui/i18n/useT';
import { flowerIllustrations } from '@/ui/illustrations/flowers';
import { foliageIllustrations } from '@/ui/illustrations/foliage';
import { wrappingIllustrations } from '@/ui/illustrations/wrappings';
import { CompositionPicker } from './CompositionPicker';
import styles from './Palette.module.css';
import { PaletteTile } from './PaletteTile';

const TABS = ['compositions', 'flowers', 'foliage', 'wrapping'] as const;
type TabId = (typeof TABS)[number];

/** The wrapping art is drawn in canvas coordinates, so its thumbnail frames the whole sheet. */
const WRAPPING_VIEW_BOX = '-340 -565 680 840';

interface PaletteProps {
  catalog: Catalog;
  /** Template ids in display order; names and descriptions come from the dictionary. */
  compositionIds: readonly string[];
  wrappingId: WrappingId | null;
  /** True when the bouquet has flowers or foliage; a wrapping alone does not count. */
  hasArrangement: boolean;
  canAdd: boolean;
  onAdd: (catalogId: FlowerId | FoliageId) => void;
  onSelectWrapping: (wrappingId: WrappingId | null) => void;
  onApplyComposition: (compositionId: string) => void;
}

export function Palette({
  catalog,
  compositionIds,
  wrappingId,
  hasArrangement,
  canAdd,
  onAdd,
  onSelectWrapping,
  onApplyComposition,
}: PaletteProps) {
  const t = useT();
  const baseId = useId();
  // Only the opening tab depends on the bouquet; afterwards the user is in charge.
  const [active, setActive] = useState<TabId>(hasArrangement ? 'flowers' : 'compositions');
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});

  const onTabKeyDown = (event: KeyboardEvent, index: number) => {
    const target = {
      ArrowRight: (index + 1) % TABS.length,
      ArrowLeft: (index + TABS.length - 1) % TABS.length,
      Home: 0,
      End: TABS.length - 1,
    }[event.key];
    const next = target === undefined ? undefined : TABS[target];
    if (!next) return;
    event.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  const flowerTile = (item: FlowerItem) => {
    const [first] = item.colors;
    const Illustration = flowerIllustrations[item.id];
    return (
      <PaletteTile
        key={item.id}
        label={t(`catalog.${item.id}`)}
        thumbnail={
          <Thumbnail size={item.size} color={first ? COLOR_HEX[first] : undefined}>
            <Illustration />
          </Thumbnail>
        }
        swatches={item.colors.length > 0 ? item.colors.map((c) => COLOR_HEX[c]) : undefined}
        description={
          item.colors.length > 0
            ? t('palette.colors', { colors: item.colors.map((c) => t(`color.${c}`)).join(', ') })
            : undefined
        }
        disabled={!canAdd}
        onClick={() => onAdd(item.id)}
      />
    );
  };

  const foliageTile = (item: FoliageItem) => {
    const Illustration = foliageIllustrations[item.id];
    return (
      <PaletteTile
        key={item.id}
        label={t(`catalog.${item.id}`)}
        thumbnail={
          <Thumbnail size={item.size}>
            <Illustration />
          </Thumbnail>
        }
        disabled={!canAdd}
        onClick={() => onAdd(item.id)}
      />
    );
  };

  return (
    <div className={styles.palette}>
      <div role="tablist" aria-label={t('palette.label')} className={styles.tabs}>
        {TABS.map((tab, index) => (
          <button
            key={tab}
            ref={(node) => {
              tabRefs.current[tab] = node;
            }}
            id={`${baseId}-tab-${tab}`}
            type="button"
            role="tab"
            className={styles.tab}
            aria-selected={tab === active}
            aria-controls={`${baseId}-panel`}
            tabIndex={tab === active ? 0 : -1}
            onClick={() => setActive(tab)}
            onKeyDown={(event) => onTabKeyDown(event, index)}
          >
            {t(`palette.tab.${tab}`)}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${active}`}
        className={styles.panel}
      >
        {active === 'compositions' && (
          <CompositionPicker
            ids={compositionIds}
            hasArrangement={hasArrangement}
            onApply={onApplyComposition}
          />
        )}
        {active === 'flowers' && (
          <div className={styles.grid}>{catalog.flowers.map(flowerTile)}</div>
        )}
        {active === 'foliage' && (
          <div className={styles.grid}>{catalog.foliage.map(foliageTile)}</div>
        )}
        {active === 'wrapping' && (
          <div className={styles.grid}>
            <PaletteTile
              label={t('common.none')}
              pressed={wrappingId === null}
              onClick={() => onSelectWrapping(null)}
            />
            {catalog.wrappings.map((item) => {
              const { Back, Front } = wrappingIllustrations[item.id];
              return (
                <PaletteTile
                  key={item.id}
                  label={t(`catalog.${item.id}`)}
                  thumbnail={
                    <svg
                      className={styles.thumbnail}
                      viewBox={WRAPPING_VIEW_BOX}
                      aria-hidden="true"
                    >
                      <Back />
                      <Front />
                    </svg>
                  }
                  pressed={wrappingId === item.id}
                  onClick={() => onSelectWrapping(item.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface ThumbnailProps {
  size: { width: number; height: number };
  color?: string | undefined;
  children: ReactNode;
}

/** Flower and foliage art is centred on (0, 0) inside its catalog size. */
function Thumbnail({ size, color, children }: ThumbnailProps) {
  return (
    <svg
      className={styles.thumbnail}
      viewBox={`${-size.width / 2} ${-size.height / 2} ${size.width} ${size.height}`}
      style={color ? { color } : undefined}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
