import Phaser from 'phaser';
import { GAME_HEIGHT as H, GAME_WIDTH as W } from '../config';
import { getSession } from '../session';
import { beginChapter2 } from './ChapterScene';
import { Calendar } from '../systems/Calendar';
import { SHADES } from '../ui/pixelArt';
import { PixelText } from '../ui/PixelText';
import { playConfirm, playMove } from '../ui/sfx';
import type { AreaSceneData } from './AreaScene';

export interface EndingSceneData {
  /** Which ending (an id in ENDINGS). */
  ending: string;
}

/** The endings: ones that stop the game early, and Act 1's two (Day 7). Draft words, for the designer. */
const ENDINGS: Record<string, { title: string; lines: string[]; retryDay: number; coda?: string; chapterEnd?: boolean }> = {
  // Ignoring Grounded's message twice (the design doc's "short, comfortable loyal ending").
  loyal: {
    title: 'You stayed loyal to the Tree.',
    lines: [
      'You carved your usual bird the next morning, and every morning after that.',
      'The Tree never sent one back again.',
      'Whoever had been watching you stopped watching.',
      'Over the next six weeks, everyone in the tree slowly starved. Even the upper branches.',
    ],
    // The question it leaves you with (designer).
    coda: 'Could you have saved your people?',
    retryDay: 2,
  },
  // Day 7, up: chased to the very top, and into the tube (big choice 3).
  fly: {
    title: 'Fly if you can.',
    lines: [
      'The tube took you the way it takes every offering: all at once, without a sound.',
      'Below you the torches got smaller, and smaller, and then there were none.',
      'Up, and up, into the white.',
    ],
    coda: 'End of Chapter 1',
    retryDay: 7,
  },
  // Day 7, down: you gave yourself up, and they threw you into the rot; light breaks in at the far end.
  fall: {
    title: 'Fall if you must.',
    lines: [
      'You went down into the dark, among everything the tree has ever thrown away.',
      'And at the bottom of it all, a light that never came from the tube.',
      'I will find you.',
    ],
    coda: 'End of Chapter 1',
    retryDay: 7,
  },
  // Chapter 2, the end of Part 4 (the reveal): in the tally house's cellar, waiting for the brand. Part 5 isn't built yet.
  part4: {
    title: 'Waiting for the light.',
    lines: [
      'They leave you in the cellar under the tally house, in the dark, with the noise of the whole settlement over your head.',
      'Somewhere out past the shacks, a dog is lying low with a roll of hide in its teeth.',
    ],
    coda: 'End of Part 4. Part 5, The fall, is next.',
    chapterEnd: false,
    retryDay: 10,
  },
  // The same, with the girl you blamed beside you.
  fall_together: {
    title: 'Fall if you must.',
    lines: [
      'You went down into the dark, among everything the tree has ever thrown away.',
      "She didn't forgive you. You didn't ask her to.",
      'But when the light came in, you went towards it together.',
    ],
    coda: 'End of Chapter 1',
    retryDay: 7,
  },
};

/**
 * An ending that stops the game early: words on black, then a choice to try again from the start of a
 * day (from how it began, kept in the session) or go back to the title.
 */
export class EndingScene extends Phaser.Scene {
  private options: { label: string; run: () => void; text: PixelText }[] = [];
  private selected = 0;
  private ready = false;

  constructor() {
    super('Ending');
  }

  create(data: EndingSceneData): void {
    const ending = ENDINGS[data.ending] ?? ENDINGS.loyal!;
    this.options = [];
    this.selected = 0;
    this.ready = false;
    this.cameras.main.setBackgroundColor(0x000000).fadeIn(1500);

    const centre = (t: PixelText) => t.setX(Math.round((W - t.width) / 2));
    const title = centre(new PixelText(this, 0, 60, ending.title, { color: SHADES.white, scale: 2 })).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 1500, delay: 600 });
    // Each line under the last (long ones wrap onto two).
    let y = 106;
    ending.lines.forEach((line, i) => {
      const t = centre(new PixelText(this, 0, y, line, { color: SHADES.light, wrapWidth: 400, centred: true })).setAlpha(0);
      y += t.height + 7;
      this.tweens.add({ targets: t, alpha: 1, duration: 1200, delay: 2400 + i * 1600 });
    });
    if (ending.coda) {
      const coda = centre(new PixelText(this, 0, y + 10, ending.coda, { color: SHADES.amber })).setAlpha(0);
      this.tweens.add({ targets: coda, alpha: 1, duration: 1500, delay: 2400 + ending.lines.length * 1600 + 600 });
    }

    const start = getSession(this).dayStarts[ending.retryDay];
    const choices = [
      // Finishing Chapter 1 opens the next (designer).
      ...(ending.coda && ending.chapterEnd !== false ? [{ label: 'Begin Chapter 2', run: () => beginChapter2(this) }] : []),
      ...(start ? [{ label: `Try again from Day ${ending.retryDay}`, run: () => this.retry(ending.retryDay) }] : []),
      { label: 'Back to the title', run: () => this.scene.start('Title') },
    ];
    const shownAt = 2400 + ending.lines.length * 1600 + (ending.coda ? 2400 : 800);
    choices.forEach((c, i) => {
      const text = centre(new PixelText(this, 0, H - 60 + i * 14, c.label, { color: SHADES.dim })).setAlpha(0);
      this.tweens.add({ targets: text, alpha: 1, duration: 800, delay: shownAt });
      this.options.push({ ...c, text });
    });
    this.time.delayedCall(shownAt, () => {
      this.ready = true;
      this.highlight();
    });

    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (!this.ready) return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'ArrowDown' || e.key === 's') {
        this.selected = (this.selected + (e.key === 'ArrowUp' || e.key === 'w' ? -1 : 1) + this.options.length) % this.options.length;
        playMove(this);
        this.highlight();
      } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'e') {
        playConfirm(this);
        this.ready = false;
        this.options[this.selected]!.run();
      }
    });
  }

  private highlight(): void {
    this.options.forEach((o, i) => o.text.setColor(i === this.selected ? SHADES.amber : SHADES.dim));
  }

  /** Back to how that day began: the story and the calendar as they were, waking where you woke (at home, or in the cell). */
  private retry(day: number): void {
    const session = getSession(this);
    const start = session.dayStarts[day];
    if (!start) return;
    session.story.loadState(start.ink);
    session.calendar = Calendar.fromJSON(start.calendar);
    session.waiting = null;
    this.scene.start('Area', { ...(start.wake ?? { areaId: 'home', start: { x: 50, y: 150 } }), card: `Day ${day}` } satisfies AreaSceneData);
  }
}
