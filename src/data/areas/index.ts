import { friendsHome } from './friendsHome';
import { home } from './home';
import { offeringFloor } from './offeringFloor';
import { rootsMarket } from './rootsMarket';
import type { AreaDefinition } from './types';

/** Every area in the design (docs/design-summary.md), by id, with the name used in menus. Built or not. */
export const PLANNED_AREAS: Record<string, string> = {
  home: 'your home',
  'offering-floor': 'the offering floor',
  'roots-market': 'the roots market',
  'friends-home': "your friend's home",
  'tenders-shrine': "the Tender's shrine",
  'back-routes': 'the back routes',
  'lower-roots': 'the lower roots',
  'trunk-climb': 'the trunk climb',
  'middle-tiers': 'the middle tiers',
  'upper-halls': 'the upper halls',
  archive: 'the archive',
  'seed-grove': 'the seed grove',
  'ascension-gate': 'the Ascension gate',
};

/** Areas that have been built, by id. */
export const AREAS: Record<string, AreaDefinition> = {
  [home.id]: home,
  [offeringFloor.id]: offeringFloor,
  [rootsMarket.id]: rootsMarket,
  [friendsHome.id]: friendsHome,
};
