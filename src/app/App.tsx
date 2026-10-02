import { useRef, useState } from 'react';
import { selectHasContent } from '@/application/editor/selectors';
import { createDraftStore } from '@/infrastructure/local-storage/draftStore';
import { createPreferencesStore } from '@/infrastructure/local-storage/preferencesStore';
import { AppShell } from '@/ui/containers/AppShell';
import { EditorCanvasContainer } from '@/ui/containers/EditorCanvasContainer';
import { PaletteContainer } from '@/ui/containers/PaletteContainer';
import { PreferenceSwitches } from '@/ui/containers/PreferenceSwitches';
import { PreferencesProvider } from '@/ui/containers/PreferencesProvider';
import { SelectionToolbarContainer } from '@/ui/containers/SelectionToolbarContainer';
import { usePaletteDrag } from '@/ui/containers/usePaletteDrag';
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
  const [draftStore] = useState(() => createDraftStore(storage));
  const [state, dispatch] = useDraftEditor(draftStore);
  const [gesturing, setGesturing] = useState(false);
  // One SVG ref is shared so a palette drag can map the pointer onto the canvas.
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = usePaletteDrag(state, dispatch, svgRef);

  return (
    <>
      <AppShell
        state={state}
        header={
          <Header
            canDiscard={selectHasContent(state)}
            onNewBouquet={() => dispatch({ type: 'bouquet/clear' })}
          >
            <PreferenceSwitches />
          </Header>
        }
        palette={<PaletteContainer state={state} dispatch={dispatch} drag={drag} />}
        canvas={
          <>
            <EditorCanvasContainer
              state={state}
              dispatch={dispatch}
              svgRef={svgRef}
              onGesturingChange={setGesturing}
            />
            <SelectionToolbarContainer state={state} dispatch={dispatch} gesturing={gesturing} />
          </>
        }
      />
      {drag.ghost && <DragGhost {...drag.ghost} />}
    </>
  );
}
