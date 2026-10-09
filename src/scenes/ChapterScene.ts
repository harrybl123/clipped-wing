import Phaser from 'phaser';
import { GAME_WIDTH as W } from '../config';
import { SHADES } from '../ui/pixelArt';
import { makeSpriteTexture } from '../ui/pixelTextures';
import { PixelText } from '../ui/PixelText';
import { BIRD } from '../ui/sprites';
import type { AreaSceneData } from './AreaScene';
import { getSession } from '../session';

export interface ChapterSceneData {
  /** "Chapter 1". */
  number: string;
  /** The chapter's name, large: "Fly or Fall". */
  title: string;
  /** Where the game goes next. */
  next: AreaSceneData;
}

/**
 * Chapter 2 begins (designer: an option once you've finished Chapter 1): the scavenger, on the picked
 * fields, digging. The story carries on from where Chapter 1 left it; the calendar starts again at Day 1.
 */
export function beginChapter2(scene: Phaser.Scene): void {
  const session = getSession(scene);
  session.story.setVariable('chapter', 2);
  // Nothing of Chapter 1's left to do (the day's first knot sets her objective).
  session.story.setVariable('objective', '');
  session.story.setVariable('objective_target', '');
  session.calendar.jumpTo(1);
  const next: AreaSceneData = { areaId: 'picked-fields', start: { x: 60, y: 232 }, card: 'Day 1', script: 'c2day1_start' };
  session.dayStarts = { 1: { ink: session.story.saveState(), calendar: session.calendar.toJSON(), wake: { areaId: next.areaId, start: next.start!, script: next.script } } };
  scene.scene.start('Chapter', { number: 'Chapter 2', title: 'On the Scent', next } satisfies ChapterSceneData);
}

/** Dev: straight to the start of one of Chapter 2's days, as if the days before had been played (`?chapter=2&day=2` to `5`). */
export function devChapter2Day(scene: Phaser.Scene, day: number): void {
  const session = getSession(scene);
  const set = (vars: Record<string, string | number | boolean>) => {
    for (const [name, value] of Object.entries(vars)) session.story.setVariable(name, value);
  };
  set({ chapter: 2, c2day1: 'done', owe_double: true, traded_light: true, objective: '', objective_target: '' });
  if (day >= 3) set({ c2day2: 'done', found_dog: true, dog_owned: true, dog_name: 'Peggy', dog_choice: 'keep' });
  if (day >= 4) set({ c2day3: 'done', owe_double: false, summoned: true });
  if (day >= 5) set({ c2day4: 'done', in_circle: true, brother_choice: 'home', spar_done: true, bar_arrived: true });
  if (day >= 6) set({ c2day5: 'done', board_mark: 'far fields' });
  if (day >= 7) set({ c2day6: 'done', raid_won: true });
  // Earlier choices, for trying each path (dev): &brother=compound (big choice 1: he moved in), &spar=won|sunk|deep
  // (won the spar, or lost it and told the bar the sunk town or the deep ground), &gambler=helped (gave him a find on Day 5).
  const params = new URLSearchParams(window.location.search);
  if (day >= 5 && params.get('brother') === 'compound') set({ brother_choice: 'compound', brother_moved: true });
  const spar = params.get('spar');
  if (day >= 5 && spar === 'won') set({ spar_won: true });
  if (day >= 5 && (spar === 'sunk' || spar === 'deep')) set({ spar_won: false, told_where: spar });
  if (day >= 6 && params.get('gambler') === 'helped') set({ gambler_trust: 1 });
  const starts: Record<number, AreaSceneData & { vars: Record<string, string | boolean> }> = {
    2: { areaId: 'shack', start: { x: 382, y: 184 }, vars: { c2day2: 'wake', objective: 'Talk to your brother', objective_target: 'shack:brother' } },
    3: { areaId: 'dogs-hollow', start: { x: 60, y: 206 }, script: 'c2day3_start', vars: { c2day3: 'sunk' } },
    4: { areaId: 'compound', start: { x: 40, y: 232 }, script: 'c2day4_start', vars: { c2day4: 'gate' } },
    5: { areaId: 'swap-yard', start: { x: 600, y: 232 }, script: 'c2day5_start', vars: { c2day5: 'town' } },
    6: { areaId: 'picked-fields', start: { x: 860, y: 232 }, script: 'c2day6_start', vars: { c2day6: 'fields' } },
    7: { areaId: 'dogs-hollow', start: { x: 60, y: 206 }, script: 'c2day7_start', vars: {} },
  };
  // Day 7, part way in (dev): &at=den (down the den's steps, the gambler at the wall), &at=tribute (at the
  // tally house, your share to pay), &at=home (out of the tally, on foot home through the yard at night).
  const at = params.get('at');
  const day7: Record<string, { area: AreaSceneData; slots: number; vars: Record<string, string | boolean> }> = {
    den: {
      area: { areaId: 'gambling-den', start: { x: 40, y: 172 } }, slots: 1,
      vars: { c2day7: 'den', wells_seen: true, yard7_done: true, den7: true, gambler_at_wall: true, collectors_here: true, objective: 'See what the gambler wants', objective_target: 'gambling-den:gambler-wall' },
    },
    tribute: {
      area: { areaId: 'tally-house', start: { x: 60, y: 236 } }, slots: 2,
      vars: { c2day7: 'tribute', wells_seen: true, yard7_done: true, den7_seen: true, gambler_choice: 'fought', collectors_won: true, has_chain: true, tribute_night: true, objective: 'Pay your tribute', objective_target: 'tally-house:tallyman' },
    },
    home: {
      area: { areaId: 'swap-yard', start: { x: 552, y: 232 } }, slots: 2,
      vars: { c2day7: 'home', wells_seen: true, yard7_done: true, door_marked: true, den7_seen: true, gambler_choice: 'fought', collectors_won: true, has_chain: true, tribute7_done: true, board_mark: 'sunk town', ambush_night: true, ambush_set: true, objective: 'Go home', objective_target: 'shack:bed' },
    },
  };
  // Day 6: &at=tally (the night of the first raid, walking into the tally house).
  const day6: Record<string, { area: AreaSceneData; slots: number; vars: Record<string, string | boolean> }> = {
    tally: { area: { areaId: 'tally-house', start: { x: 30, y: 236 } }, slots: 2, vars: { c2day6: 'tally', raid_won: true, raid_night: true, tribute_night: true, objective: 'Go to the tally house', objective_target: '' } },
  };
  const mid = at ? (day === 7 ? day7[at] : day === 6 ? day6[at] : undefined) : undefined;
  const { vars, ...next } = starts[day] ?? starts[2]!;
  set(mid?.vars ?? vars);
  if (at === 'home' && params.get('brother') !== 'compound') set({ brother_scrubbing: true });
  session.calendar.jumpTo(day as 2 | 3 | 4 | 5 | 6 | 7);
  for (let i = 0; i < (mid?.slots ?? 0); i++) session.calendar.advance();
  scene.scene.start('Area', { ...(mid?.area ?? next), card: day === 3 ? 'Weeks later' : day === 7 ? 'Two weeks on' : `Day ${day}` } satisfies AreaSceneData);
}

/** How long the card holds before fading out (ms). */
const HOLD = 2800;

/**
 * A chapter's title card, on black (designer: after the prologue, "Chapter 1: Fly or Fall"): the number small,
 * the name large in the title's carved letters, a small red bird beneath. It fades in, holds, fades out,
 * and the game goes on. Any key or click skips it, after the first second.
 */
export class ChapterScene extends Phaser.Scene {
  private leaving = false;
  private next!: AreaSceneData;

  constructor() {
    super('Chapter');
  }

  create(data: ChapterSceneData): void {
    this.leaving = false;
    this.next = data.next;
    this.cameras.main.setBackgroundColor(SHADES.shadow);
    const number = new PixelText(this, 0, 92, data.number, { color: SHADES.dim });
    number.setX(Math.round((W - number.width) / 2));
    const title = new PixelText(this, 0, 108, data.title, { color: SHADES.light, scale: 3, shadow: SHADES.shadow, chisel: { light: SHADES.white, dark: SHADES.dim } });
    title.setX(Math.round((W - title.width) / 2));
    const bird = this.add.image(W / 2, title.y + title.height + 14, makeSpriteTexture(this, 'bird', BIRD.rows, BIRD.colours)).setOrigin(0.5, 0);
    const parts = [number, title, bird];
    for (const p of parts) p.setAlpha(0);
    // The number first, then the name, then the bird.
    parts.forEach((p, i) => this.tweens.add({ targets: p, alpha: 1, duration: 1100, delay: 500 + i * 600, ease: 'Sine.easeOut' }));
    this.time.delayedCall(500 + 2 * 600 + 1100 + HOLD, () => this.leave());
    // Skippable after a moment (so a key still held from the prologue doesn't skip it).
    this.time.delayedCall(1000, () => {
      this.input.keyboard?.once('keydown', () => this.leave());
      this.input.once('pointerdown', () => this.leave());
    });
  }

  private leave(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(1200, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Area', this.next));
  }
}
