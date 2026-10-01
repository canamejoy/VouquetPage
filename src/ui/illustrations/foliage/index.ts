import type { ComponentType } from 'react';
import type { FoliageId } from '@/domain/catalog';
import { DustyMiller } from './DustyMiller';
import { Eucalyptus } from './Eucalyptus';
import { Fern } from './Fern';
import { Olive } from './Olive';
import { Ruscus } from './Ruscus';

/** One component per foliage item; a missing catalog foliage is a compile error. */
export const foliageIllustrations: Record<FoliageId, ComponentType> = {
  eucalyptus: Eucalyptus,
  ruscus: Ruscus,
  fern: Fern,
  olive: Olive,
  'dusty-miller': DustyMiller,
};
