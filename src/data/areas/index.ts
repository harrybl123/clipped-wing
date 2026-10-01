import { archive } from './archive';
import { ascensionGate } from './ascensionGate';
import { backRoutes } from './backRoutes';
import { friendsHome } from './friendsHome';
import { girlsHome } from './girlsHome';
import { home } from './home';
import { lowerRoots } from './lowerRoots';
import { middleTiers } from './middleTiers';
import { offeringFloor } from './offeringFloor';
import { rootsMarket } from './rootsMarket';
import { seedGrove } from './seedGrove';
import { tendersShrine } from './tendersShrine';
import { theRot } from './theRot';
import { trunkClimb } from './trunkClimb';
import { upperHalls } from './upperHalls';
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

/** Places that aren't on the map: you only reach them through the story (her door, the board in her floor). */
export const HIDDEN_AREAS: Record<string, string> = {
  'girls-home': "the girl's home",
  'the-rot': 'the rot',
};

/** Every area's name for menus, on the map or not. */
export const AREA_NAMES: Record<string, string> = { ...PLANNED_AREAS, ...HIDDEN_AREAS };

/** Areas that have been built, by id. */
export const AREAS: Record<string, AreaDefinition> = {
  [home.id]: home,
  [offeringFloor.id]: offeringFloor,
  [rootsMarket.id]: rootsMarket,
  [friendsHome.id]: friendsHome,
  [lowerRoots.id]: lowerRoots,
  [backRoutes.id]: backRoutes,
  [tendersShrine.id]: tendersShrine,
  [trunkClimb.id]: trunkClimb,
  [middleTiers.id]: middleTiers,
  [upperHalls.id]: upperHalls,
  [archive.id]: archive,
  [seedGrove.id]: seedGrove,
  [ascensionGate.id]: ascensionGate,
  [girlsHome.id]: girlsHome,
  [theRot.id]: theRot,
};
