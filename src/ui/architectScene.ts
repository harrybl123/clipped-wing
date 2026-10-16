import Phaser from 'phaser';
import { GAME_HEIGHT as H, GAME_WIDTH as W } from '../config';
import { BUILDINGS, type Building, type Side } from '../systems/Riot';
import { choose, fade, overlay } from './audienceScene';
import { CAPITAL_CAST_LOOKS, type CapitalLook } from './capitalFolk';
import { capitalPortrait } from './capitalPortraits';
import { SHADES } from './pixelArt';
import { makeSpriteTexture } from './pixelTextures';
import { PixelText } from './PixelText';
import { playSound } from './soundscape';

// The architect (Jack): land on him and he'll build you something. A great scroll unrolls across the screen (the
// paper), he says "Aha!", and his three plans are drawn on it in ink: artillery, a storehouse, a fortress. Choose
// one, then where it goes. Draft looks and words.

const PLANS: Record<Building, { name: string; says: string[] }> = {
  artillery: { name: 'Artillery', says: ['5, dug in at first.', 'Shoots one of theirs', 'next to it for 3', 'a turn. Never moves.'] },
  storehouse: { name: 'A storehouse', says: ['3. Does nothing itself,', 'but while it stands', 'your elite are doubled:', 'hero 14, maiden 10, guard 4.'] },
  fortress: { name: 'A fortress', says: ['Dug in for good,', 'for 7 turns. Your base', 'or a tower next to it', 'makes 1 more a turn.'] },
};

/** The architect himself: older, spectacles, grey hair, a draughtsman's coat (a look made from the engineer's). */
const ARCHITECT_LOOK: CapitalLook = { ...(CAPITAL_CAST_LOOKS.engineer as CapitalLook), hair: SHADES.light, head: undefined, glow: false, top: SHADES.woodLight, topStyle: 'coat' as CapitalLook['topStyle'] };
const ARCHITECT = capitalPortrait(ARCHITECT_LOOK, { age: 2, items: ['spectacles'], mouth: 'smile', brow: 'raised' });

const INK = SHADES.amberDeep;
const PAPER = 0xe9dcc0;
const PAPER_SHADE = 0xcdbb98;

export interface ArchitectShow {
  side: Side;
  you: Side;
  /** The computer's pick (theirs); none: yours to choose. */
  pick?: Building;
}

/** A plan in ink on the parchment, centred on (x, y). */
function sketch(g: Phaser.GameObjects.Graphics, b: Building, x: number, y: number): void {
  g.lineStyle(2, INK, 1);
  if (b === 'artillery') {
    // A cannon on its carriage: the barrel, the wheel, the trail.
    g.strokeRect(x - 22, y - 10, 34, 9);
    g.strokeCircle(x + 12, y - 6, 4);
    g.strokeCircle(x - 6, y + 6, 9);
    g.lineBetween(x - 6, y - 3, x - 6, y + 15).lineBetween(x - 15, y + 6, x + 3, y + 6);
    g.lineBetween(x + 2, y + 2, x + 24, y + 14);
  } else if (b === 'storehouse') {
    // A granary: a pitched roof, a door, sacks stacked by it.
    g.strokeTriangle(x - 24, y - 4, x + 24, y - 4, x, y - 22);
    g.strokeRect(x - 20, y - 4, 40, 22);
    g.strokeRect(x - 5, y + 6, 10, 12);
    g.strokeCircle(x + 28, y + 14, 4).strokeCircle(x + 33, y + 8, 4);
  } else {
    // A fortress: a wall with battlements between two towers, a gate.
    g.strokeRect(x - 28, y - 14, 12, 32).strokeRect(x + 16, y - 14, 12, 32);
    g.strokeRect(x - 16, y - 4, 32, 22);
    for (let i = 0; i < 4; i++) g.strokeRect(x - 15 + i * 8, y - 9, 5, 5);
    g.lineBetween(x - 6, y + 18, x - 6, y + 8).lineBetween(x + 6, y + 18, x + 6, y + 8);
    g.beginPath();
    g.arc(x, y + 8, 6, Math.PI, 0, false);
    g.strokePath();
  }
}

/** The architect's scroll unrolls: what will he build? */
export async function openArchitect(scene: Phaser.Scene, show: ArchitectShow): Promise<Building> {
  const mine = show.side === show.you && !show.pick;
  const layer = overlay(scene);
  // He leans in from the left.
  const face = scene.add.image(-60, H, makeSpriteTexture(scene, 'riot-architect', ARCHITECT.rows, ARCHITECT.colours)).setOrigin(0.5, 1).setScale(1.5).setScrollFactor(0);
  layer.add(face);
  scene.tweens.add({ targets: face, x: 30, duration: 400, ease: 'Sine.easeOut' });
  // The scroll: rolled up in the middle, then opening out to both sides.
  // (Behind him from the start, Jack: it rolled out over his face, then jumped behind it.)
  const scroll = scene.add.graphics().setScrollFactor(0);
  layer.addAt(scroll, layer.getIndex(face));
  const [top, height] = [40, 186];
  const open = { w: 8 };
  const drawScroll = () => {
    const w = open.w;
    const x = W / 2 - w / 2;
    scroll.clear();
    scroll.fillStyle(SHADES.shadow, 0.6).fillRect(x + 3, top + 4, w, height);
    scroll.fillStyle(PAPER, 1).fillRect(x, top, w, height);
    scroll.fillStyle(PAPER_SHADE, 1).fillRect(x, top, w, 3).fillRect(x, top + height - 3, w, 3);
    // The rolls at each end.
    for (const rx of [x - 6, x + w - 2]) {
      scroll.fillStyle(PAPER_SHADE, 1).fillRect(rx, top - 6, 8, height + 12);
      scroll.fillStyle(SHADES.woodPale, 1).fillRect(rx + 2, top - 10, 4, height + 20);
    }
  };
  drawScroll();
  playSound(scene, 'paper', 1);
  await new Promise<void>((r) => scene.tweens.add({ targets: open, w: W - 64, duration: 750, ease: 'Sine.easeOut', onUpdate: drawScroll, onComplete: () => r() }));
  // "Aha!"
  playSound(scene, 'aha', 1);
  const aha = new PixelText(scene, 0, top + 8, 'Aha!', { color: INK, scale: 2 }).setScrollFactor(0);
  aha.setX(Math.round(W / 2 - aha.width / 2));
  layer.add(aha);
  aha.setScale(0.6);
  scene.tweens.add({ targets: aha, scale: 1, duration: 200, ease: 'Back.easeOut' });
  const ask = new PixelText(scene, 0, top + 26, mine ? 'What shall I build you?' : 'He draws up plans for the enemy', { color: INK }).setScrollFactor(0);
  ask.setX(Math.round(W / 2 - ask.width / 2));
  layer.add(ask);
  // The three plans, in ink.
  const boxes = BUILDINGS.map((_, i) => ({ x: 52 + i * 128, y: top + 40, w: 120, h: 138 }));
  const frame = scene.add.graphics().setScrollFactor(0);
  layer.add(frame);
  const ink = scene.add.graphics().setScrollFactor(0);
  layer.add(ink);
  BUILDINGS.forEach((b, i) => {
    const box = boxes[i]!;
    const cx = box.x + box.w / 2;
    sketch(ink, b, cx, box.y + 32);
    const name = new PixelText(scene, 0, box.y + 66, PLANS[b].name, { color: INK }).setScrollFactor(0);
    name.setX(Math.round(cx - name.width / 2));
    layer.add(name);
    PLANS[b].says.forEach((line, k) => {
      const t = new PixelText(scene, 0, box.y + 80 + k * 11, line, { color: SHADES.woodLight }).setScrollFactor(0);
      t.setX(Math.round(cx - t.width / 2));
      layer.add(t);
    });
    layer.add(new PixelText(scene, box.x + 4, box.y + 3, String(i + 1), { color: SHADES.dim }).setScrollFactor(0));
  });
  const hover = (at: number) => {
    frame.clear();
    boxes.forEach((b, i) => frame.lineStyle(i === at ? 2 : 1, i === at ? INK : PAPER_SHADE, 1).strokeRect(b.x, b.y, b.w, b.h));
  };
  const i = await choose(scene, boxes, hover, mine, show.pick ? BUILDINGS.indexOf(show.pick) : 0, layer);
  playSound(scene, 'paper', 0.6);
  await fade(scene, layer);
  return BUILDINGS[i]!;
}
