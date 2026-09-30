import { home } from './home';
import type { AreaDefinition } from './types';

/** Every area, by id. */
export const AREAS: Record<string, AreaDefinition> = {
  [home.id]: home,
};
