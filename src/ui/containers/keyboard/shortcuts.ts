import type { EditorAction } from '@/application/editor/actions';
import type { BouquetElement } from '@/domain/bouquet';
import { NUDGE_STEP, NUDGE_STEP_LARGE, ROTATE_STEP_DEGREES, stepScale } from '@/domain/geometry';

/** The parts of a keyboard event the shortcut map reads. */
export interface KeyDescription {
  key: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}

const ARROWS = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
} as const;

/**
 * Maps a key press to the action it triggers on the selected element, or null when the press is
 * not ours (no selection, unmapped key, or a browser shortcut such as Ctrl+R or Cmd+minus).
 * Shifted symbols are matched by their produced character too, since `Shift+[` reports `{`.
 */
export function shortcutFor(
  event: KeyDescription,
  element: BouquetElement | null,
): EditorAction | null {
  if (!element) return null;
  const { id, position } = element;
  const { key, shiftKey } = event;
  const duplicate = (event.ctrlKey || event.metaKey) && key.toLowerCase() === 'd';
  if (duplicate) return { type: 'element/duplicate', id };
  if (event.ctrlKey || event.metaKey || event.altKey) return null;

  const arrow = key in ARROWS ? ARROWS[key as keyof typeof ARROWS] : null;
  if (arrow) {
    const step = shiftKey ? NUDGE_STEP_LARGE : NUDGE_STEP;
    const moved = { x: position.x + arrow.x * step, y: position.y + arrow.y * step };
    return { type: 'element/transform', id, change: { position: moved } };
  }
  switch (key) {
    case 'r':
    case 'R':
      return {
        type: 'element/transform',
        id,
        change: { rotation: element.rotation + (shiftKey ? -1 : 1) * ROTATE_STEP_DEGREES },
      };
    case '+':
    case '=':
      return { type: 'element/transform', id, change: { scale: stepScale(element.scale, 1) } };
    case '-':
    case '_':
      return { type: 'element/transform', id, change: { scale: stepScale(element.scale, -1) } };
    case '[':
      return { type: 'element/reorder', id, direction: shiftKey ? 'back' : 'backward' };
    case '{':
      return { type: 'element/reorder', id, direction: 'back' };
    case ']':
      return { type: 'element/reorder', id, direction: shiftKey ? 'front' : 'forward' };
    case '}':
      return { type: 'element/reorder', id, direction: 'front' };
    case 'Delete':
    case 'Backspace':
      return { type: 'element/delete', id };
    case 'Escape':
      return { type: 'element/select', id: null };
    default:
      return null;
  }
}
