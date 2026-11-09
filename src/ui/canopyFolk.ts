import { SHADES as S } from './pixelArt';
import { courtly, courtlyFrames, type CapitalLook } from './capitalFolk';
import type { RowSprite } from './sprites';

// PLACEHOLDER people of the canopy (Chapter 4; docs/chapter-4-world.md) until the art pass, drawn with the
// capital's detailed generator (`courtly`) in the canopy's own clothes: earthy, worked-in, warm; harnesses,
// scarves, aprons; canopy greens and creams; the ascended in the old masters' cream and amber. Looks are
// Claude's (marked suggestion in the world doc), names are placeholders. Never red, copper or wine.

/** The colony's named people, by speaker id. */
export const CANOPY_CAST_LOOKS = {
  /**
   * Grounded (designer: a Nathan Drake / Joel type; passionate, slightly aggressive; an ascended master):
   * rugged, stubble, hair pushed back going grey; a worn canvas jacket open over a pale shirt, a belt,
   * work trousers, boots. Weathered. (Suggestion: middle-aged, he went up young.)
   */
  grounded: { height: 26, width: 3, skin: 'tan', hair: S.woodPale, hairStyle: 'messy', beard: 'stubble', top: S.greenDeep, topStyle: 'jacket', neck: 'open', shirt: S.light, belt: S.wood, legs: S.cyanDeep, boots: S.wood, pose: 'side' },
  /** The master (Day 1's, now making blessings to order): old, white hair in a bun, a long work robe, an apron, her bottle. */
  master: { height: 22, width: 2, skin: 'fair', hair: S.light, hairStyle: 'bun', top: S.woodPale, topStyle: 'long', apron: S.amberDeep, legs: S.wood, hold: 'bottle' },
  /** The quartermaster: ground-born, broad, a scarf, rolled sleeves, a ring of keys. */
  quartermaster: { height: 25, width: 4, skin: 'dark', hair: S.shadow, hairStyle: 'short', top: S.greenMid, topStyle: 'tunic', scarf: S.amber, belt: S.wood, legs: S.wood, hold: 'keys', belly: true },
  /** The doubter: a former roots-dweller, too clean, too pleased; a neat pale jacket, hands clasped. */
  doubter: { height: 24, width: 2, skin: 'fair', hair: S.woodLight, hairStyle: 'short', top: S.light, topStyle: 'jacket', collar: S.dim, legs: S.dim, pose: 'front' },
  /** The hatch-keeper: young, canopy-born, overalls, a harness, a bag, a book of drawings of the inside. */
  keeper: { height: 21, width: 2, skin: 'tan', hair: S.amberDeep, hairStyle: 'messy', top: S.cyanDeep, topStyle: 'overalls', belt: S.amber, bag: S.woodPale, legs: S.cyanDeep, hold: 'book' },
  /** The messenger: polished, a capital coat with its gold trim under a traveller's cloak, a case. */
  messenger: { height: 26, width: 2, skin: 'dark', hair: S.shadow, hairStyle: 'crop', top: S.deep, topStyle: 'coat', trim: S.amber, cape: S.woodLight, legs: S.deep, hold: 'case' },
  /** The hunter (designer: Sevro, Red Rising, as a type): small, wiry, a fur mantle over his shoulders (no pelt over his head: designer, too close to his inspiration), the electric bow. */
  hunter: { height: 20, width: 2, skin: 'fair', hair: S.shadow, hairStyle: 'short', cape: S.dim, top: S.wood, topStyle: 'vest', belt: S.woodLight, legs: S.woodLight, boots: S.deep, hold: 'bow' },
  /** The child who bit your bird (designer: a child's hunger). */
  child: { height: 18, width: 2, skin: 'tan', hair: S.woodLight, hairStyle: 'curls', top: S.amberMid, topStyle: 'tunic', legs: S.wood },
} satisfies Record<string, CapitalLook>;

export type CanopyCastId = keyof typeof CANOPY_CAST_LOOKS;
export const CANOPY_CAST = Object.fromEntries(Object.entries(CANOPY_CAST_LOOKS).map(([id, look]) => [id, courtlyFrames(look)])) as Record<CanopyCastId, ReturnType<typeof courtlyFrames>>;

/** The canopy's folk: light layered clothes in greens and creams, harnesses (belts) and clips, scarves, aprons, bags. */
export const CANOPY_FOLK_LOOKS: CapitalLook[] = [
  { height: 24, width: 2, skin: 'tan', hair: S.woodLight, hairStyle: 'tail', top: S.greenMid, topStyle: 'tunic', belt: S.amberDeep, legs: S.woodPale, bag: S.woodLight },
  { height: 25, width: 3, skin: 'fair', hair: S.amberDeep, hairStyle: 'short', beard: 'full', top: S.light, topStyle: 'vest', belt: S.wood, legs: S.greenDeep, apron: S.woodPale },
  { height: 23, width: 2, skin: 'dark', hair: S.shadow, hairStyle: 'braid', top: S.amberMid, topStyle: 'dress', scarf: S.greenMid, legs: S.wood },
  { height: 26, width: 3, skin: 'tan', hair: S.deep, hairStyle: 'undercut', top: S.greenDeep, topStyle: 'jacket', neck: 'open', shirt: S.amber, belt: S.amberDeep, legs: S.woodLight },
  { height: 22, width: 2, skin: 'fair', hair: S.woodPale, hairStyle: 'bob', top: S.cyanDeep, topStyle: 'overalls', belt: S.amber, legs: S.cyanDeep },
  { height: 24, width: 2, skin: 'dark', hair: S.deep, hairStyle: 'curls', top: S.woodPale, topStyle: 'tunic', scarf: S.cyanMid, belt: S.wood, legs: S.greenDeep },
  { height: 25, width: 3, skin: 'tan', hair: S.light, hairStyle: 'receding', beard: 'trim', top: S.greenMid, topStyle: 'coat', legs: S.wood, hold: 'spanner' },
  { height: 23, width: 2, skin: 'fair', hair: S.shadow, hairStyle: 'long', top: S.light, topStyle: 'dress', apron: S.greenMid, legs: S.woodPale },
];

/** The ascended: the old masters, alive, in cream and amber, robes and aprons, every one of them old. */
export const ASCENDED_LOOKS: CapitalLook[] = [
  { height: 23, width: 2, skin: 'tan', hair: S.white, hairStyle: 'bald', beard: 'full', top: S.light, topStyle: 'long', sash: S.amberMid, legs: S.dim, pose: 'behind' },
  { height: 22, width: 2, skin: 'fair', hair: S.light, hairStyle: 'bun', top: S.amberMid, topStyle: 'long', apron: S.woodPale, legs: S.wood, hold: 'cane' },
  { height: 24, width: 3, skin: 'dark', hair: S.light, hairStyle: 'short', beard: 'trim', top: S.woodPale, topStyle: 'coat', scarf: S.amber, legs: S.woodLight, pose: 'front' },
  { height: 21, width: 2, skin: 'fair', hair: S.white, hairStyle: 'long', top: S.light, topStyle: 'long', necklace: S.amber, legs: S.dim, hold: 'book' },
  { height: 23, width: 2, skin: 'tan', hair: S.dim, hairStyle: 'receding', top: S.amberDeep, topStyle: 'coat', apron: S.light, legs: S.wood },
];

export const CANOPY_FOLK = CANOPY_FOLK_LOOKS.map(courtlyFrames);
export const ASCENDED = ASCENDED_LOOKS.map(courtlyFrames);

/**
 * The girl from the lower roots by daylight (Chapter 4: with you only if you fell after framing her,
 * designer): choppy dark hair with its glowing green strand, a ring in her ear, fungus-ink tattoos on her
 * arms, patched roots clothes, arms crossed. Her Act 1 self in colour (Claude's, suggestion).
 */
export const GIRL_DAY_LOOK: CapitalLook = { height: 24, width: 2, skin: 'fair', hair: S.shadow, hairStyle: 'messy', top: S.woodLight, topStyle: 'vest', patches: S.greenDeep, belt: S.wood, legs: S.wood, pose: 'front', slender: true };
const strand = (s: RowSprite): RowSprite => {
  // Her glowing green strand, down the front of her hair; a tattoo's mark on her arm.
  const rows = s.rows.map((r) => [...r]);
  const hairRow = rows.findIndex((r) => r.includes('h'));
  if (hairRow >= 0) {
    const r = rows[hairRow + 1] ?? rows[hairRow]!;
    const x = r.lastIndexOf('h');
    if (x >= 0) r[x] = 'N';
    const r2 = rows[hairRow + 2];
    if (r2 && x >= 0 && r2[x] !== '.') r2[x] = 'N';
  }
  return { rows: rows.map((r) => r.join('')), colours: { ...s.colours, N: S.green } };
};
export const GIRL_DAY = { idle: [strand(courtly(GIRL_DAY_LOOK)), strand(courtly(GIRL_DAY_LOOK, true))], walk: [strand(courtly(GIRL_DAY_LOOK, false, 2)), strand(courtly(GIRL_DAY_LOOK, true, -2))] };
