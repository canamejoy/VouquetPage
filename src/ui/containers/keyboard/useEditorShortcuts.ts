import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import type { EditorAction } from '@/application/editor/actions';
import { editorReducer } from '@/application/editor/reducer';
import { selectSelectedElement } from '@/application/editor/selectors';
import type { EditorState } from '@/application/editor/state';
import { useT } from '@/ui/i18n/useT';
import type { Translate } from '@/ui/i18n/translate';
import { shortcutFor } from './shortcuts';

type FocusTarget = 'selected' | 'canvas';

/** Describes what a handled action did, from the state it produced; null when nothing is worth saying. */
function announce(action: EditorAction, before: EditorState, after: EditorState, t: Translate) {
  const index = after.bouquet.elements.findIndex(
    (element) => element.id === ('id' in action ? action.id : null),
  );
  const subject = before.bouquet.elements.find(
    (element) => element.id === ('id' in action ? action.id : null),
  );
  if (!subject) return null;
  const item = t(`catalog.${subject.catalogId}`);
  const current = after.bouquet.elements[index];
  switch (action.type) {
    case 'element/delete':
      return t('announce.deleted', { item });
    case 'element/duplicate':
      return t('announce.duplicated', { item });
    case 'element/reorder':
      return t('announce.layer', {
        item,
        position: index + 1,
        count: after.bouquet.elements.length,
      });
    case 'element/transform':
      if (!current) return null;
      if (action.change.position) {
        return t('announce.moved', { item, x: current.position.x, y: current.position.y });
      }
      if (action.change.rotation !== undefined) {
        return t('announce.rotated', { item, degrees: current.rotation });
      }
      return t('announce.resized', { item, percent: Math.round(current.scale * 100) });
    default:
      return null;
  }
}

/** The reducer returns a new bouquet even when a transform clamps back to the same values. */
function isNoOp(before: EditorState, after: EditorState): boolean {
  if (after === before) return true;
  return (
    after.selectedId === before.selectedId &&
    after.bouquet.elements.length === before.bouquet.elements.length &&
    after.bouquet.elements.every((element, index) => {
      const old = before.bouquet.elements[index];
      return (
        old?.id === element.id &&
        old.position.x === element.position.x &&
        old.position.y === element.position.y &&
        old.rotation === element.rotation &&
        old.scale === element.scale
      );
    })
  );
}

/**
 * Translates canvas key presses into editor actions (the map lives in `shortcuts.ts`), announces
 * their outcome and keeps keyboard focus on something sensible. Pass the result to the canvas;
 * render `message` in a live region. Outcomes are predicted with the same reducer the app uses,
 * so a clamped no-op (an element already at the bounds) is neither dispatched nor announced.
 */
export function useEditorShortcuts(
  state: EditorState,
  dispatch: Dispatch<EditorAction>,
  svgRef: RefObject<SVGSVGElement | null>,
) {
  const t = useT();
  const [message, setMessage] = useState('');
  const pendingFocus = useRef<FocusTarget | null>(null);

  // Focus can only move once the new element exists, so the request waits for the next render.
  useEffect(() => {
    const target = pendingFocus.current;
    const svg = svgRef.current;
    pendingFocus.current = null;
    if (!target || !svg) return;
    if (target === 'canvas') return svg.focus();
    const nodes = Array.from(svg.querySelectorAll<SVGElement>('[data-element-id]'));
    nodes.find((node) => node.dataset.elementId === state.selectedId)?.focus();
  });

  const onKeyDown = (event: KeyboardEvent<SVGElement>) => {
    const action = shortcutFor(event, selectSelectedElement(state));
    if (!action) return;
    event.preventDefault();
    const next = editorReducer(state, action);
    if (isNoOp(state, next)) return;
    dispatch(action);
    if (action.type === 'element/delete') pendingFocus.current = 'canvas';
    if (action.type === 'element/duplicate') pendingFocus.current = 'selected';
    const text = announce(action, state, next, t);
    if (text) setMessage(text);
  };

  const onElementFocus = (id: string) => dispatch({ type: 'element/select', id });

  return { message, onKeyDown, onElementFocus };
}
