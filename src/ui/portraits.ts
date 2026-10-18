import { ELDER_LOOKS, FRIEND_FATHER_LOOK, GUARD_LOOK, PREACHER_LOOK, RESIDENT_LOOKS, VILLAGER_LOOKS, type VillagerLook } from './characters';
import type { VoiceId } from '../systems/voices';
import { CAST_LOOKS, HOSTESS_LOOKS, RIVAL_LOOKS, STRAGGLER_LOOKS, TOWNSFOLK_LOOKS, type FolkLook } from './borderlandFolk';
import { CAPITAL_CAST_LOOKS as C3, CITIZEN_LOOKS, COUNCIL_LOOKS, COURTIER_LOOKS, GUARD_LOOKS as CITADEL_GUARD_LOOKS, SERVANT_LOOKS, WATCH_LOOKS, type CapitalLook } from './capitalFolk';
import { capitalPortrait, type CourtFace } from './capitalPortraits';
import { ASCENDED_LOOKS, CANOPY_CAST_LOOKS as C4, CANOPY_FOLK_LOOKS } from './canopyFolk';
import { SHADES } from './pixelArt';
import type { RowSprite } from './sprites';

// PLACEHOLDER dialogue portraits (48×48 busts) until the art pass. Drawn procedurally from a few
// shapes, lit from the right like the figures in the world: lit cheek, mid tone, shadowed side.

export const PORTRAIT_SIZE = 48;

type Pick = (x: number, y: number) => string;

const COLOURS = {
  L: SHADES.light, // lit skin
  M: SHADES.dim, // mid skin
  S: SHADES.woodPale, // shadowed skin
  E: SHADES.woodLight, // skin edge / deep shadow
  h: SHADES.shadow, // hair
  k: SHADES.woodLight, // hair highlight
  g: SHADES.dim, // grey hair
  G: SHADES.light, // grey hair highlight
  e: SHADES.shadow, // eyes, mouth
  w: SHADES.white, // eye glint
  c: SHADES.deep, // clothes
  f: SHADES.wood, // clothes folds / lit side
  r: SHADES.red, // the red thread
  s: SHADES.amberDeep, // shawl
  t: SHADES.woodPale, // shawl pattern
  o: SHADES.shadow, // outline
  a: SHADES.amber, // amber crest
  A: SHADES.amberDeep, // crest shadow
  b: SHADES.light, // white beard
  B: SHADES.dim, // beard shadow
  H: SHADES.woodLight, // hood
  I: SHADES.wood, // hood lit edge
  q: SHADES.cyanMid, // tube token
  Q: SHADES.cyan, // tube token highlight
  y: SHADES.amberDeep, // blond hair
  Y: SHADES.amber, // blond hair highlight
  n: SHADES.green, // glowing strand, fungus-ink tattoos
  N: SHADES.greenMid, // strand glow
  x: SHADES.greenDeep, // tattoo lines
  p: SHADES.light, // piercings
  W: SHADES.white, // the archivist's pale ribbon
  j: SHADES.copperDeep, // the scavenger's copper hair in shadow (copper is reserved for the protagonist, like red)
  z: SHADES.copper, // her copper hair
  i: SHADES.skinFair, // warm fair skin (the borderland's daylight)
  l: SHADES.skinFairShade, // its shadow
  v: SHADES.cyanMid, // the scavenger's crop top
  V: SHADES.cyanDeep, // its shadow
  K: SHADES.skinTan, // tan skin (the prince)
  U: SHADES.skinTanShade, // its shadow
  D: SHADES.deep, // the prince's close-cropped hair
  C: SHADES.cyanDeep, // his dark coat
  R: SHADES.wine, // his collar: wine (reserved for him, like red)
  X: SHADES.wineDeep, // the collar in shadow
};

function draw(pick: Pick): RowSprite {
  const rows = Array.from({ length: PORTRAIT_SIZE }, (_, y) => Array.from({ length: PORTRAIT_SIZE }, (_, x) => pick(x, y)).join(''));
  return { rows, colours: COLOURS };
}

const inEllipse = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

/** Skin shading across a face centred on cx, lit from the right. */
function skin(x: number, cx: number, rx: number): string {
  const u = (x - cx) / rx; // -1 left .. 1 right
  if (u > 0.35) return 'L';
  if (u > -0.3) return 'M';
  if (u > -0.8) return 'S';
  return 'E';
}

interface Face {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/** Eyes, brows, nose and mouth for a face. `soft` gives lower lids and a gentler mouth. */
function features(x: number, y: number, f: Face, soft: boolean): string | null {
  const eyeY = f.cy + 1;
  for (const ex of [f.cx - 4, f.cx + 3]) {
    if (y === eyeY && (x === ex || x === ex + 1)) return x === ex + 1 && ex > f.cx ? 'w' : 'e';
    if (y === eyeY - 2 && x >= ex - 1 && x <= ex + 2) return 'h'; // brow
    if (soft && y === eyeY + 1 && (x === ex || x === ex + 1)) return 'S'; // lower lid
  }
  if (x === f.cx + 1 && y >= eyeY + 1 && y <= eyeY + 4) return 'S'; // nose shadow
  if (y === eyeY + 5 && x === f.cx + 2) return 'S';
  const mouthY = eyeY + 8;
  if (y === mouthY && x >= f.cx - 2 && x <= f.cx + 2) return soft && (x === f.cx - 2 || x === f.cx + 2) ? 'S' : 'e';
  return null;
}

/** Shoulders and chest: a dark tunic with folds, lit on the right edge. */
function body(x: number, y: number, top: number): string | null {
  if (y < top) return null;
  const spread = 8 + (y - top) * 1.6;
  const dx = x - 24;
  if (Math.abs(dx) > spread) return null;
  if (Math.abs(dx) > spread - 1) return dx > 0 ? 'f' : 'o';
  if ((x + Math.floor(y / 3)) % 9 === 0 && y > top + 3) return 'f';
  return 'c';
}

/** The protagonist: young, thin-faced, messy dark hair, the red thread tied at the neck. */
export const PROTAGONIST_PORTRAIT: RowSprite = (() => {
  const face: Face = { cx: 24, cy: 20, rx: 9, ry: 12 };
  return draw((x, y) => {
    const inFace = inEllipse(x, y, face.cx, face.cy, face.rx, face.ry);
    // Messy hair over the top of the head, with a ragged fringe.
    const fringe = face.cy - 6 + ((x * 7) % 5 === 0 ? 2 : (x * 3) % 4 === 0 ? 1 : 0);
    const inHair = inEllipse(x, y, face.cx, face.cy - 3, face.rx + 2, face.ry) && y < fringe;
    if (inHair) return (x + y) % 7 === 0 && x > face.cx ? 'k' : 'h';
    if (inFace) return features(x, y, face, false) ?? skin(x, face.cx, face.rx);
    // Neck, with the red thread tied round it and its end hanging down.
    if (y >= 31 && y <= 37 && x >= 20 && x <= 28) {
      if (y === 34) return 'r';
      return skin(x, 24, 5);
    }
    if ((x === 21 && y >= 35 && y <= 40) || (x === 22 && y === 35)) return 'r';
    return body(x, y, 36) ?? '.';
  });
})();

/** Mum: hair pulled up in a bun, softer eyes, a few lines, her patterned shawl. */
export const MUM_PORTRAIT: RowSprite = (() => {
  const face: Face = { cx: 24, cy: 22, rx: 10, ry: 12 };
  return draw((x, y) => {
    // Bun on top, then hair swept back over the head.
    if (inEllipse(x, y, 24, 7, 5, 4)) return (x + y) % 4 === 0 ? 'G' : 'g';
    const inHair = inEllipse(x, y, face.cx, face.cy - 2, face.rx + 1, face.ry) && y < face.cy - 5 - (Math.abs(x - face.cx) < 4 ? 1 : 0);
    if (inHair) return x > face.cx && (x + y) % 3 === 0 ? 'G' : 'g';
    if (inEllipse(x, y, face.cx, face.cy, face.rx, face.ry)) {
      const feature = features(x, y, face, true);
      if (feature) return feature;
      if ((y === face.cy + 5 && (x === face.cx - 6 || x === face.cx + 6)) || (y === face.cy - 4 && x >= face.cx - 1 && x <= face.cx + 1)) return 'S'; // lines
      return skin(x, face.cx, face.rx);
    }
    if (y >= 33 && y <= 36 && x >= 20 && x <= 28) return skin(x, 24, 5);
    // The shawl, outlined and patterned, over a dark dress.
    if (y >= 36) {
      const spread = 9 + (y - 36) * 1.8;
      const dx = x - 24;
      if (Math.abs(dx) <= spread && y <= 36 + Math.max(0, 9 - Math.abs(dx) / 3)) {
        if (Math.abs(dx) > spread - 1 || y === 36) return 'o';
        return (x + y) % 4 === 0 || (x - y) % 4 === 0 ? 't' : 's';
      }
    }
    return body(x, y, 37) ?? '.';
  });
})();

/** The Tender: old and wise-looking, hood with the amber crest of office, long white beard. */
export const TENDER_PORTRAIT: RowSprite = (() => {
  const face: Face = { cx: 24, cy: 22, rx: 8, ry: 10 };
  return draw((x, y) => {
    // The amber crest, a pointed diamond badge at the brow of the hood.
    const crest = Math.abs(x - 24) + Math.abs(y - 8.5) * 0.8;
    if (crest <= 3.2) return crest <= 1.6 ? 'a' : 'A';
    // Face, deep under the hood: only the lit side shows much.
    const inFace = inEllipse(x, y, face.cx, face.cy, face.rx, face.ry);
    // Long beard from the cheeks down over the chest.
    const beardTop = face.cy + 3;
    const beardHalf = y < 38 ? 7 - Math.max(0, (y - 30) * 0.4) : Math.max(0, 7 - (y - 30) * 0.6);
    if (y >= beardTop && Math.abs(x - 24) <= beardHalf && !(y < face.cy + 7 && Math.abs(x - 24) <= 2 && y === face.cy + 6)) {
      if (y === face.cy + 6 && Math.abs(x - 24) <= 2) return 'e'; // mouth in the beard
      return x < 22 || (x * 3 + y) % 11 === 0 ? 'B' : 'b';
    }
    if (inFace) {
      const feature = features(x, y, face, true);
      if (feature && y < beardTop) return feature === 'h' ? 'b' : feature; // white brows
      if (y === face.cy - 4 && x >= face.cx - 3 && x <= face.cx + 3) return 'S'; // brow furrow
      return skin(x, face.cx, face.rx);
    }
    // Hood around the face, falling to the shoulders.
    const inHood = inEllipse(x, y, 24, 22, 14, 17) || (y > 30 && Math.abs(x - 24) <= 8 + (y - 30) * 1.6);
    if (inHood && y <= 47) {
      if (!inEllipse(x, y, 24, 22, 13, 16) && y <= 30) return x > 24 ? 'I' : 'o';
      return x > 30 ? 'I' : 'H';
    }
    return '.';
  });
})();

/** Your friend: your age, neat short blond hair with a parting, an open face, the cyan tube token on a cord. */
export const FRIEND_PORTRAIT: RowSprite = (() => {
  const face: Face = { cx: 24, cy: 21, rx: 9, ry: 12 };
  return draw((x, y) => {
    // Tidy hair, cut straight across the brow, parted on the left.
    // Fair hair, a straight fringe and down over the temples, outlined so it stands apart from the skin.
    const hair = (grow: number) =>
      inEllipse(x, y, face.cx, face.cy - 2, face.rx + 1.5 + grow, face.ry + 0.5 + grow) &&
      (y < face.cy - 5 + grow || (Math.abs(x - face.cx) > face.rx - 2 - grow && y < face.cy + 1 + grow));
    if (hair(0)) {
      if (x < face.cx - 5 || x === face.cx - 3 || (x + (y >> 2)) % 5 === 0) return 'y';
      return 'Y';
    }
    if (hair(1) && !inEllipse(x, y, face.cx, face.cy, face.rx, face.ry)) return 'o';
    if (inEllipse(x, y, face.cx, face.cy, face.rx, face.ry)) {
      if (y === face.cy + 8 && (x === face.cx - 3 || x === face.cx + 3)) return 'e'; // a hopeful smile
      const feature = features(x, y, face, false);
      if (feature === 'h') return 'y'; // fair brows
      return feature ?? skin(x, face.cx, face.rx);
    }
    // The token: a bead on a cord round the neck.
    if (inEllipse(x, y, 24, 41, 1.6, 1.6)) return x >= 24 && y <= 41 ? 'Q' : 'q';
    for (const side of [-1, 1]) {
      if (y >= 34 && y <= 39 && x === 24 + side * (4 - Math.round((y - 34) * 0.7))) return 'E';
    }
    if (y >= 32 && y <= 37 && x >= 20 && x <= 28) return skin(x, 24, 5);
    return body(x, y, 36) ?? '.';
  });
})();

/**
 * The girl in the roots: choppy, messy dark hair, a fringe over one eye, the glowing
 * green strand, rings in her ear, brow and lip, fungus-ink tattoos up her neck, a half-lidded smirk.
 */
export const GIRL_PORTRAIT: RowSprite = (() => {
  const face: Face = { cx: 24, cy: 22, rx: 9, ry: 11 };
  const eyeY = face.cy + 1;
  const ragged = (x: number) => [0, 2, 1, 3, 1, 0, 2, 3, 0, 1][x % 10]!; // uneven ends
  return draw((x, y) => {
    const u = x - face.cx;
    const inFace = inEllipse(x, y, face.cx, face.cy, face.rx, face.ry);
    // Piercings: rings down the right ear, poking through her hair; a brow ring; a lip ring.
    if (x === face.cx + face.rx + 1 && (y === eyeY + 1 || y === eyeY + 4)) return 'p';
    if (x === face.cx + 6 && y === eyeY - 2) return 'p';
    if (x === face.cx - 1 && y === eyeY + 9) return 'p';
    // Hair: a choppy side-swept fringe (down over the left eye), falling past the jaw either side.
    const inMass = inEllipse(x, y, face.cx, face.cy - 3, face.rx + 4, face.ry + 3);
    const fringe = u < 0 && u >= -9 ? eyeY + 3 - Math.floor((u + 9) * 0.45) : face.cy - 7 + ragged(x);
    const overFace = inFace && y < fringe;
    const beside = !inFace && Math.abs(u) >= 6 && Math.abs(u) <= face.rx + 4 && y > face.cy - 8 && y < face.cy + 13 + ragged(x);
    if ((inMass && !inFace && y < face.cy) || overFace || beside) {
      // The glowing strand: from the crown, swept left along the fringe, then down beside the face.
      const strandX = y < face.cy - 2 ? face.cx - 2 - Math.round((y - (face.cy - 14)) * 0.55) : face.cx - face.rx - 2;
      if (y >= face.cy - 14 && (x === strandX || x === strandX + 1)) return x === strandX ? 'n' : 'N';
      return u > 2 && (x * 3 + y) % 7 === 0 ? 'k' : 'h';
    }
    if (inFace) {
      if (y === eyeY - 1 && x >= face.cx + 3 && x <= face.cx + 4) return 'e'; // heavy lid: half-lidded, unimpressed
      const mouthY = eyeY + 8;
      if (y === mouthY && x >= face.cx - 2 && x <= face.cx + 1) return 'e';
      if (y === mouthY && x === face.cx + 2) return 'M';
      if (y === mouthY - 1 && x === face.cx + 3) return 'e'; // the smirk
      const feature = y === mouthY ? null : features(x, y, face, false);
      return feature ?? skin(x, face.cx, face.rx);
    }
    // Neck, with a fungus-ink vine tattoo climbing it.
    if (y >= 32 && y <= 37 && x >= 20 && x <= 28) {
      if ((x === 26 && (y === 33 || y === 35)) || (x === 27 && y === 34) || (x === 25 && y === 36) || (x === 26 && y === 37)) return 'x';
      return skin(x, 24, 5);
    }
    return body(x, y, 36) ?? '.';
  });
})();

/**
 * The archivist: neat hair swept back and tied with the pale ribbon of the upper branches (a bow
 * showing behind), round spectacles catching the light, a high pale collar, a careful, uneasy look.
 */
export const ARCHIVIST_PORTRAIT: RowSprite = (() => {
  const face: Face = { cx: 24, cy: 22, rx: 9, ry: 12 };
  const eyeY = face.cy + 1;
  return draw((x, y) => {
    // The ribbon's bow and tails, behind the head on the left.
    if (inEllipse(x, y, 12, 13, 3, 2.2) || inEllipse(x, y, 12, 18, 2.2, 3)) return (x + y) % 3 === 0 ? 'b' : 'W';
    if ((x === 11 && y >= 20 && y <= 27) || (x === 10 && y >= 24 && y <= 31)) return 'W';
    // Neat hair, swept back from the brow.
    const inFace = inEllipse(x, y, face.cx, face.cy, face.rx, face.ry);
    if (inEllipse(x, y, face.cx, face.cy - 2, face.rx + 1.5, face.ry + 0.5) && (y < face.cy - 7 || (!inFace && y < face.cy + 2))) {
      return (x + y * 2) % 7 === 0 ? 'k' : 'h';
    }
    if (inFace) {
      // Round spectacles: rims round each eye, a glint on the lit lens, a bridge between.
      for (const ex of [face.cx - 3.5, face.cx + 3.5]) {
        const r = Math.hypot(x - ex, y - eyeY);
        if (r > 2.4 && r < 3.4) return 'o';
        if (ex > face.cx && x === Math.round(ex) + 1 && y === eyeY - 1) return 'q';
      }
      if (y === eyeY && x === face.cx) return 'o';
      if (y === eyeY - 5 && x >= face.cx - 2 && x <= face.cx + 2) return 'S'; // a worried line
      return features(x, y, face, true) ?? skin(x, face.cx, face.rx);
    }
    // A high pale collar up the neck.
    if (y >= 33 && y <= 38 && x >= 19 && x <= 29) return y <= 34 && x > 20 && x < 28 ? skin(x, 24, 5) : 'b';
    return body(x, y, 38) ?? '.';
  });
})();

/**
 * The boy in the lower roots: a sleazy fixer. A cap pushed back and tilted, scruffy hair poking out,
 * a narrow face, eyes squinting as he sizes you up, one brow cocked, a gap-toothed grin, bum fluff on
 * his chin, a knotted neckerchief.
 */
export const BOY_PORTRAIT: RowSprite = (() => {
  const face: Face = { cx: 24, cy: 24, rx: 8, ry: 11 };
  const eyeY = face.cy + 1;
  const mouthY = eyeY + 7;
  return draw((x, y) => {
    const u = x - face.cx;
    const inFace = inEllipse(x, y, face.cx, face.cy, face.rx, face.ry);
    // The cap: a round crown tilted back, and a brim jutting out to the right.
    if (y <= 15 && inEllipse(x, y, face.cx - 1, 13, 10, 6)) return y === 15 || (x + y) % 6 === 0 ? 'A' : 's';
    if (y >= 15 && y <= 16 && x >= face.cx - 2 && x <= face.cx + 14 - (y - 15) * 2) return y === 15 ? 'a' : 'A';
    // Scruffy hair poking out under the cap, at the sides.
    if (!inFace && y > 15 && y < face.cy + 3 && Math.abs(u) >= face.rx - 1 && Math.abs(u) <= face.rx + 2 && (x + y) % 3 !== 0) return 'h';
    if (inFace) {
      if (y <= 16) return 'h'; // hair under the brim
      // Squinting eyes: narrow slits. A cocked brow on the right.
      for (const ex of [face.cx - 4, face.cx + 2]) {
        if (y === eyeY && x >= ex && x <= ex + 2) return x === ex + 2 && ex > face.cx ? 'w' : 'e';
      }
      if (y === eyeY - 2 && x >= face.cx - 5 && x <= face.cx - 2) return 'h';
      if (y === eyeY - 3 && x >= face.cx + 2 && x <= face.cx + 5) return 'h';
      if (x === face.cx + 1 && y >= eyeY + 1 && y <= eyeY + 4) return 'S'; // nose
      // A lopsided, gap-toothed grin, higher on the right.
      if (y === mouthY && x >= face.cx - 3 && x <= face.cx + 4) return x === face.cx - 3 || x === face.cx + 4 || x === face.cx + 1 ? 'e' : 'w';
      if (y === mouthY + 1 && x >= face.cx - 2 && x <= face.cx + 3) return 'e';
      if (y === mouthY - 1 && x === face.cx + 5) return 'e';
      // Bum fluff on the chin.
      if (y > mouthY + 1 && (x + y) % 3 === 0) return 'S';
      return skin(x, face.cx, face.rx);
    }
    // A knotted neckerchief.
    if (y >= 34 && y <= 37 && Math.abs(x - 24) <= 6 + (y - 34)) return x >= 28 && x <= 30 && y >= 35 ? 'a' : (x + y) % 4 === 0 ? 'A' : 's';
    if (y >= 32 && y <= 34 && x >= 21 && x <= 27) return skin(x, 24, 4);
    return body(x, y, 37) ?? '.';
  });
})();

// --- Everyone else: one baseline bust, varied ---

/**
 * A face for anyone you speak to who isn't one of the main cast (designer: "a baseline with different
 * hair or items"). The clothes, headwear, hair colour, robe, stole, staff and bundle come from the same
 * `VillagerLook` as their sprite, so the face matches the figure on screen; the rest is the face itself.
 */
export interface NpcFace {
  /** Face shape: narrow (thin, long), plain, round or broad. */
  build?: 'narrow' | 'plain' | 'round' | 'broad' | 'heavy';
  /** Hair on a bare head (under a cap only the sides show; a hood hides it; a bun look always has a bun). */
  hair?: 'cropped' | 'long' | 'bun' | 'balding' | 'messy' | 'shaven';
  /** Hair colour, if not the look's. */
  hairColour?: number;
  /** 0 young, 1 middle-aged (a line on the brow), 2 old (lines, sunken cheeks). */
  age?: 0 | 1 | 2;
  beard?: 'stubble' | 'moustache' | 'full' | 'long';
  brow?: 'plain' | 'heavy' | 'knit' | 'raised';
  eyes?: 'plain' | 'narrow' | 'wide' | 'tired' | 'hollow';
  mouth?: 'flat' | 'frown' | 'smile' | 'grin' | 'sneer' | 'open';
  items?: ('beads' | 'pipe' | 'token' | 'spectacles' | 'scarf' | 'earring' | 'apron' | 'goggles' | 'scar' | 'bare')[];
  /** Skin in the borderland's daylight (Chapter 2); default the tree's (Act 1). */
  skin?: 'fair' | 'tan' | 'dark';
}

/** A darker shade of each clothing colour, for folds and shadow. */
const DARKER: Record<number, number> = {
  [SHADES.amber]: SHADES.amberDeep,
  [SHADES.amberDeep]: SHADES.woodLight,
  [SHADES.cyanMid]: SHADES.cyanDeep,
  [SHADES.cyanDeep]: SHADES.deep,
  [SHADES.greenMid]: SHADES.greenDeep,
  [SHADES.greenDeep]: SHADES.deep,
  [SHADES.light]: SHADES.dim,
  [SHADES.dim]: SHADES.woodPale,
  [SHADES.woodPale]: SHADES.woodLight,
  [SHADES.woodLight]: SHADES.deep,
};
const darker = (c: number) => DARKER[c] ?? SHADES.deep;

const BUILDS: Record<NonNullable<NpcFace['build']>, [rx: number, ry: number]> = { narrow: [7, 12], plain: [9, 12], round: [10, 11], broad: [10, 12], heavy: [12, 12] };

/**
 * The pixel picker for one NPC bust centred at (cx, cy), or '.' where it's empty. Shared by
 * `npcPortrait` and the crowd's group portrait, which packs several smaller ones into the frame.
 */
function npcPick(look: VillagerLook, o: NpcFace, cx: number, cy: number, scale = 1): Pick {
  const [brx, bry] = BUILDS[o.build ?? 'plain'];
  const f: Face = { cx, cy, rx: Math.round(brx * scale), ry: Math.round(bry * scale) };
  const age = o.age ?? 0;
  const eyeY = f.cy + 1;
  const mouthY = eyeY + Math.round(f.ry * 0.65);
  const items = new Set(o.items ?? []);
  const hairStyle = look.head === 'bun' ? 'bun' : (o.hair ?? 'cropped');
  const hood = look.head === 'hood';
  const cap = look.head === 'cap';
  const helmet = look.head === 'helmet';
  const top = f.cy + f.ry + 2; // shoulders
  const browKind = o.brow ?? 'plain';
  const eyes = o.eyes ?? 'plain';

  const inFace = (x: number, y: number) => inEllipse(x, y, f.cx, f.cy, f.rx, f.ry);

  const beard = (x: number, y: number): string | null => {
    const u = x - f.cx;
    switch (o.beard) {
      case 'stubble':
        return inFace(x, y) && y >= mouthY - 1 && (x + y) % 2 === 0 && !(y === mouthY && Math.abs(u) <= 2) ? (u < -3 ? 'E' : 'S') : null;
      case 'moustache':
        return y === mouthY - 1 && u >= -3 && u <= 3 ? 'h' : null;
      case 'full':
        if (y === mouthY && Math.abs(u) <= 2) return null;
        if ((inFace(x, y) && y >= mouthY - 2 && Math.abs(u) >= (y < mouthY + 1 ? 3 : 0)) || (y > f.cy && inEllipse(x, y, f.cx, f.cy + 2, f.rx, f.ry + 2) && !inFace(x, y)))
          return (x * 3 + y) % 13 === 0 ? 'k' : 'h';
        if (inFace(x, y) && y >= eyeY + 4 && Math.abs(u) >= f.rx - 2) return 'h'; // up the jaw to the ears
        return null;
      case 'long': {
        if (y === mouthY && Math.abs(u) <= 2) return null;
        const half = y < top + 2 ? f.rx - 2 - Math.max(0, (y - mouthY) * 0.15) : Math.max(0, f.rx - 2 - (y - top) * 0.7);
        if ((y >= mouthY - 1 && Math.abs(u) <= half && (inFace(x, y) || y > f.cy)) || (inFace(x, y) && y >= eyeY + 3 && Math.abs(u) >= f.rx - 2))
          return (x * 3 + y) % 7 === 0 ? 'k' : 'h';
        return null;
      }
      default:
        return null;
    }
  };

  const featureAt = (x: number, y: number): string | null => {
    const u = x - f.cx;
    for (const ex of [f.cx - 4, f.cx + 3]) {
      const lit = ex > f.cx;
      const inner = lit ? ex - 1 : ex + 2; // the brow's end nearest the nose
      // Eyes.
      if (y === eyeY && (x === ex || x === ex + 1)) return eyes !== 'narrow' && lit && x === ex + 1 ? 'w' : 'e';
      if (eyes === 'wide' && y === eyeY - 1 && x === ex + (lit ? 0 : 1)) return 'e';
      if ((eyes === 'tired' || eyes === 'hollow') && y === eyeY + 1 && (x === ex || x === ex + 1)) return eyes === 'hollow' ? 'E' : 'S';
      if (eyes === 'hollow' && y === eyeY - 1 && (x === ex - 1 || x === ex + 2)) return 'S';
      // Brows.
      const inBrow = x >= ex - 1 && x <= ex + 2;
      if (browKind === 'plain' && y === eyeY - 2 && inBrow) return 'h';
      if (browKind === 'heavy' && (y === eyeY - 2 || y === eyeY - 3) && inBrow && !(y === eyeY - 3 && x === ex + (lit ? 2 : -1))) return 'h';
      if (browKind === 'knit' && inBrow && y === (x === inner || x === inner + (lit ? 1 : -1) ? eyeY - 2 : eyeY - 3)) return 'h';
      if (browKind === 'raised' && inBrow && y === (x === ex || x === ex + 1 ? eyeY - 4 : eyeY - 3)) return 'h';
    }
    // Nose.
    if (x === f.cx + 1 && y >= eyeY + 1 && y < mouthY - 3) return 'S';
    if (y === mouthY - 3 && x === f.cx + 2) return 'S';
    // Mouth.
    switch (o.mouth ?? 'flat') {
      case 'flat':
        if (y === mouthY && Math.abs(u) <= 2) return 'e';
        break;
      case 'frown':
        if (y === mouthY && Math.abs(u) <= 1) return 'e';
        if (y === mouthY + 1 && Math.abs(u) === 2) return 'e';
        break;
      case 'smile':
        if (y === mouthY && Math.abs(u) <= 1) return 'e';
        if (y === mouthY - 1 && Math.abs(u) === 2) return 'e';
        break;
      case 'grin': // too many teeth
        if (y === mouthY && Math.abs(u) <= 3) return Math.abs(u) === 3 ? 'e' : 'w';
        if (y === mouthY - 1 && Math.abs(u) === 4) return 'e';
        if (y === mouthY + 1 && Math.abs(u) <= 2) return 'e';
        break;
      case 'sneer':
        if (y === mouthY && u >= -2 && u <= 1) return 'e';
        if (y === mouthY - 1 && u === 2) return 'e';
        break;
      case 'open': // shouting
        if ((y === mouthY || y === mouthY + 1) && Math.abs(u) <= 1) return 'e';
        if (y === mouthY - 1 && Math.abs(u) <= 1) return 'S';
        break;
    }
    // Age.
    if (age >= 1 && y === f.cy - 5 && Math.abs(u) <= 2) return 'S';
    if (age >= 2) {
      if (y === f.cy - 6 && Math.abs(u) <= 1) return 'S';
      if ((x === f.cx - 5 || x === f.cx + 5) && y >= mouthY - 3 && y <= mouthY - 1) return 'S'; // lines from the nose
      if (x <= f.cx - 5 && y >= eyeY + 2 && y <= eyeY + 4 && x > f.cx - f.rx + 1) return 'E'; // sunken cheek
    }
    return null;
  };

  return (x, y) => {
    const u = x - f.cx;
    // A guard's staff, held up at the right edge.
    if (look.staff && (x === f.cx + 17 || x === f.cx + 18) && y >= 2) return y < 6 ? 't' : x === f.cx + 18 ? 'f' : 'w';
    // A pipe from the corner of the mouth.
    if (items.has('pipe')) {
      if (y === mouthY && u >= 3 && u <= 8) return 'u';
      if (u >= 8 && u <= 10 && y >= mouthY - 3 && y <= mouthY) return y === mouthY - 3 ? 'o' : x === f.cx + 10 ? 'U' : 'u';
    }
    // Goggles pushed up on the forehead: two round lenses on a strap, one catching the light.
    if (items.has('goggles')) {
      const gy = f.cy - f.ry + 4;
      for (const ex of [f.cx - 4, f.cx + 4]) {
        const r = Math.hypot(x - ex, (y - gy) * 1.2);
        if (r < 2.2) return ex > f.cx && r < 1.2 ? 'Q' : 'q';
        if (r < 3.2) return 'o';
      }
      if (y === gy && Math.abs(u) <= f.rx + 1) return 'o';
    }
    // A scar across the cheek, on the lit side.
    if (items.has('scar') && inFace(x, y) && u >= 2 && u <= 6 && y === eyeY + 1 + (u - 2)) return 'E';
    // Spectacles.
    if (items.has('spectacles') && inFace(x, y)) {
      for (const ex of [f.cx - 3.5, f.cx + 3.5]) {
        const r = Math.hypot(x - ex, y - eyeY);
        if (r > 2.4 && r < 3.4) return 'o';
      }
      if (y === eyeY && x === f.cx) return 'o';
    }
    // An earring on the lit side.
    if (items.has('earring') && x === f.cx + f.rx && (y === eyeY + 2 || y === eyeY + 3)) return y === eyeY + 3 ? 'p' : 'o';
    // A cap, in the clothes' accent colour, the brim jutting out to the right.
    if (cap) {
      const capBase = f.cy - f.ry + 5;
      if (y <= capBase && inEllipse(x, y, f.cx - 1, capBase - 1, f.rx + 1.5, 6)) return y === capBase || (x + y) % 6 === 0 ? 'Z' : 'z';
      if (y === capBase + 1 && x >= f.cx - 2 && x <= f.cx + f.rx + 5) return 'Z';
    }
    // A guard's formal hat: a tall, flat-topped crown, a band of the accent colour with a pale badge,
    // and a stiff peak casting a shadow over the brow.
    if (helmet) {
      const hatTop = f.cy - f.ry - 5;
      const bandTop = f.cy - f.ry + 2;
      const peak = bandTop + 2;
      const half = f.rx + 1 + (y < hatTop + 2 ? 1 : 0); // flared at the top
      if (y >= hatTop && y < peak && Math.abs(u) <= half) {
        if (Math.abs(u - 1) + Math.abs(y - (bandTop - 1)) <= 2) return Math.abs(u - 1) + Math.abs(y - (bandTop - 1)) <= 1 ? 'b' : 'B'; // the badge
        if (y >= bandTop) return y === bandTop ? 'z' : 'Z';
        if (y === hatTop) return 'o';
        if (u === half) return 'X';
        if (u === -half) return 'o';
        return 'T';
      }
      if (y === peak && u >= -f.rx - 1 && u <= f.rx + 3) return u > f.rx - 2 ? 'X' : 'o';
      if (y === peak + 1 && inFace(x, y)) return 'E'; // the peak's shadow
    }
    // A hood round the face, falling to the shoulders.
    if (hood) {
      const outer = inEllipse(x, y, f.cx, f.cy, f.rx + 5, f.ry + 5) || (y > f.cy + 6 && Math.abs(u) <= f.rx - 1 + (y - f.cy - 6) * 1.5);
      if (outer && !inFace(x, y) && y < top + 3) {
        if (!inEllipse(x, y, f.cx, f.cy, f.rx + 4, f.ry + 4) && y <= f.cy + 6) return u > 0 ? 'J' : 'o';
        return u > f.rx + 1 ? 'J' : 'K';
      }
    }
    // Hair.
    if (!hood && hairStyle !== 'shaven') {
      const crown = inEllipse(x, y, f.cx, f.cy - 2, f.rx + 1.5, f.ry + 0.5);
      const sides = !inFace(x, y) && Math.abs(u) >= f.rx - 1 && y < f.cy + 1;
      let hair = false;
      if (helmet) hair = sides && Math.abs(u) <= f.rx + 1 && y > f.cy - f.ry + 5 && (x + y) % 3 !== 0;
      else if (cap) hair = sides && Math.abs(u) <= f.rx + 1 && y > f.cy - f.ry + 6 && (x + y) % 3 !== 0;
      else if (hairStyle === 'balding') hair = !inFace(x, y) ? crown && Math.abs(u) >= f.rx - 1 && y > f.cy - 7 : Math.abs(u) >= f.rx - 2 && y > f.cy - 6 && y < f.cy - 1;
      else if (hairStyle === 'messy') hair = crown && (y < f.cy - 6 + ((x * 7) % 5 === 0 ? 2 : (x * 3) % 4 === 0 ? 1 : 0) || sides);
      else hair = crown && (y < f.cy - 6 || sides);
      if (hairStyle === 'long' && !inFace(x, y) && Math.abs(u) >= f.rx - 1 && Math.abs(u) <= f.rx + 2 && y >= f.cy - 4 && y <= top + 4) hair = true;
      if (hairStyle === 'bun' && inEllipse(x, y, f.cx - 1, f.cy - f.ry - 1, 4.5, 3.5)) hair = true;
      if (hair) return u > 1 && (x + y) % 5 === 0 ? 'k' : 'h';
    }
    // A heavy face: jowls and a second chin under the first.
    if (o.build === 'heavy' && !inFace(x, y) && inEllipse(x, y, f.cx, f.cy + f.ry, f.rx - 1, 4) && y > f.cy + 4) {
      if (y === f.cy + f.ry + 1 && Math.abs(u) <= 6) return 'E'; // the fold under the second chin
      return u < -5 ? 'E' : u > 3 ? 'M' : 'S';
    }
    if (inFace(x, y)) {
      const b = beard(x, y);
      if (b) return b;
      if (o.build === 'heavy' && y === f.cy + f.ry - 3 && Math.abs(u) <= 5 && !featureAt(x, y)) return 'S'; // the fold of the chin
      const feature = featureAt(x, y);
      if (feature) return feature;
      if (hood && y < f.cy - f.ry + 4) return u > f.rx - 3 ? 'S' : 'E'; // in the hood's shadow
      return skin(x, f.cx, f.rx);
    }
    const b = beard(x, y);
    if (b) return b;
    // Neck: a scarf, beads or a token on a cord.
    const neckTop = f.cy + f.ry - 2;
    if (y >= neckTop && y < top + 1 && Math.abs(u) <= 4) {
      if (items.has('scarf') && y >= top - 2) return (x + y) % 3 === 0 ? 'Z' : 'z';
      return skin(x, f.cx, 5);
    }
    if (items.has('beads') && y >= top && y <= top + 4 && Math.abs(u) === 5 - (y - top) && (x + y) % 2 === 0) return y % 4 === 0 ? 'q' : 'n';
    if (items.has('token')) {
      if (inEllipse(x, y, f.cx, top + 5, 1.6, 1.6)) return x >= f.cx && y <= top + 5 ? 'Q' : 'q';
      for (const side of [-1, 1]) if (y >= top && y <= top + 3 && x === f.cx + side * (4 - Math.round((y - top) * 0.7))) return 'E';
    }
    // Shoulders and chest: the look's clothes, its accent band, a stole, a bundle's strap, an apron.
    if (y >= top) {
      const spread = Math.round(((o.build === 'heavy' ? 13 : 8) + (y - top) * (o.build === 'heavy' ? 2.2 : 1.6)) * scale);
      if (Math.abs(u) > spread) return '.';
      // Bare shoulders and a low neckline, thin straps (the brothel's hostesses).
      if (items.has('bare') && y < top + 6) {
        if (Math.abs(u) === 4 || Math.abs(u) === 5) return 'R';
        if (y >= top + 4 && Math.abs(u) <= 3) return 'R';
        return skin(x, f.cx, spread);
      }
      if (Math.abs(u) > spread - 1) return u > 0 ? 'F' : 'o';
      if (look.stole && u >= 3 && u <= 5) return u === 5 ? 'B' : 'b';
      if (look.bundle && Math.abs(u - (y - top - 6)) <= 0) return 'u';
      if (items.has('apron') && y >= top + 5 && Math.abs(u) <= 6) return Math.abs(u) === 6 ? 'o' : 'P';
      if (y === top + 3 || y === top + 4) return y === top + 4 ? 'Z' : 'z';
      if ((x + Math.floor(y / 3)) % 9 === 0 && y > top + 5) return 'F';
      return 'R';
    }
    return '.';
  };
}

/** Skin in the borderland's daylight: the four bands of the face (lit, mid, shade, edge). */
const DAYLIT_SKIN: Record<NonNullable<NpcFace['skin']>, Record<'L' | 'M' | 'S' | 'E', number>> = {
  fair: { L: SHADES.skinFair, M: SHADES.skinFairShade, S: SHADES.skinTanShade, E: SHADES.woodPale },
  tan: { L: SHADES.skinTan, M: SHADES.skinTanShade, S: SHADES.skinDark, E: SHADES.woodLight },
  dark: { L: SHADES.skinTanShade, M: SHADES.skinDark, S: SHADES.skinDarkShade, E: SHADES.deep },
};

const npcColours = (look: VillagerLook, o: NpcFace) => {
  const hair = o.hairColour ?? look.hair ?? SHADES.shadow;
  const robe = look.robe ?? SHADES.deep;
  const hoodColour = look.robe ?? SHADES.woodLight;
  return {
    ...COLOURS,
    h: hair,
    k: hair === SHADES.shadow ? SHADES.woodLight : hair === SHADES.light ? SHADES.white : hair === SHADES.amberDeep ? SHADES.amber : SHADES.light,
    R: robe,
    F: robe === SHADES.deep ? SHADES.wood : look.robe === SHADES.dim ? SHADES.light : SHADES.woodPale,
    z: look.accent,
    Z: darker(look.accent),
    T: SHADES.woodLight, // a guard's hat
    X: SHADES.dim,
    K: hoodColour,
    J: hoodColour === SHADES.woodLight ? SHADES.wood : SHADES.woodPale,
    u: SHADES.amberDeep,
    U: SHADES.amber,
    P: SHADES.woodPale,
    ...(o.skin ? DAYLIT_SKIN[o.skin] : {}),
  };
};

/** A face for an NPC, drawn from their sprite's look plus a few face settings. */
export function npcPortrait(look: VillagerLook, face: NpcFace = {}): RowSprite {
  const pick = npcPick(look, face, 24, face.build === 'narrow' ? 21 : 22);
  const rows = Array.from({ length: PORTRAIT_SIZE }, (_, y) => Array.from({ length: PORTRAIT_SIZE }, (_, x) => pick(x, y)).join(''));
  return { rows, colours: npcColours(look, face) };
}

/** "The crowd", all at once: three heads crammed into the frame, shouting; the two at the back in shadow. */
export const CROWD_PORTRAIT: RowSprite = (() => {
  const front = npcPick(VILLAGER_LOOKS[4]!, { hair: 'messy', mouth: 'open', brow: 'knit' }, 24, 28, 0.85);
  const back = [
    npcPick(VILLAGER_LOOKS[0]!, { build: 'round', mouth: 'open' }, 11, 17, 0.7),
    npcPick(VILLAGER_LOOKS[1]!, { mouth: 'open', brow: 'knit', hair: 'long' }, 37, 15, 0.7),
  ];
  const SHADOWED: Record<string, string> = { L: 'S', M: 'S', S: 'E', w: 'e', k: 'h', z: 'V', Z: 'V', R: 'c', F: 'f', J: 'K', t: 'S' };
  const rows = Array.from({ length: PORTRAIT_SIZE }, (_, y) =>
    Array.from({ length: PORTRAIT_SIZE }, (_, x) => {
      const near = front(x, y);
      if (near !== '.') return near;
      for (const head of back) {
        const c = head(x, y);
        if (c !== '.') return SHADOWED[c] ?? c;
      }
      return '.';
    }).join(''),
  );
  return { rows, colours: { ...npcColours(VILLAGER_LOOKS[4]!, {}), V: SHADES.greenDeep } };
})();

/**
 * The prince, Chapter 3's protagonist (designer: young and attractive, a shaved head with dark hair cut
 * very short; not balding, not old; tan skin, Claude's choice). Drawn by hand like the scavenger: a strong
 * young face, a squarer jaw, straight dark brows, dark eyes; the crop a dark shadow over the crown with a
 * clean hairline, the light catching it on his right; the high wine collar of his dark coat, gold down
 * its front.
 */
export const PRINCE_PORTRAIT: RowSprite = (() => {
  const cx = 24;
  const cy = 21;
  const eyeY = cy;
  /** Half the head's width at row y: round over the crown, a squarer jaw, a firm chin. */
  const halfWidth = (y: number) => {
    const t = (y - cy - 0.5) / 12;
    if (t < -1 || t > 0.95) return -1;
    if (t <= 0) return 8.4 * Math.cbrt(1 - Math.abs(t) ** 3); // a broad, rounded crown
    return 8.4 * (1 - Math.max(0, t - 0.45) ** 1.6 * 1.9);
  };
  const inHead = (x: number, y: number) => Math.abs(x - cx + 0.5) <= halfWidth(y);
  /** Tan skin, lit from the right, shaded towards the left. */
  const tan = (x: number, centre: number, half: number) => ((x - centre + 0.5) / Math.max(1, half) < -0.55 ? 'U' : 'K');
  /** The hairline: straight across the forehead, squared at the temples, down to the tops of the ears. */
  const hairline = (x: number) => (Math.abs(x - cx + 0.5) > 6 ? eyeY - 2 : cy - 5);
  return draw((x, y) => {
    const u = x - cx;
    if (inHead(x, y)) {
      // The crop: dark hair cut very short over the whole crown, a clean edge at the hairline (skin just
      // showing through along it), the light catching it on his right.
      if (y < hairline(x)) {
        if (y === hairline(x) - 1 && (x + y) % 2 === 0) return 'U';
        // Dark brown-grey so it reads against a dark background, shaded on his left, a sheen and a lit
        // edge where the light catches the crown.
        const edge = !inHead(x, y - 1) || !inHead(x + 1, y);
        if (edge && u >= -2) return 'S';
        if (u > 1 && y < cy - 7 && (x + y) % 2 === 0) return 'S';
        return u < -4 ? 'D' : 'E';
      }
      // Brows: straight, dark, one row, a little apart from the eye.
      for (const bx of [cx - 6, cx + 1]) {
        const lx = x - bx;
        if (y === eyeY - 3 && lx >= 0 && lx <= 4) return 'D';
      }
      // Eyes: an upper lid, a dark iris, a glint.
      for (const ex of [cx - 5, cx + 1]) {
        const lx = x - ex;
        if (y === eyeY - 1 && lx >= 1 && lx <= 3) return 'e';
        if (y === eyeY && lx >= 1 && lx <= 2) return lx === 2 && ex > cx ? 'w' : 'e';
      }
      // The nose: a shadow down its left side, the nostril.
      if (x === cx - 1 && y >= eyeY + 1 && y <= eyeY + 4) return 'U';
      if (y === eyeY + 5 && (x === cx - 2 || x === cx)) return 'U';
      // The mouth: a firm line, the lower lip's shadow.
      if (y === eyeY + 8 && x >= cx - 3 && x <= cx + 2) return 'U';
      if (y === eyeY + 9 && x >= cx - 1 && x <= cx) return 'A';
      // The jaw's shadow on his left, under the cheekbone.
      if (u < -4 && y >= eyeY + 3 && y <= eyeY + 9) return 'U';
      return tan(x, cx, halfWidth(y));
    }
    // Ears.
    if ((x === cx - 9 || x === cx + 8) && y >= eyeY - 1 && y <= eyeY + 3) return x < cx ? 'U' : 'K';
    // The neck, into the high collar.
    if (y >= 32 && y <= 35 && x >= 20 && x <= 28) return x < 22 ? 'U' : 'K';
    if (y >= 34 && y <= 39 && x >= 18 && x <= 30) {
      if (y === 34 && (x === 18 || x === 30)) return '.';
      return y === 34 ? 'a' : x < 21 ? 'X' : 'R';
    }
    // Shoulders and chest: the dark coat, gold down its front.
    if (y >= 38) {
      const spread = 8 + (y - 38) * 2.2;
      const dx = x - 24;
      if (Math.abs(dx) > spread) return '.';
      if (dx === 0 || dx === 1) return 'a';
      if (dx < -spread + 2) return 'c';
      return dx < -4 ? 'c' : 'C';
    }
    return '.';
  });
})();

/** The guards share the guard's look (cap, amber band, staff); their faces tell them apart. */
const guardFace = (face: NpcFace) => npcPortrait(GUARD_LOOK, face);
/** The elders share one face (designer), told apart by their robes. */
const ELDER_FACE: NpcFace = { hair: 'balding', age: 2, brow: 'heavy', eyes: 'tired', mouth: 'frown', beard: 'full' };
/** The hatch keeper, behind the ration hatch: never seen in full. */
const HATCH_KEEPER_LOOK: VillagerLook = { height: 24, width: 3, head: 'cap', accent: SHADES.woodPale };

/**
 * The scavenger, Chapter 2's protagonist (designer: slim, ginger, long hair in a ponytail, a satchel,
 * fairly pale with freckles, a crop top; and beautiful). Drawn by hand rather than from the shared face
 * shading, which bands faces hard: soft pale skin shaded only at its edge, a fine oval face and chin,
 * almond eyes with lashes and teal-green irises, thin arched brows, a small nose, fuller lips with the
 * hint of a smile, light freckles. Ginger hair with a side-swept fringe framing her face, the ponytail
 * falling forward over her left shoulder; a teal crop top on thin straps, the satchel's strap across her.
 * (Designer: a Karen Gillan type: fair skin (not too pale), a longer face with high cheekbones, big eyes, long
 * straight copper hair. A type, not a likeness.)
 */
export const SCAVENGER_PORTRAIT: RowSprite = (() => {
  const cx = 24;
  const cy = 20;
  const eyeY = cy; // halfway down the head
  /** Half the face's width at row y: an oval that narrows to a fine chin. */
  const halfWidth = (y: number) => {
    const t = (y - cy - 0.5) / 11;
    if (Math.abs(t) > 1) return -1;
    const oval = 7.4 * Math.sqrt(1 - t * t);
    return t > 0 ? oval * (1 - t * 0.22) : oval; // a longer face, narrowing to a fine chin
  };
  const inFace = (x: number, y: number) => Math.abs(x - cx + 0.5) <= halfWidth(y);
  /** Fair skin, warm (designer: not too pale), shaded softly towards its left edge. */
  const softSkin = (x: number, centre: number, half: number) => {
    const u = (x - centre + 0.5) / Math.max(1, half);
    if (u < -0.9) return 'M';
    if (u < -0.68) return 'l';
    return 'i';
  };
  /** Copper: amber with straight strands of the protagonist's red running down it, deep amber in shadow. */
  const hair = (x: number, y: number, shadow: boolean) => {
    if (shadow) return 'j';
    // Copper, lit amber on the crown and her right, deep copper strands running down in long waves.
    if ((x + Math.round(Math.sin(y / 6) * 1.5)) % 6 === 0) return 'j';
    if ((x - cx > 2 && (x + Math.floor(y / 3)) % 3 === 0) || (y < cy - 11 && x > cx - 4)) return 'Y';
    return 'z';
  };
  return draw((x, y) => {
    const u = x - cx;
    // The ponytail, over her left shoulder: from behind her ear, down onto her chest, tapering.
    const tailX = 12 + Math.round(Math.sin((y - 20) / 8) * 1.5);
    const tailW = y < 34 ? 4 : y < 42 ? 3 : 2;
    if (y >= 20 && y <= 46 && x >= tailX && x < tailX + tailW && !inFace(x, y)) return hair(x, y, x === tailX || y > 43);
    // The crown: a smooth rounded mass, lit on the right.
    const crown = ((x - cx + 0.5) / 10) ** 2 + ((y - (cy - 3)) / 12) ** 2 <= 1 && y < cy - 4;
    // The fringe, side-swept from her right down to her left temple.
    const fringeLine = cy - 6 + Math.max(0, Math.round((-u - 1) * 0.45));
    const fringe = inFace(x, y) && y < fringeLine;
    // Locks falling beside her face to the jaw, a little wider at the bottom.
    const lockL = x >= cx - 10 && x <= cx - 6 && y >= cy - 6 && y <= cy + 12 && !inFace(x, y);
    const lockR = x >= cx + 6 && x <= cx + 9 && y >= cy - 6 && y <= cy + 13 && !inFace(x, y);
    if (crown || fringe || lockL || lockR) return hair(x, y, lockL || (crown && u < -6));
    if (inFace(x, y)) {
      // Brows: thin, ginger, the inner ends a shade darker.
      for (const bx of [cx - 5, cx + 1]) {
        const lx = x - bx;
        if (lx >= 0 && lx <= 3 && y === eyeY - 2) return lx === (bx < cx ? 3 : 0) ? 'j' : 'z';
        if (y === eyeY - 2 && lx === (bx < cx ? -1 : 4)) return 'z'; // tapering out past the eye
      }
      // Eyes: almond, an upper lid with a lash flicked out at the corner, a teal-green iris, a glint.
      for (const ex of [cx - 5, cx + 1]) {
        const lx = x - ex;
        if (y === eyeY - 1 && lx === (ex < cx ? -1 : 4)) return 'e'; // the lash
        if (y === eyeY - 1 && lx >= 0 && lx <= 3) return 'e'; // the upper lid
        if (y === eyeY && lx >= 0 && lx <= 3) return lx === 0 || lx === 3 ? (lx === 3 && ex > cx ? 'w' : 'v') : lx === 1 ? 'e' : 'V';
        if (y === eyeY + 1 && (lx === 1 || lx === 2)) return 'v';
      }
      // A small nose: a soft shadow down one side, the nostril.
      if (y === eyeY + 4 && x === cx - 1) return 'l'; // just the shadow under the tip
      // Lips: fuller, a soft bow on top, the hint of a smile at the corners.
      const mouthY = eyeY + 7;
      if (y === mouthY && x >= cx - 2 && x <= cx + 1) return 'A';
      if (y === mouthY + 1 && (x === cx - 1 || x === cx)) return 'A'; // the lower lip
      // Freckles: a few, across the bridge of her nose.
      const freckles: [number, number][] = [[-3, 2], [-2, 3], [1, 3], [2, 2]];
      if (freckles.some(([fx, fy]) => x === cx + fx && y === eyeY + fy)) return 'l';
      return softSkin(x, cx, halfWidth(y));
    }
    // Her neck: slender, a soft shadow under the jaw.
    if (y >= 31 && y <= 37 && x >= 22 && x <= 26) return y === 31 && x < 25 ? 'l' : softSkin(x, 24, 3);
    // Shoulders and chest: bare shoulders, the crop top on thin straps, the satchel's strap across.
    if (y >= 36) {
      const spread = 6 + (y - 36) * 1.9;
      const dx = x - 24;
      if (Math.abs(dx) > spread) return '.';
      const strap = Math.round(32 - (y - 36) * 1.5);
      if (x === strap || x === strap + 1) return x === strap ? 'y' : 'A';
      if (y >= 42) return dx < -4 ? 'V' : 'v';
      if ((x === 20 || x === 28) && y >= 38) return 'v'; // the top's straps
      return softSkin(x, 24, spread);
    }
    return '.';
  });
})();

/** A borderland person's portrait, from their sprite's look plus face settings (Chapter 2: daylit skin, hair, headwear, clothes). */
function folkPortrait(look: FolkLook, face: NpcFace = {}): RowSprite {
  const head: VillagerLook['head'] = look.head === 'cap' ? 'cap' : look.head === 'hood' || look.head === 'wrap' ? 'hood' : look.hairStyle === 'bun' ? 'bun' : 'bare';
  const hair: NpcFace['hair'] = { short: 'cropped', long: 'long', tail: 'long', bald: 'shaven', bun: 'bun', crest: 'cropped', messy: 'messy' }[look.hairStyle] as NpcFace['hair'];
  const villagerLook: VillagerLook = { height: look.height, width: look.width, head, accent: look.scarf ?? look.top, robe: look.top, hair: look.hair, bundle: !!look.pack, long: look.topStyle === 'long' };
  const items = [...(face.items ?? []), ...(look.topStyle === 'short' || look.topStyle === 'crop' ? (['bare'] as const) : []), ...(look.head === 'goggles' ? (['goggles'] as const) : []), ...(look.trinket ? (['token'] as const) : []), ...(look.apron !== undefined ? (['apron'] as const) : [])];
  return npcPortrait(villagerLook, { hair, skin: look.skin, ...face, items });
}

/**
 * Portraits by the speaker id used in ink tags (`#speaker:mum`), with the name shown above the line. A
 * `#name:` tag on the same line overrides the name (the escort is "The guard" until he's "Your escort").
 */
/**
 * The dog (Chapter 2): its head and shoulders, three-quarter on, ears up, a pale scruffy coat with a darker
 * saddle over the head, a pale muzzle, a dark nose, bright eyes. Drawn like its sprite (pale, outlined).
 */
export const DOG_PORTRAIT: RowSprite = (() => {
  const W = 48;
  const g = Array.from({ length: W }, () => Array.from({ length: W }, () => '.'));
  const put = (x: number, y: number, c: string) => {
    if (y >= 0 && y < W && x >= 0 && x < W) g[Math.round(y)]![Math.round(x)] = c;
  };
  const disc = (cx: number, cy: number, rx: number, ry: number, c: string) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) if (((x - cx) / (rx + 0.3)) ** 2 + ((y - cy) / (ry + 0.3)) ** 2 <= 1) put(x, y, c);
  };
  const tri = (a: [number, number], b: [number, number], c: [number, number], col: string) => {
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      const s = (p: [number, number], q: [number, number]) => (q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0]);
      const [d1, d2, d3] = [s(a, b), s(b, c), s(c, a)];
      if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) put(x, y, col);
    }
  };
  // Shoulders and neck, fluffy at the edges (designer: cuter).
  for (let y = 34; y < W; y++) {
    const half = 10 + (y - 34) * 0.9;
    for (let x = Math.round(24 - half); x <= Math.round(24 + half); x++) put(x, y, x < 24 - half + 3 ? 's' : 'f');
  }
  // One ear up (soft, rounded at the tip), the other flopped over.
  tri([12, 20], [13, 6], [21, 15], 'E');
  disc(13.5, 8, 1.6, 1.6, 'E');
  tri([14, 17], [14.5, 10], [19, 15], 'e');
  disc(36, 16, 5, 6, 'E');
  disc(37, 18, 3, 3.5, 'e');
  // A round head, the cheeks fluffing out.
  disc(24, 25, 13, 12, 'f');
  disc(12.5, 31, 4, 4, 'f');
  disc(35.5, 31, 4, 4, 'f');
  // The darker patch on top, and the white blaze down the middle to the muzzle.
  disc(24, 14.5, 4.5, 2.2, 'S');
  for (let y = 15; y < 29; y++) for (let dx = -1; dx <= 1; dx++) put(24 + dx, y, y < 18 && dx !== 0 ? 'S' : 'm');
  // Shaded down its left side.
  for (let y = 14; y < 36; y++) for (let x = 0; x < 15; x++) if (g[y]![x] === 'f') g[y]![x] = 's';
  // A small round muzzle, a button nose, a little smile.
  disc(24, 32, 6.5, 4.2, 'm');
  disc(24, 29.4, 2.4, 1.6, 'n');
  put(25, 29, 'W');
  for (const [x, y] of [[21, 33], [22, 34], [23, 34], [24, 33], [25, 34], [26, 34], [27, 33]] as const) put(x, y, 's');
  // Big round eyes, each with a glint.
  for (const ex of [17, 31]) {
    disc(ex, 24, 2.6, 2.8, 'o');
    put(ex + 1, 23, 'W');
    put(ex + 1, 22, 'W');
    put(ex - 1, 26, 'g');
  }
  // A dark outline round all of it.
  const filled = (x: number, y: number) => (g[y]?.[x] ?? '.') !== '.' && g[y]![x] !== 'x';
  const marks: [number, number][] = [];
  g.forEach((row, y) => row.forEach((v, x) => { if (v === '.' && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))) marks.push([x, y]); }));
  for (const [x, y] of marks) g[y]![x] = 'x';
  return {
    rows: g.map((r) => r.join('')),
    colours: { f: SHADES.light, s: SHADES.dim, S: SHADES.woodPale, m: SHADES.white, n: SHADES.shadow, E: SHADES.woodPale, e: SHADES.woodLight, o: SHADES.shadow, W: SHADES.white, g: SHADES.woodLight, x: SHADES.shadow },
  };
})();

/** A group of the canopy's background people as speakers, one per look: `c4_<group>_<look>` (Chapter 4). */
function canopyGroup(group: string, looks: CapitalLook[], names: string[], faces: CourtFace[], voices: VoiceId[]): Record<string, { name: string; portrait: RowSprite; voice: VoiceId }> {
  return Object.fromEntries(looks.map((look, i) => [`c4_${group}_${i}`, { name: names[i % names.length]!, portrait: capitalPortrait(look, faces[i % faces.length]), voice: voices[i % voices.length]! }]));
}

/** A group of the capital's background people as speakers, one per look: `c3_<group>_<look>`. */
function capitalGroup(group: string, looks: CapitalLook[], names: string[], faces: CourtFace[], voices: VoiceId[]): Record<string, { name: string; portrait: RowSprite; voice: VoiceId }> {
  return Object.fromEntries(looks.map((look, i) => [`c3_${group}_${i}`, { name: names[i % names.length]!, portrait: capitalPortrait(look, faces[i % faces.length]), voice: voices[i % voices.length]! }]));
}

export const SPEAKERS: Record<string, { name: string; portrait: RowSprite; voice: VoiceId | 'crowd' | 'dog'; nameVar?: string }> = {
  you: { name: 'You', portrait: PROTAGONIST_PORTRAIT , voice: 'you' },
  mum: { name: 'Mum', portrait: MUM_PORTRAIT , voice: 'mum' },
  tender: { name: 'The Tender', portrait: TENDER_PORTRAIT , voice: 'tender' },
  friend: { name: 'Your friend', portrait: FRIEND_PORTRAIT , voice: 'friend' },
  girl: { name: 'The girl', portrait: GIRL_PORTRAIT , voice: 'girl' },
  archivist: { name: 'The archivist', portrait: ARCHIVIST_PORTRAIT , voice: 'archivist' },
  boy: { name: 'The boy', portrait: BOY_PORTRAIT , voice: 'boy' },
  // Chapter 2.
  scavenger: { name: 'You', portrait: SCAVENGER_PORTRAIT, voice: 'scavenger' },
  prince: { name: 'You', portrait: PRINCE_PORTRAIT, voice: 'prince' },
  brother: { name: 'Your brother', portrait: folkPortrait(CAST_LOOKS.brother, { build: 'round', eyes: 'wide', mouth: 'grin' }), voice: 'young' },
  boss: { name: 'The boss', portrait: folkPortrait(CAST_LOOKS.boss, { build: 'heavy', age: 1, beard: 'moustache', brow: 'heavy', eyes: 'narrow', mouth: 'smile', items: ['earring'] }), voice: 'upper' },
  watcher: { name: 'The watcher', portrait: folkPortrait(CAST_LOOKS.watcher, { build: 'narrow', eyes: 'narrow', brow: 'heavy', items: ['scar'] }), voice: 'elder' },
  enforcer: { name: 'The enforcer', portrait: folkPortrait(CAST_LOOKS.enforcer, { build: 'broad', brow: 'knit', beard: 'stubble', mouth: 'sneer' }), voice: 'guard' },
  boss_son: { name: "The boss's son", portrait: folkPortrait(CAST_LOOKS.boss_son, { build: 'narrow', brow: 'raised', mouth: 'sneer', items: ['earring'] }), voice: 'boy' },
  scav_friend: { name: 'Your friend', portrait: folkPortrait(CAST_LOOKS.scav_friend, { mouth: 'smile', items: ['beads', 'earring'] }), voice: 'roots_woman' },
  old_scav: { name: 'The old scavenger', portrait: folkPortrait(CAST_LOOKS.old_scav, { age: 2, brow: 'heavy', beard: 'long', mouth: 'frown', eyes: 'narrow' }), voice: 'old' },
  gambler: { name: 'The gambler', portrait: folkPortrait(CAST_LOOKS.gambler, { build: 'narrow', eyes: 'hollow', beard: 'stubble', mouth: 'grin' }), voice: 'roots_man' },
  lookout: { name: 'The kid', portrait: folkPortrait(CAST_LOOKS.lookout, { build: 'round', eyes: 'wide', mouth: 'smile' }), voice: 'young' },
  tallyman: { name: 'The tallyman', portrait: folkPortrait(CAST_LOOKS.tallyman, { age: 1, items: ['spectacles'] }), voice: 'archivist' },
  barkeep: { name: 'The barkeep', portrait: folkPortrait(CAST_LOOKS.barkeep, { build: 'round', age: 1, beard: 'moustache', mouth: 'smile' }), voice: 'roots_man' },
  madam: { name: 'The madam', portrait: folkPortrait(CAST_LOOKS.madam, { eyes: 'narrow', brow: 'raised', mouth: 'smile', items: ['earring'] }), voice: 'mum' },
  hostess: { name: 'A hostess', portrait: folkPortrait(HOSTESS_LOOKS[0]!, { build: 'narrow', eyes: 'narrow', mouth: 'smile', items: ['earring', 'beads'] }), voice: 'girl' },
  fence: { name: 'The fence', portrait: folkPortrait(CAST_LOOKS.fence, { build: 'narrow', eyes: 'narrow', mouth: 'smile', items: ['earring'] }), voice: 'preacher' },
  // The dog: no voice, its own sounds (a bark, a growl, a whimper, from what it says); its name once it has one.
  dog: { name: 'The dog', portrait: DOG_PORTRAIT, voice: 'dog', nameVar: 'dog_name' },
  food_trader: { name: 'The food trader', portrait: folkPortrait(TOWNSFOLK_LOOKS[5]!, { mouth: 'frown', eyes: 'narrow' }), voice: 'roots_woman' }, // at the swap yard's food stall
  // The other clan's raiders' leader (Chapter 2, Day 5).
  raider_lead: { name: 'Their leader', portrait: folkPortrait(RIVAL_LOOKS[0]!, { build: 'broad', eyes: 'narrow', brow: 'heavy', mouth: 'frown' }), voice: 'guard' },
  // Chapter 2, Day 7: the picker lost in the sunk town's sister; an angry picker; the den's debt collector.
  picker_sister: { name: 'His sister', portrait: folkPortrait(TOWNSFOLK_LOOKS[9]!, { eyes: 'narrow', mouth: 'frown' }), voice: 'roots_woman' },
  picker: { name: 'A picker', portrait: folkPortrait(TOWNSFOLK_LOOKS[10]!, { brow: 'heavy', mouth: 'frown' }), voice: 'roots_man' },
  collector: { name: 'The house\u2019s man', portrait: folkPortrait(TOWNSFOLK_LOOKS[8]!, { eyes: 'narrow', mouth: 'grin' }), voice: 'guard' },
  // Chapter 2, Day 8: one of the other clan's guards on their drop.
  drop_guard: { name: 'Drop guard', portrait: folkPortrait(RIVAL_LOOKS[1]!, { eyes: 'narrow', mouth: 'frown' }), voice: 'roots_man' },
  // Chapter 2, Day 9: the other clan's scout.
  // Chapter 2, Day 11: the boss's daughter, kept by the other clan since the truce.
  daughter: { name: 'His daughter', portrait: folkPortrait(RIVAL_LOOKS[2]!, { eyes: 'wide', mouth: 'flat' }), voice: 'young' },
  scout: { name: 'The scout', portrait: folkPortrait(RIVAL_LOOKS[1]!, { eyes: 'wide', mouth: 'frown', items: ['scar'] }), voice: 'young' },
  // Stragglers from elsewhere (Chapter 2, Day 1).
  straggler_thin: { name: 'The thin one', portrait: folkPortrait(STRAGGLER_LOOKS[0]!, { build: 'narrow', eyes: 'hollow', mouth: 'grin' }), voice: 'roots_man' },
  straggler_big: { name: 'The big one', portrait: folkPortrait(STRAGGLER_LOOKS[1]!, { build: 'heavy', brow: 'heavy', beard: 'stubble', mouth: 'frown' }), voice: 'guard' },

  // The recurring cast.
  preacher: { name: 'The preacher', portrait: npcPortrait(PREACHER_LOOK, { build: 'narrow', age: 1, eyes: 'wide', brow: 'raised', mouth: 'grin' }), voice: 'preacher' },
  elder_amber: { name: 'An elder', portrait: npcPortrait(ELDER_LOOKS[0]!, ELDER_FACE), voice: 'elder' }, // the eldest, who leads
  elder_cyan: { name: 'An elder', portrait: npcPortrait(ELDER_LOOKS[1]!, ELDER_FACE), voice: 'elder' },
  elder_green: { name: 'An elder', portrait: npcPortrait(ELDER_LOOKS[2]!, ELDER_FACE), voice: 'elder' },
  elder_pale: { name: 'An elder', portrait: npcPortrait(ELDER_LOOKS[3]!, ELDER_FACE), voice: 'elder' },
  guard: { name: 'A guard', portrait: guardFace({ build: 'broad', age: 1, brow: 'heavy', beard: 'stubble' }), voice: 'guard' },
  escort: { name: 'The guard', portrait: guardFace({ brow: 'knit', mouth: 'frown', beard: 'moustache' }), voice: 'guard' },
  post_guard: { name: 'The guard at the post', portrait: guardFace({ build: 'round', eyes: 'narrow', mouth: 'sneer' }), voice: 'guard' },
  gate_guard: { name: 'The gate guard', portrait: guardFace({ build: 'narrow', eyes: 'narrow', brow: 'raised' }), voice: 'guard' },
  zealot: { name: 'The young man', portrait: npcPortrait(VILLAGER_LOOKS[0]!, { build: 'narrow', brow: 'knit', eyes: 'wide', mouth: 'sneer', beard: 'stubble' }), voice: 'young' },
  old_man: { name: 'An old man', portrait: npcPortrait(VILLAGER_LOOKS[1]!, { hairColour: SHADES.light, age: 2, eyes: 'tired', brow: 'heavy', beard: 'moustache', mouth: 'frown', items: ['pipe'] }), voice: 'old' },
  mother: { name: 'A mother', portrait: npcPortrait(VILLAGER_LOOKS[6]!, { build: 'round', hair: 'long', eyes: 'tired', brow: 'knit', mouth: 'frown', items: ['scarf'] }), voice: 'roots_woman' },
  thin_man: { name: 'Thin man', portrait: npcPortrait(VILLAGER_LOOKS[2]!, { build: 'narrow', hair: 'messy', age: 1, eyes: 'hollow', beard: 'stubble' }), voice: 'roots_man' },

  // One-offs, from the looks of the people standing there.
  hatch_keeper: { name: 'Hatch keeper', portrait: npcPortrait(HATCH_KEEPER_LOOK, { build: 'round', age: 1, brow: 'raised', items: ['apron'] }), voice: 'roots_man' },
  stew_seller: { name: 'The stew seller', portrait: npcPortrait(VILLAGER_LOOKS[3]!, { build: 'broad', age: 1, mouth: 'smile', items: ['apron', 'earring'] }), voice: 'roots_woman' },
  fungus_seller: { name: 'The glowcap seller', portrait: npcPortrait(VILLAGER_LOOKS[0]!, { build: 'round', eyes: 'narrow', mouth: 'smile', items: ['beads'] }), voice: 'roots_woman' },
  cloth_seller: { name: 'The cloth seller', portrait: npcPortrait(VILLAGER_LOOKS[1]!, { hair: 'long', mouth: 'smile', items: ['scarf'] }), voice: 'roots_woman' },
  curio_seller: { name: 'The curio seller', portrait: npcPortrait(VILLAGER_LOOKS[5]!, { build: 'narrow', age: 2, eyes: 'narrow', beard: 'long', mouth: 'smile', items: ['earring'] }), voice: 'old' },
  local: { name: 'A local', portrait: npcPortrait(VILLAGER_LOOKS[5]!, { build: 'round', beard: 'stubble', mouth: 'smile', items: ['earring'] }), voice: 'roots_man' },
  friend_father: { name: 'His father', portrait: npcPortrait(FRIEND_FATHER_LOOK, { build: 'broad', age: 1, brow: 'knit', beard: 'full', mouth: 'frown', items: ['token'] }), voice: 'roots_man' },
  carver: { name: 'A carver', portrait: npcPortrait(RESIDENT_LOOKS[3]!, { build: 'narrow', hair: 'long', age: 1, items: ['spectacles'] }), voice: 'upper' },
  lift_keeper: { name: 'The lift keeper', portrait: npcPortrait(RESIDENT_LOOKS[1]!, { build: 'round', eyes: 'narrow', beard: 'moustache', mouth: 'smile' }), voice: 'upper' },
  doorman: { name: 'The doorman', portrait: npcPortrait(RESIDENT_LOOKS[1]!, { build: 'narrow', eyes: 'narrow', brow: 'raised' }), voice: 'upper' },
  gardener: { name: 'The gardener', portrait: npcPortrait(RESIDENT_LOOKS[2]!, { hair: 'bun', age: 1 }), voice: 'upper' },

  // Voices from the crowd, each with the face of someone standing in it.
  crowd_woman: { name: 'A woman', portrait: npcPortrait(VILLAGER_LOOKS[3]!, { eyes: 'wide', brow: 'knit', mouth: 'open' }), voice: 'roots_woman' },
  crowd_man: { name: 'A man', portrait: npcPortrait(VILLAGER_LOOKS[4]!, { build: 'broad', brow: 'heavy', beard: 'full', mouth: 'open' }), voice: 'roots_man' },
  crowd_someone: { name: 'Someone', portrait: npcPortrait(VILLAGER_LOOKS[5]!, { build: 'round', eyes: 'narrow' }), voice: 'young' },
  crowd_someone_else: { name: 'Someone else', portrait: npcPortrait(VILLAGER_LOOKS[1]!, { hair: 'long', eyes: 'wide', mouth: 'frown', items: ['earring'] }), voice: 'roots_woman' },
  crowd: { name: 'The crowd', portrait: CROWD_PORTRAIT , voice: 'crowd' },

  // Chapter 3, the capital (looks and faces are Claude's, names placeholders; src/ui/capitalFolk.ts).
  father: { name: 'Your father', portrait: capitalPortrait(C3.father, { build: 'plain', age: 1, brow: 'heavy', eyes: 'tired', nose: 'long', mouth: 'thin' }), voice: 'king' },
  diplomat: { name: 'Your hand', portrait: capitalPortrait(C3.diplomat, { jaw: 'soft', age: 1, brow: 'arched', nose: 'broad', mouth: 'smile' }), voice: 'hand' },
  sister: { name: 'Your sister', portrait: capitalPortrait(C3.sister, { build: 'narrow', jaw: 'pointed', brow: 'raised', eyes: 'lashes', nose: 'small', mouth: 'smirk' }), voice: 'sister' },
  captain: { name: 'The captain', portrait: capitalPortrait(C3.captain, { build: 'broad', age: 1, brow: 'knit', eyes: 'narrow', mouth: 'thin', items: ['scar'] }), voice: 'captain' },
  councillor: { name: 'The old councillor', portrait: capitalPortrait(C3.councillor, { build: 'narrow', age: 2, brow: 'heavy', eyes: 'tired', nose: 'long', mouth: 'flat' }), voice: 'elder' },
  salon_hostess: { name: 'The hostess', portrait: capitalPortrait(C3.salon_hostess, { build: 'narrow', jaw: 'pointed', brow: 'thin', eyes: 'lashes', mouth: 'full', items: ['earring', 'mole'] }), voice: 'lady' },
  heir: { name: 'Your friend', portrait: capitalPortrait(C3.heir, { brow: 'straight', eyes: 'wide', mouth: 'smile', items: ['freckles'] }), voice: 'young' },
  envoy: { name: 'The envoy', portrait: capitalPortrait(C3.envoy, { age: 1, brow: 'heavy', eyes: 'narrow', nose: 'broad', mouth: 'frown' }), voice: 'roots_man' },
  operator: { name: 'The operator', portrait: capitalPortrait(C3.operator, { build: 'narrow', jaw: 'pointed', brow: 'thin', mouth: 'flat', items: ['piercing', 'tattoo'] }), voice: 'roots_woman' },
  lift_operator: { name: 'The lift operator', portrait: capitalPortrait(C3.lift_operator, { build: 'broad', age: 2, brow: 'heavy', eyes: 'tired', nose: 'broad', mouth: 'smile' }), voice: 'old' },
  petitioner: { name: 'The woman', portrait: capitalPortrait(C3.petitioner, { jaw: 'soft', age: 1, brow: 'knit', eyes: 'tired', mouth: 'flat' }), voice: 'roots_woman' },
  merchant: { name: 'The merchant', portrait: capitalPortrait(C3.merchant, { build: 'broad', jaw: 'soft', age: 1, brow: 'raised', nose: 'broad', mouth: 'smile' }), voice: 'upper' },
  cousin: { name: "The hostess's cousin", portrait: capitalPortrait(C3.cousin, { build: 'narrow', jaw: 'pointed', age: 1, brow: 'thin', eyes: 'narrow', nose: 'long', mouth: 'thin', items: ['earring'] }), voice: 'lady' },
  steward: { name: 'The steward', portrait: capitalPortrait(C3.steward, { build: 'narrow', age: 2, brow: 'straight', eyes: 'narrow', nose: 'long', mouth: 'thin' }), voice: 'elder' },
  warden: { name: 'The warden', portrait: capitalPortrait(C3.warden, { build: 'broad', age: 1, brow: 'knit', eyes: 'tired', mouth: 'flat' }), voice: 'upper' },
  // (Day 3: the watch take him as "Her neighbour", `#name:`; Day 4 he's the firebrand.)
  painter_brother: { name: "The painter's brother", portrait: capitalPortrait(C3.painter_brother, { jaw: 'square', brow: 'heavy', eyes: 'wide', mouth: 'open' }), voice: 'young' },
  painter: { name: 'The kid', portrait: capitalPortrait(C3.painter, { build: 'child', jaw: 'soft', brow: 'raised', eyes: 'wide', nose: 'small', mouth: 'smirk' }), voice: 'boy' },
  reformer: { name: 'The reformer', portrait: capitalPortrait(C3.reformer, { build: 'narrow', brow: 'knit', eyes: 'wide', mouth: 'flat' }), voice: 'preacher' },
  commander: { name: 'The commander', portrait: capitalPortrait(C3.commander, { jaw: 'square', age: 1, brow: 'straight', eyes: 'narrow', mouth: 'thin' }), voice: 'commander' },
  engineer: { name: 'The engineer', portrait: capitalPortrait(C3.engineer, { jaw: 'soft', nose: 'small', mouth: 'smirk', items: ['freckles'] }), voice: 'roots_woman' },
  hideout_keeper: { name: 'The barkeep', portrait: capitalPortrait(C3.hideout_keeper, { build: 'heavy', age: 1, brow: 'heavy', eyes: 'narrow', nose: 'broad', mouth: 'flat' }), voice: 'roots_man' },
  physician: { name: 'The physician', portrait: capitalPortrait(C3.physician, { age: 1, brow: 'arched', eyes: 'tired', mouth: 'smile', items: ['spectacles'] }), voice: 'upper' },
  // Chapter 4, the canopy (looks and faces are Claude's, names placeholders; src/ui/canopyFolk.ts).
  grounded: { name: 'Grounded', portrait: capitalPortrait(C4.grounded, { build: 'broad', jaw: 'square', age: 1, brow: 'heavy', eyes: 'narrow', nose: 'straight', mouth: 'smirk', items: ['scar'] }), voice: 'grounded' },
  master: { name: 'The master', portrait: capitalPortrait(C4.master, { build: 'narrow', age: 2, brow: 'thin', eyes: 'tired', nose: 'long', mouth: 'thin' }), voice: 'master' },
  quartermaster: { name: 'The quartermaster', portrait: capitalPortrait(C4.quartermaster, { build: 'heavy', jaw: 'soft', age: 1, brow: 'raised', eyes: 'narrow', nose: 'broad', mouth: 'smile', items: ['earring'] }), voice: 'quartermaster' },
  doubter: { name: 'The roots man', portrait: capitalPortrait(C4.doubter, { build: 'narrow', jaw: 'soft', brow: 'arched', eyes: 'wide', nose: 'small', mouth: 'smile' }), voice: 'roots_man' },
  keeper: { name: 'The hatch-keeper', portrait: capitalPortrait(C4.keeper, { build: 'narrow', jaw: 'pointed', brow: 'raised', eyes: 'wide', nose: 'small', mouth: 'open', items: ['freckles'] }), voice: 'keeper' },
  messenger: { name: 'The messenger', portrait: capitalPortrait(C4.messenger, { jaw: 'square', brow: 'straight', eyes: 'narrow', nose: 'long', mouth: 'flat', items: ['earring'] }), voice: 'messenger' },
  hunter: { name: 'The hunter', portrait: capitalPortrait(C4.hunter, { build: 'narrow', jaw: 'pointed', brow: 'knit', eyes: 'narrow', nose: 'small', mouth: 'smirk', items: ['scar', 'tattoo'] }), voice: 'hunter' },
  child: { name: 'A child', portrait: capitalPortrait(C4.child, { build: 'child', jaw: 'soft', eyes: 'wide', nose: 'small', mouth: 'frown' }), voice: 'boy' },
  ...canopyGroup('folk', CANOPY_FOLK_LOOKS, ['Someone', 'A man', 'A woman', 'A man', 'A woman', 'Someone', 'An old man', 'A woman'], [
    { jaw: 'soft', brow: 'raised', mouth: 'smile', items: ['freckles'] },
    { build: 'broad', age: 1, brow: 'heavy', nose: 'broad', mouth: 'smile' },
    { build: 'narrow', jaw: 'pointed', eyes: 'lashes', mouth: 'flat', items: ['earring'] },
    { jaw: 'square', brow: 'straight', eyes: 'narrow', mouth: 'smirk', items: ['tattoo'] },
    { build: 'narrow', jaw: 'soft', eyes: 'wide', nose: 'small', mouth: 'open' },
    { brow: 'knit', mouth: 'flat' },
    { age: 2, brow: 'heavy', eyes: 'tired', mouth: 'smile' },
    { jaw: 'soft', brow: 'arched', eyes: 'lashes', mouth: 'full' },
  ], ['roots_woman', 'roots_man', 'roots_woman', 'young', 'roots_woman', 'young', 'old', 'roots_woman']),
  ...canopyGroup('ascended', ASCENDED_LOOKS, ['An old master'], [
    { age: 2, brow: 'heavy', eyes: 'tired', nose: 'long', mouth: 'flat' },
    { build: 'narrow', age: 2, brow: 'thin', eyes: 'tired', mouth: 'thin' },
    { age: 2, brow: 'raised', eyes: 'narrow', nose: 'broad', mouth: 'smile' },
    { build: 'narrow', age: 2, jaw: 'pointed', eyes: 'tired', mouth: 'smirk', items: ['spectacles'] },
    { age: 2, brow: 'knit', mouth: 'frown' },
  ], ['old', 'elder', 'old', 'elder', 'old']),
  // The capital's background people: one speaker for each look (`c3_<group>_<look>`), so whoever you talk
  // to speaks with their own face (their shared knots say `#speaker:them`).
  ...capitalGroup('guard', CITADEL_GUARD_LOOKS, ['A guard'], [{ build: 'broad', mouth: 'thin' }, { build: 'broad', brow: 'heavy', mouth: 'frown' }, { brow: 'knit', mouth: 'flat', items: ['scar'] }], ['guard']),
  ...capitalGroup('courtier', COURTIER_LOOKS, ['A courtier', 'A lady', 'An old courtier', 'A lady', 'A courtier', 'A young lady', 'A courtier', 'A lady'], [
    { brow: 'arched', eyes: 'narrow', mouth: 'smirk' },
    { build: 'narrow', jaw: 'soft', brow: 'thin', eyes: 'lashes', mouth: 'full', items: ['earring'] },
    { age: 2, brow: 'heavy', eyes: 'tired', nose: 'long', mouth: 'flat' },
    { build: 'narrow', jaw: 'pointed', brow: 'arched', eyes: 'lashes', mouth: 'smile', items: ['freckles', 'earring'] },
    { jaw: 'soft', brow: 'raised', mouth: 'smile', items: ['earring'] },
    { build: 'narrow', jaw: 'soft', brow: 'thin', eyes: 'wide', nose: 'small', mouth: 'full' },
    { build: 'broad', age: 1, brow: 'heavy', nose: 'broad', mouth: 'smile' },
    { build: 'narrow', jaw: 'pointed', brow: 'thin', eyes: 'lashes', mouth: 'smirk', items: ['mole', 'earring'] },
  ], ['upper', 'lady', 'elder', 'lady', 'upper', 'lady', 'old', 'lady']),
  ...capitalGroup('servant', SERVANT_LOOKS, ['A servant', 'A page', 'The gardener'], [{ mouth: 'flat' }, { build: 'narrow', jaw: 'soft', eyes: 'wide', nose: 'small', mouth: 'flat' }, { build: 'broad', age: 2, eyes: 'tired', mouth: 'smile' }], ['roots_man', 'young', 'old']),
  ...capitalGroup('councillor', COUNCIL_LOOKS, ['A councillor'], [{ age: 1, brow: 'heavy', mouth: 'thin' }, { jaw: 'soft', age: 1, brow: 'thin', eyes: 'narrow', mouth: 'flat' }, { age: 2, brow: 'raised', eyes: 'tired', nose: 'long', mouth: 'frown', items: ['spectacles'] }], ['elder', 'lady', 'old']),
  ...capitalGroup('watch', WATCH_LOOKS, ['The watch'], [{ build: 'broad', brow: 'heavy', eyes: 'narrow', mouth: 'frown' }, { jaw: 'soft', brow: 'knit', mouth: 'thin', items: ['freckles'] }], ['guard', 'commander']),
  ...capitalGroup('citizen', CITIZEN_LOOKS, ['Someone', 'A man', 'A woman', 'An old woman', 'A man', 'A woman', 'A kid', 'A man', 'A woman', 'A man', 'A woman', 'Someone', 'Someone', 'A girl', 'A worker'], [
    { build: 'narrow', jaw: 'pointed', brow: 'raised', mouth: 'smirk', items: ['piercing', 'tattoo'] },
    { build: 'broad', age: 1, brow: 'heavy', nose: 'broad', mouth: 'frown' },
    { jaw: 'soft', brow: 'knit', eyes: 'lashes', mouth: 'flat' },
    { build: 'narrow', jaw: 'soft', age: 2, eyes: 'tired', mouth: 'thin' },
    { jaw: 'square', brow: 'straight', eyes: 'narrow', mouth: 'flat', items: ['scar'] },
    { jaw: 'soft', brow: 'knit', eyes: 'lashes', mouth: 'flat', items: ['earring'] },
    { build: 'child', jaw: 'soft', eyes: 'wide', nose: 'small', mouth: 'open', items: ['freckles'] },
    { build: 'broad', brow: 'heavy', mouth: 'smirk' },
    { build: 'narrow', jaw: 'pointed', mouth: 'smirk', items: ['tattoo'] },
    { build: 'broad', age: 1, brow: 'heavy', eyes: 'narrow', mouth: 'flat' },
    { jaw: 'soft', age: 1, brow: 'arched', mouth: 'smile', items: ['earring'] },
    { build: 'narrow', brow: 'thin', mouth: 'thin', items: ['piercing'] },
    { jaw: 'soft', brow: 'raised', eyes: 'tired', mouth: 'flat', items: ['freckles'] },
    { build: 'child', jaw: 'soft', brow: 'arched', eyes: 'lashes', nose: 'small', mouth: 'smile' },
    { build: 'plain', jaw: 'square', brow: 'knit', eyes: 'narrow', nose: 'broad', mouth: 'thin', items: ['scar'] },
  ], ['young', 'roots_man', 'roots_woman', 'old', 'roots_man', 'roots_woman', 'boy', 'roots_man', 'roots_woman', 'roots_man', 'roots_woman', 'young', 'roots_woman', 'girl', 'roots_man']),
};
