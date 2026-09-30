// DEV ONLY (gallery.html, not part of the build): every placeholder sprite, enlarged, for review.
// Plain canvas, no Phaser. Add new sprite sources to SECTIONS as they're created.

import * as archiveProps from '../data/areas/archiveProps';
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
import { ARCHIVIST, ELDERS, FRIEND, GIRL, GUARD, MUM, PREACHER, RESIDENTS, PROTAGONIST, TENDER, VILLAGERS } from '../ui/characters';
import { hexString } from '../ui/pixelArt';
import { SPEAKERS } from '../ui/portraits';
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

const SECTIONS: { title: string; scale: number; entries: Entry[]; animations?: { label: string; frames: RowSprite[]; fps: number }[] }[] = [
  {
    title: 'Characters',
    scale: 6,
    entries: [
      ...PROTAGONIST.idle.map((f, i): Entry => [`protagonist idle ${i}`, f]),
      ...PROTAGONIST.walk.map((f, i): Entry => [`protagonist walk ${i}`, f]),
      ['protagonist jump', PROTAGONIST.jump],
      ['protagonist fall', PROTAGONIST.fall],
      ...MUM.idle.map((f, i): Entry => [`mum idle ${i}`, f]),
      ...TENDER.idle.map((f, i): Entry => [`tender idle ${i}`, f]),
      ...FRIEND.idle.map((f, i): Entry => [`friend idle ${i}`, f]),
      ...GIRL.idle.map((f, i): Entry => [`girl idle ${i}`, f]),
      ...ARCHIVIST.idle.map((f, i): Entry => [`archivist idle ${i}`, f]),
      ...ELDERS.map((e, i): Entry => [`elder ${i}`, e.idle[0]!]),
      ['preacher', PREACHER.idle[0]!],
      ['guard', GUARD.idle[0]!],
      ...RESIDENTS.map((r, i): Entry => [`resident ${i}`, r.idle[0]!]),
      ...VILLAGERS.map((v, i): Entry => [`villager ${i}`, v.idle[0]!]),
    ],
    animations: [
      { label: 'protagonist walk', frames: PROTAGONIST.walk, fps: 9 },
      { label: 'protagonist idle', frames: PROTAGONIST.idle, fps: 1.6 },
      { label: 'mum idle', frames: MUM.idle, fps: 1.5 },
      { label: 'tender idle', frames: TENDER.idle, fps: 1.2 },
      { label: 'friend idle', frames: FRIEND.idle, fps: 1.4 },
      { label: 'girl idle', frames: GIRL.idle, fps: 1.3 },
      ...VILLAGERS.slice(0, 3).map((v, i) => ({ label: `villager ${i} walk`, frames: v.walk, fps: 5.5 })),
    ],
  },
  { title: 'Portraits', scale: 4, entries: Object.entries(SPEAKERS).map(([id, s]): Entry => [id, s.portrait]) },
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
