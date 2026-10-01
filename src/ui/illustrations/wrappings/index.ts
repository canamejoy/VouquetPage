import type { ComponentType } from 'react';
import type { WrappingId } from '@/domain/catalog';
import { BlushBack, BlushFront } from './Blush';
import { BurlapBack, BurlapFront } from './Burlap';
import { CharcoalBack, CharcoalFront } from './Charcoal';
import { IvoryBack, IvoryFront } from './Ivory';
import { KraftBack, KraftFront } from './Kraft';

/** Two layers so the canvas can draw the stems between them. */
export interface WrappingIllustration {
  Back: ComponentType;
  Front: ComponentType;
}

/** One pair per wrapping; a missing catalog wrapping is a compile error. */
export const wrappingIllustrations: Record<WrappingId, WrappingIllustration> = {
  kraft: { Back: KraftBack, Front: KraftFront },
  ivory: { Back: IvoryBack, Front: IvoryFront },
  blush: { Back: BlushBack, Front: BlushFront },
  charcoal: { Back: CharcoalBack, Front: CharcoalFront },
  burlap: { Back: BurlapBack, Front: BurlapFront },
};
