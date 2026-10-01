import type { ComponentType } from 'react';
import type { CatalogId } from '@/domain/catalog';
import { flowerIllustrations } from './flowers';
import { foliageIllustrations } from './foliage';
import { type WrappingIllustration, wrappingIllustrations } from './wrappings';

/** Flowers and foliage are one component; a wrapping is a back and front pair. */
export type Illustration = ComponentType | WrappingIllustration;

/** Every catalog id has an illustration; each per-kind record already fails to compile when one is missing. */
export const illustrationRegistry: Record<CatalogId, Illustration> = {
  ...flowerIllustrations,
  ...foliageIllustrations,
  ...wrappingIllustrations,
};
