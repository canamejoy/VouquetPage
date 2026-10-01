import { useRef, useState } from 'react';
import { selectHasContent } from '@/application/editor/selectors';
import { createDraftStore } from '@/infrastructure/local-storage/draftStore';
import { createPreferencesStore } from '@/infrastructure/local-storage/preferencesStore';
import { EditorCanvasContainer } from '@/ui/containers/EditorCanvasContainer';
import { PaletteContainer } from '@/ui/containers/PaletteContainer';
import { PreferenceSwitches } from '@/ui/containers/PreferenceSwitches';
import { PreferencesProvider } from '@/ui/containers/PreferencesProvider';
import { SelectionToolbarContainer } from '@/ui/containers/SelectionToolbarContainer';
import { SummaryContainer } from '@/ui/containers/SummaryContainer';
import { usePaletteDrag } from '@/ui/containers/usePaletteDrag';
import { useT } from '@/ui/i18n/useT';
import { DragGhost } from '@/ui/molecules/DragGhost';
import { Header } from '@/ui/organisms/Header/Header';
import { useDraftEditor } from './useDraftEditor';

interface AppProps {
  /** The browser storage, or null when it is unavailable; only this layer builds the adapters. */
  storage: Storage | null;
}

/** The composition root: creates the stores, mounts the providers and composes the containers. */
export function App({ storage }: AppProps) {
  const [preferencesStore] = useState(() => createPreferencesStore(storage));
  return (
    <PreferencesProvider store={preferencesStore}>
      <Editor storage={storage} />
    </PreferencesProvider>
  );
}

function Editor({ storage }: AppProps) {
  const t = useT();
  const [draftStore] = useState(() => createDraftStore(storage));
  const [state, dispatch] = useDraftEditor(draftStore);
  const [gesturing, setGesturing] = useState(false);
  // One SVG ref is shared so a palette drag can map the pointer onto the canvas.
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = usePaletteDrag(state, dispatch, svgRef);

  return (
    <>
      <Header
        canDiscard={selectHasContent(state)}
        onNewBouquet={() => dispatch({ type: 'bouquet/clear' })}
      >
        <PreferenceSwitches />
      </Header>
      <section aria-label={t('palette.label')}>
        <PaletteContainer state={state} dispatch={dispatch} drag={drag} />
      </section>
      <main aria-label={t('canvas.label')}>
        <EditorCanvasContainer
          state={state}
          dispatch={dispatch}
          svgRef={svgRef}
          onGesturingChange={setGesturing}
        />
        <SelectionToolbarContainer state={state} dispatch={dispatch} gesturing={gesturing} />
      </main>
      <aside aria-label={t('summary.title')}>
        <SummaryContainer state={state} />
      </aside>
      {drag.ghost && <DragGhost {...drag.ghost} />}
    </>
  );
}
