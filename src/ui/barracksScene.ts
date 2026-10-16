import Phaser from 'phaser';
import { HIRES, type Hire, type Hired, type Side } from '../systems/Riot';
import { choose, fade, overlay, text } from './audienceScene';
import { drawHired } from './hiredArt';
import { SHADES } from './pixelArt';
import { PixelText } from './PixelText';
import { playSound } from './soundscape';

// The barracks (Jack): its doors open on three kinds of fighter to hire. Draft words.

const FIGHTERS: Record<Hire, { kind: Hired; name: string; says: string[] }> = {
  rogues: { kind: 'rogue', name: 'Rogue mercenaries', says: ['Three of 3.', 'They go after the enemy', 'on their own.', "They don't join up or grow."] },
  archers: { kind: 'archer', name: 'Archers', says: ['Two of 2, next to', 'the barracks. They hold', 'there and shoot anyone', 'next to them: 1 a turn.'] },
  assassin: { kind: 'assassin', name: 'An assassin', says: ['One of 3. Slips through', 'to their base the safest', 'way, and strikes it: 3,', 'half the time 6.'] },
};

export interface BarracksShow {
  side: Side;
  you: Side;
  /** The computer's pick (theirs); none: yours to choose. */
  pick?: Hire;
  /** The colour of the side hiring. */
  colour: number;
}

/** The barracks' doors open: three to hire, one chosen. */
export async function openBarracks(scene: Phaser.Scene, show: BarracksShow): Promise<Hire> {
  const mine = show.side === show.you && !show.pick;
  const layer = overlay(scene);
  playSound(scene, 'door', 0.8);
  text(scene, layer, 14, mine ? 'The barracks! Who will you hire?' : 'They hire fighters at the barracks...', SHADES.white, 2);
  const boxes = HIRES.map((_, i) => ({ x: 24 + i * 148, y: 46, w: 136, h: 172 }));
  const frame = scene.add.graphics().setScrollFactor(0);
  layer.addAt(frame, 1);
  const art = scene.add.graphics().setScrollFactor(0);
  layer.add(art);
  HIRES.forEach((h, i) => {
    const b = boxes[i]!;
    const f = FIGHTERS[h];
    const cx = b.x + b.w / 2;
    const n = h === 'rogues' ? 3 : h === 'archers' ? 2 : 1;
    for (let j = 0; j < n; j++) drawHired(art, cx + (j - (n - 1) / 2) * (h === 'archers' ? 52 : 38) - (h === 'archers' ? 10 : 0), b.y + 50, f.kind, show.colour, 2);
    const name = new PixelText(scene, 0, b.y + 88, f.name, { color: SHADES.white, shadow: SHADES.shadow }).setScrollFactor(0);
    name.setX(Math.round(cx - name.width / 2));
    layer.add(name);
    f.says.forEach((line, k) => {
      const t = new PixelText(scene, 0, b.y + 104 + k * 11, line, { color: SHADES.light, shadow: SHADES.shadow }).setScrollFactor(0);
      t.setX(Math.round(cx - t.width / 2));
      layer.add(t);
    });
    layer.add(new PixelText(scene, b.x + 4, b.y + 4, String(i + 1), { color: SHADES.dim, shadow: SHADES.shadow }).setScrollFactor(0));
  });
  const hover = (at: number) => {
    frame.clear();
    boxes.forEach((b, i) => {
      frame.fillStyle(i === at ? SHADES.amberDeep : SHADES.deep, 0.6).fillRect(b.x, b.y, b.w, b.h);
      frame.lineStyle(1, i === at ? SHADES.light : SHADES.dim, 1).strokeRect(b.x, b.y, b.w, b.h);
    });
  };
  const i = await choose(scene, boxes, hover, mine, show.pick ? HIRES.indexOf(show.pick) : 0);
  playSound(scene, 'boots', 0.8);
  await fade(scene, layer);
  return HIRES[i]!;
}
