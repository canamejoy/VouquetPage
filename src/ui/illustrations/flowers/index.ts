import type { ComponentType } from 'react';
import type { FlowerId } from '@/domain/catalog';
import { Carnation } from './Carnation';
import { Gerbera } from './Gerbera';
import { Lavender } from './Lavender';
import { Lily } from './Lily';
import { Peony } from './Peony';
import { Rose } from './Rose';
import { Sunflower } from './Sunflower';
import { Tulip } from './Tulip';

/** One component per flower; a missing catalog flower is a compile error. */
export const flowerIllustrations: Record<FlowerId, ComponentType> = {
  rose: Rose,
  tulip: Tulip,
  peony: Peony,
  carnation: Carnation,
  gerbera: Gerbera,
  lily: Lily,
  sunflower: Sunflower,
  lavender: Lavender,
};
