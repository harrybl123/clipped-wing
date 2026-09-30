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

/** Portraits by the speaker id used in ink tags (`#speaker:mum`), with the name shown above the line. */
export const SPEAKERS: Record<string, { name: string; portrait: RowSprite }> = {
  you: { name: 'You', portrait: PROTAGONIST_PORTRAIT },
  mum: { name: 'Mum', portrait: MUM_PORTRAIT },
  tender: { name: 'The Tender', portrait: TENDER_PORTRAIT },
  friend: { name: 'Your friend', portrait: FRIEND_PORTRAIT },
};
