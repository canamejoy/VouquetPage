import type { ColorId, FlowerId, FoliageId, WrappingId } from '@/domain/catalog';
import type { ElementTransform, ReorderDirection } from '@/domain/bouquet';
import type { Point } from '@/domain/geometry';

export type EditorAction =
  | { type: 'element/add'; catalogId: FlowerId | FoliageId; position: Point }
  | { type: 'element/select'; id: string | null }
  | { type: 'element/transform'; id: string; change: ElementTransform }
  | { type: 'element/recolor'; id: string; colorId: ColorId }
  | { type: 'element/duplicate'; id: string }
  | { type: 'element/delete'; id: string }
  | { type: 'element/reorder'; id: string; direction: ReorderDirection }
  | { type: 'wrapping/set'; wrappingId: WrappingId | null }
  | { type: 'composition/apply'; compositionId: string }
  | { type: 'bouquet/clear' };
