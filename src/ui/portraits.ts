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

/** Portraits by the speaker id used in ink tags (`#speaker:mum`), with the name shown above the line. */
export const SPEAKERS: Record<string, { name: string; portrait: RowSprite }> = {
  you: { name: 'You', portrait: PROTAGONIST_PORTRAIT },
  mum: { name: 'Mum', portrait: MUM_PORTRAIT },
};
