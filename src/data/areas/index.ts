import { archive } from './archive';
import { ascensionGate } from './ascensionGate';
import { backRoutes } from './backRoutes';
import { pickedFields } from './borderland/pickedFields';
import { shack } from './borderland/shack';
import { swapYard } from './borderland/swapYard';
import { tallyHouse } from './borderland/tallyHouse';
import { bar } from './borderland/bar';
import { gamblingDen } from './borderland/gamblingDen';
import { tallyCellar } from './borderland/tallyCellar';
import { brothel } from './borderland/brothel';
import { compound } from './borderland/compound';
import { compoundHouse } from './borderland/compoundHouse';
import { scrapStacks } from './borderland/scrapStacks';
import { sunkTown } from './borderland/sunkTown';
import { dogsHollow } from './borderland/dogsHollow';
import { rivalLine } from './borderland/rivalLine';
import { deepGround } from './borderland/deepGround';
import { treesEdge } from './borderland/treesEdge';
import { audienceHall } from './capital/audienceHall';
import { banquetGallery } from './capital/banquetGallery';
import { citadelHalls } from './capital/citadelHalls';
import { councilChamber } from './capital/councilChamber';
import { diplomatsOffice } from './capital/diplomatsOffice';
import { fathersStudy } from './capital/fathersStudy';
import { simulationRoom } from './capital/simulationRoom';
import { glasshouse } from './capital/glasshouse';
import { guestWing } from './capital/guestWing';
import { sealedWing } from './capital/sealedWing';
import { princeQuarters } from './capital/princeQuarters';
import { promenade } from './capital/promenade';
import { cityGate } from './capital/cityGate';
import { dataCentre } from './capital/dataCentre';
import { hideout } from './capital/hideout';
import { lifts } from './capital/lifts';
import { lowDistrict } from './capital/lowDistrict';
import { friendsHome } from './friendsHome';
import { girlsHome } from './girlsHome';
import { home } from './home';
import { lowerRoots } from './lowerRoots';
import { middleTiers } from './middleTiers';
import { offeringFloor } from './offeringFloor';
import { rootsMarket } from './rootsMarket';
import { seedGrove } from './seedGrove';
import { shrineCell } from './shrineCell';
import { tendersShrine } from './tendersShrine';
import { theRot } from './theRot';
import { trunkClimb } from './trunkClimb';
import { upperHalls } from './upperHalls';
import type { AreaDefinition } from './types';

/** Every area in the tree (Act 1; docs/design-summary.md), by id, with the name used in menus. Built or not. */
export const TREE_AREAS: Record<string, string> = {
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

/** Every area in the borderland (Chapter 2; docs/chapter-2-world.md), by id, with the name used in menus. Built or not. */
export const BORDERLAND_AREAS: Record<string, string> = {
  shack: 'your shack',
  'tally-house': 'the tally house',
  'swap-yard': 'the swap yard',
  bar: 'the bar',
  'gambling-den': 'the gambling den',
  brothel: 'the brothel',
  compound: "the boss's compound",
  'scrap-stacks': 'the scrap stacks',
  'picked-fields': 'the picked fields',
  'sunk-town': 'the sunk town',
  'dogs-hollow': "the dog's hollow",
  'rival-line': 'the rival line',
  'deep-ground': 'the deep ground',
  'trees-edge': "the tree's edge",
};

/** Every area in the capital (Chapter 3; docs/chapter-3-world.md), by id, with the name used in menus. Built or not. Names are placeholders (designer). */
export const CAPITAL_AREAS: Record<string, string> = {
  'citadel-halls': "the citadel's halls",
  'prince-quarters': 'your quarters',
  'audience-hall': 'the audience hall',
  'council-chamber': 'the council chamber',
  'fathers-study': "your father's study",
  'sealed-wing': 'the sealed wing',
  glasshouse: 'the glasshouse',
  'banquet-gallery': 'the banquet gallery',
  'diplomats-office': "the diplomat's office",
  'guest-wing': 'the guest wing',
  lifts: 'the lifts',
  'data-centre': 'the data centre',
  promenade: 'the promenade',
  'low-district': 'the low district',
  'city-gate': 'the gate',
};

/** Every area on a map, in any chapter, by id, with the name used in menus. Built or not. */
export const PLANNED_AREAS: Record<string, string> = { ...TREE_AREAS, ...BORDERLAND_AREAS, ...CAPITAL_AREAS };

/** Places that aren't on the map: you only reach them through the story (her door, the board in her floor). */
export const HIDDEN_AREAS: Record<string, string> = {
  'girls-home': "the girl's home",
  'the-rot': 'the rot',
  'shrine-cell': 'the cell behind the shrine',
};

/**
 * Areas within an area (designer: the boss's house inside the compound): not on the map themselves; you
 * go in and out through a door in their parent, and the map shows you at the parent.
 */
export const INSIDE_AREAS: Record<string, { name: string; of: string; storyOnly?: boolean }> = {
  'compound-house': { name: "the boss's house", of: 'compound' },
  // (No doors: you're only ever taken down there, and you get out through the drain.)
  'tally-cellar': { name: 'the tally house cellar', of: 'tally-house', storyOnly: true },
  // Chapter 3: the hideout, down a low doorway in the low district.
  hideout: { name: 'the hideout', of: 'low-district' },
  // Chapter 3, Day 2: the simulation room, behind your father's bookshelf.
  'simulation-room': { name: 'the simulation room', of: 'fathers-study' },
};

/** The place on the map an area counts as: its parent if it's an area within an area, else itself. */
export const placeOf = (areaId: string): string => INSIDE_AREAS[areaId]?.of ?? areaId;

/** Every area's name for menus, on the map or not. */
export const AREA_NAMES: Record<string, string> = {
  ...PLANNED_AREAS,
  ...HIDDEN_AREAS,
  ...Object.fromEntries(Object.entries(INSIDE_AREAS).map(([id, { name }]) => [id, name])),
};

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
  [shrineCell.id]: shrineCell,
  // Chapter 2: the borderland.
  [pickedFields.id]: pickedFields,
  [shack.id]: shack,
  [swapYard.id]: swapYard,
  [tallyHouse.id]: tallyHouse,
  [bar.id]: bar,
  [gamblingDen.id]: gamblingDen,
  [tallyCellar.id]: tallyCellar,
  [brothel.id]: brothel,
  [compound.id]: compound,
  [compoundHouse.id]: compoundHouse,
  [scrapStacks.id]: scrapStacks,
  [sunkTown.id]: sunkTown,
  [dogsHollow.id]: dogsHollow,
  [rivalLine.id]: rivalLine,
  [deepGround.id]: deepGround,
  [treesEdge.id]: treesEdge,
  // Chapter 3: the capital.
  [princeQuarters.id]: princeQuarters,
  [citadelHalls.id]: citadelHalls,
  [audienceHall.id]: audienceHall,
  [councilChamber.id]: councilChamber,
  [fathersStudy.id]: fathersStudy,
  [simulationRoom.id]: simulationRoom,
  [sealedWing.id]: sealedWing,
  [glasshouse.id]: glasshouse,
  [banquetGallery.id]: banquetGallery,
  [diplomatsOffice.id]: diplomatsOffice,
  [guestWing.id]: guestWing,
  [promenade.id]: promenade,
  [lifts.id]: lifts,
  [lowDistrict.id]: lowDistrict,
  [hideout.id]: hideout,
  [dataCentre.id]: dataCentre,
  [cityGate.id]: cityGate,
};
