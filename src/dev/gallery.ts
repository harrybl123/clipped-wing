// DEV ONLY (gallery.html, not part of the build): every placeholder sprite, enlarged, for review.
// Plain canvas, no Phaser. Add new sprite sources to SECTIONS as they're created.

import * as archiveProps from '../data/areas/archiveProps';
import * as ascensionGateProps from '../data/areas/ascensionGateProps';
import * as backRoutesProps from '../data/areas/backRoutesProps';
import * as friendsHomeProps from '../data/areas/friendsHomeProps';
import * as lowerRootsProps from '../data/areas/lowerRootsProps';
import * as homeProps from '../data/areas/homeProps';
import * as offeringFloorProps from '../data/areas/offeringFloorProps';
import * as trunkClimbProps from '../data/areas/trunkClimbProps';
import * as upperHallsProps from '../data/areas/upperHallsProps';
import * as middleTiersProps from '../data/areas/middleTiersProps';
import * as seedGroveProps from '../data/areas/seedGroveProps';
import * as tendersShrineProps from '../data/areas/tendersShrineProps';
import * as rootsMarketProps from '../data/areas/rootsMarketProps';
import { ARCHIVIST, DODGER, ELDERS, FRIEND, FRIEND_FATHER, GIRL, GUARD, MUM, PREACHER, PRINCE, PRINCE_CROUCH, RESIDENTS, PROTAGONIST, SCAVENGER, SCAVENGER_CROUCH, TENDER, VILLAGERS } from '../ui/characters';
import { BEETLE_BATTLE, CARVER_BATTLE, GIRL_BATTLE, ZEALOT_BATTLE } from '../ui/battleSprites';
import { hexString } from '../ui/pixelArt';
import { SPEAKERS } from '../ui/portraits';
import { CAST, DOG, HOSTESSES, RIVALS, TOWNSFOLK } from '../ui/borderlandFolk';
import { CAPITAL_CAST, CITIZENS, COUNCILLORS, COURTIERS, GUARDS as CITADEL_GUARDS, SERVANTS, WATCH } from '../ui/capitalFolk';
import { BIRD, FIRE_FRAMES, FUNGI, LAMP, MORE_ARROW, type RowSprite } from '../ui/sprites';

type Entry = [label: string, sprite: RowSprite];

const isSprite = (v: unknown): v is RowSprite => typeof v === 'object' && v !== null && 'rows' in v && 'colours' in v;

/** Props: constants as they are, generator functions at a sample size. */
const propEntries = (props: Record<string, unknown>): Entry[] => Object.entries(props).flatMap(([name, value]): Entry[] => {
  if (isSprite(value)) return [[name, value]];
  if (typeof value === 'function') {
    const make = value as (a: number, b?: number) => RowSprite;
    return [[make.length >= 2 ? `${name}(12, 24)` : `${name}(24)`, make.length >= 2 ? make(12, 24) : make(24)]];
  }
  return [];
});

/** The world sprite each speaker's portrait should match. */
const v = (i: number) => VILLAGERS[i]!.idle[0]!;
const r = (i: number) => RESIDENTS[i]!.idle[0]!;
const FIGURES: Record<string, RowSprite> = {
  you: PROTAGONIST.idle[0]!, mum: MUM.idle[0]!, tender: TENDER.idle[0]!, friend: FRIEND.idle[0]!, girl: GIRL.idle[0]!,
  archivist: ARCHIVIST.idle[0]!, boy: DODGER.idle[0]!, preacher: PREACHER.idle[0]!,
  elder_amber: ELDERS[0]!.idle[0]!, elder_cyan: ELDERS[1]!.idle[0]!, elder_green: ELDERS[2]!.idle[0]!, elder_pale: ELDERS[3]!.idle[0]!,
  guard: GUARD.idle[0]!, escort: GUARD.idle[0]!, post_guard: GUARD.idle[0]!, gate_guard: GUARD.idle[0]!,
  zealot: v(0), old_man: v(1), mother: v(6), thin_man: v(2), stew_seller: v(3), fungus_seller: v(0), cloth_seller: v(1),
  curio_seller: v(5), local: v(5), friend_father: FRIEND_FATHER.idle[0]!, carver: r(3), lift_keeper: r(1), doorman: r(1),
  scavenger: SCAVENGER.idle[0]!,
  prince: PRINCE.idle[0]!,
  hostess: HOSTESSES[0]!.idle[0]!,
  ...Object.fromEntries(Object.entries(CAST).map(([id, f]) => [id, f.idle[0]!])),
  gardener: r(2), crowd_woman: v(3), crowd_man: v(4), crowd_someone: v(5), crowd_someone_else: v(1),
  ...Object.fromEntries(Object.entries(CAPITAL_CAST).map(([id, f]) => [id, f.idle[0]!])),
  ...Object.fromEntries(([['guard', CITADEL_GUARDS], ['courtier', COURTIERS], ['servant', SERVANTS], ['councillor', COUNCILLORS], ['watch', WATCH], ['citizen', CITIZENS]] as const).flatMap(([g, list]) => list.map((f, i) => [`c3_${g}_${i}`, f.idle[0]!]))),
};

const SECTIONS: { title: string; scale: number; entries: Entry[]; animations?: { label: string; frames: RowSprite[]; fps: number }[] }[] = [
  {
    title: 'Characters',
    scale: 6,
    entries: [
      ...PROTAGONIST.idle.map((f, i): Entry => [`protagonist idle ${i}`, f]),
      ...PROTAGONIST.walk.map((f, i): Entry => [`protagonist walk ${i}`, f]),
      ['protagonist jump', PROTAGONIST.jump],
      ['protagonist fall', PROTAGONIST.fall],
      ...SCAVENGER.idle.map((f, i): Entry => [`scavenger idle ${i}`, f]),
      ...SCAVENGER.walk.map((f, i): Entry => [`scavenger walk ${i}`, f]),
      ['scavenger jump', SCAVENGER.jump],
      ['scavenger fall', SCAVENGER.fall],
      ['scavenger crouch', SCAVENGER_CROUCH.idle],
      ...PRINCE.idle.map((f, i): Entry => [`prince idle ${i}`, f]),
      ...PRINCE.walk.map((f, i): Entry => [`prince walk ${i}`, f]),
      ['prince jump', PRINCE.jump],
      ['prince fall', PRINCE.fall],
      ['prince crouch', PRINCE_CROUCH.idle],
      ...Object.entries(CAST).map(([id, f]): Entry => [id, f.idle[0]!]),
      ...TOWNSFOLK.map((f, i): Entry => [`townsfolk ${i}`, f.idle[0]!]),
      ...HOSTESSES.map((f, i): Entry => [`hostess ${i}`, f.idle[0]!]),
      ...RIVALS.map((f, i): Entry => [`rival ${i}`, f.idle[0]!]),
      ['dog', DOG.idle[0]!],
      ...MUM.idle.map((f, i): Entry => [`mum idle ${i}`, f]),
      ...TENDER.idle.map((f, i): Entry => [`tender idle ${i}`, f]),
      ...FRIEND.idle.map((f, i): Entry => [`friend idle ${i}`, f]),
      ...GIRL.idle.map((f, i): Entry => [`girl idle ${i}`, f]),
      ...ARCHIVIST.idle.map((f, i): Entry => [`archivist idle ${i}`, f]),
      ...ELDERS.map((e, i): Entry => [`elder ${i}`, e.idle[0]!]),
      ['preacher', PREACHER.idle[0]!],
      ['guard', GUARD.idle[0]!],
      ...DODGER.idle.map((f, i): Entry => [`boy idle ${i}`, f]),
      ...RESIDENTS.map((r, i): Entry => [`resident ${i}`, r.idle[0]!]),
      ...VILLAGERS.map((v, i): Entry => [`villager ${i}`, v.idle[0]!]),
    ],
    animations: [
      { label: 'protagonist walk', frames: PROTAGONIST.walk, fps: 9 },
      { label: 'protagonist idle', frames: PROTAGONIST.idle, fps: 1.6 },
      { label: 'scavenger walk', frames: SCAVENGER.walk, fps: 9 },
      { label: 'prince walk', frames: PRINCE.walk, fps: 9 },
      { label: 'scavenger idle', frames: SCAVENGER.idle, fps: 1.6 },
      { label: 'scavenger crawl', frames: SCAVENGER_CROUCH.walk, fps: 5 },
      { label: 'dog walk', frames: DOG.walk, fps: 6 },
      { label: 'dog idle', frames: DOG.idle, fps: 3 },
      { label: 'townsfolk 1 walk', frames: TOWNSFOLK[1]!.walk, fps: 5.5 },
      { label: 'mum idle', frames: MUM.idle, fps: 1.5 },
      { label: 'tender idle', frames: TENDER.idle, fps: 1.2 },
      { label: 'friend idle', frames: FRIEND.idle, fps: 1.4 },
      { label: 'girl idle', frames: GIRL.idle, fps: 1.3 },
      ...VILLAGERS.slice(0, 3).map((v, i) => ({ label: `villager ${i} walk`, frames: v.walk, fps: 5.5 })),
    ],
  },
  // The capital's people (Chapter 3; src/ui/capitalFolk.ts).
  {
    title: 'The capital',
    scale: 6,
    entries: [
      ...Object.entries(CAPITAL_CAST).flatMap(([id, f]): Entry[] => [[id, f.idle[0]!], [`${id} walk`, f.walk[0]!]]),
      ...CITADEL_GUARDS.map((f, i): Entry => [`guard ${i}`, f.idle[0]!]),
      ...COURTIERS.map((f, i): Entry => [`courtier ${i}`, f.idle[0]!]),
      ...SERVANTS.map((f, i): Entry => [`servant ${i}`, f.idle[0]!]),
      ...COUNCILLORS.map((f, i): Entry => [`councillor ${i}`, f.idle[0]!]),
      ...WATCH.map((f, i): Entry => [`watch ${i}`, f.idle[0]!]),
      ...CITIZENS.map((f, i): Entry => [`citizen ${i}`, f.idle[0]!]),
    ],
    animations: [
      ...Object.entries(CAPITAL_CAST).map(([id, f]) => ({ label: `${id} walk`, frames: f.walk, fps: 5.5 })),
      ...Object.entries(CAPITAL_CAST).slice(0, 4).map(([id, f]) => ({ label: `${id} idle`, frames: f.idle, fps: 1.5 })),
    ],
  },
  // The combat stage's bigger figures (src/ui/battleSprites.ts): you from behind, the zealot facing you.
  {
    title: 'Battle sprites',
    scale: 4,
    entries: [
      ...Object.entries(CARVER_BATTLE).map(([pose, s]): Entry => [`carver ${pose}`, s]),
      ...Object.entries(GIRL_BATTLE).map(([pose, s]): Entry => [`girl ${pose}`, s]),
      ...Object.entries(ZEALOT_BATTLE).map(([pose, s]): Entry => [`zealot ${pose}`, s]),
      ...Object.entries(BEETLE_BATTLE).map(([pose, s]): Entry => [`beetle ${pose}`, s]),
    ],
    animations: [
      { label: 'carver idle', frames: [CARVER_BATTLE.idle, CARVER_BATTLE.breathe], fps: 1.5 },
      { label: 'girl idle', frames: [GIRL_BATTLE.idle, GIRL_BATTLE.breathe], fps: 1.5 },
      { label: 'zealot idle', frames: [ZEALOT_BATTLE.idle, ZEALOT_BATTLE.breathe], fps: 1.5 },
      { label: 'beetle idle', frames: [BEETLE_BATTLE.idle!, BEETLE_BATTLE.breathe!], fps: 1.5 },
    ],
  },
  // Each portrait beside the figure you see in the world, to check they match.
  {
    title: 'Portraits',
    scale: 4,
    entries: Object.entries(SPEAKERS).flatMap(([id, s]): Entry[] => {
      const figure = FIGURES[id];
      return [[`${id} (${s.name})`, s.portrait], ...(figure ? [[`${id} in the world`, figure] as Entry] : [])];
    }),
  },
  {
    title: 'Shared sprites',
    scale: 6,
    entries: [
      ['bird', BIRD],
      ['lamp', LAMP],
      ['more arrow', MORE_ARROW],
      ...Object.entries(FUNGI).map(([n, s]): Entry => [`fungus ${n}`, s]),
      ...FIRE_FRAMES.map((f, i): Entry => [`fire ${i}`, f]),
    ],
    animations: [{ label: 'fire', frames: [...FIRE_FRAMES], fps: 7 }],
  },
  { title: 'Home props', scale: 4, entries: propEntries(homeProps) },
  { title: 'Offering floor props', scale: 4, entries: propEntries(offeringFloorProps) },
  { title: 'Roots market props', scale: 4, entries: propEntries(rootsMarketProps) },
  { title: "Friend's home props", scale: 4, entries: propEntries(friendsHomeProps) },
  { title: 'Lower roots props', scale: 4, entries: propEntries(lowerRootsProps) },
  { title: 'Back routes props', scale: 4, entries: propEntries(backRoutesProps) },
  { title: "Tender's shrine props", scale: 4, entries: propEntries(tendersShrineProps) },
  { title: 'Middle tiers props', scale: 4, entries: propEntries(middleTiersProps) },
  { title: 'Upper halls props', scale: 4, entries: propEntries(upperHallsProps) },
  { title: 'Archive props', scale: 4, entries: propEntries(archiveProps) },
  { title: 'Seed grove props', scale: 4, entries: propEntries(seedGroveProps) },
  { title: 'Ascension gate props', scale: 4, entries: propEntries(ascensionGateProps) },
  { title: 'Trunk climb props', scale: 4, entries: [...propEntries(trunkClimbProps), ...(['fungus', 'bark', 'plank', 'metal'] as const).map((k): Entry => [`ledge(30, ${k})`, trunkClimbProps.ledge(30, k)])] },
];

function drawSprite(canvas: HTMLCanvasElement, sprite: RowSprite, scale: number): void {
  const w = sprite.rows[0]!.length;
  const h = sprite.rows.length;
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  sprite.rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const colour = sprite.colours[ch];
      if (colour === undefined) return;
      ctx.fillStyle = hexString(colour);
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }),
  );
}

function tile(label: string, sprite: RowSprite, scale: number): HTMLElement {
  const figure = document.createElement('figure');
  const canvas = document.createElement('canvas');
  drawSprite(canvas, sprite, scale);
  const caption = document.createElement('figcaption');
  caption.textContent = `${label} · ${sprite.rows[0]!.length}×${sprite.rows.length}`;
  figure.append(canvas, caption);
  return figure;
}

const root = document.getElementById('gallery')!;
for (const section of SECTIONS) {
  const heading = document.createElement('h2');
  heading.textContent = section.title;
  const grid = document.createElement('div');
  grid.className = 'grid';
  for (const [label, sprite] of section.entries) grid.append(tile(label, sprite, section.scale));
  for (const anim of section.animations ?? []) {
    const figure = tile(`${anim.label} (animated)`, anim.frames[0]!, section.scale);
    const canvas = figure.querySelector('canvas')!;
    let frame = 0;
    setInterval(() => drawSprite(canvas, anim.frames[(frame = (frame + 1) % anim.frames.length)]!, section.scale), 1000 / anim.fps);
    grid.append(figure);
  }
  root.append(heading, grid);
}

// Toggle between dark and lit wood backgrounds, to check silhouettes read on both.
const backgrounds = ['#1c1611', '#54463a'];
let bg = 0;
document.getElementById('toggle-bg')!.addEventListener('click', () => {
  bg = (bg + 1) % backgrounds.length;
  document.body.style.setProperty('--bg', backgrounds[bg]!);
});
