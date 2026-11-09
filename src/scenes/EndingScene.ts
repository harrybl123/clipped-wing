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
const ENDINGS: Record<string, { title: string; lines: string[]; retryDay: number; coda?: string; chapter?: 2 | 3 }> = {
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
  // Chapter 2's endings: out past the tree's edge towards the woods, with the dog (designer: uneasy; unsure where
  // life will take you). One per last act (big choice 3). Draft text.
  c2_girl: {
    title: 'Into the woods.',
    lines: [
      'Behind you, two clans shouting at each other across a fence, over a woman with pale hair, and her father on his knees.',
      'They will hate you on both sides of it for a long time.',
      'Ahead, the trees, and the dog, nose down, sure of something you are not.',
    ],
    coda: 'End of Chapter 2',
    chapter: 2,
    retryDay: 11,
  },
  c2_truce: {
    title: 'Into the woods.',
    lines: [
      'Behind you, a truce, with a dog at the middle of it that both sides now know is real, and want.',
      'They will come looking for it. Maybe not soon. But they will.',
      'Ahead, the trees, and the dog, trotting on as if nothing out there could ever be worse than people.',
    ],
    coda: 'End of Chapter 2',
    chapter: 2,
    retryDay: 11,
  },
  c2_war: {
    title: 'Into the woods.',
    lines: [
      'Behind you, smoke over the settlement, and horns along the line, and nobody looking for one branded girl and a dog.',
      'You did that. You will be thinking about it for a long time.',
      'Ahead, the trees, dark and quiet, and the dog, already a little way in, waiting for you.',
    ],
    coda: 'End of Chapter 2',
    chapter: 2,
    retryDay: 11,
  },
  ...chapter3Endings(),
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
 * Chapter 3's endings (Day 8): on your balcony after "Join me." (no answer: designer). A title by the broadcast
 * (designer: defying him makes you a thorn in the side of the king, its lines his; backing him, something about your loyalty; draft
 * titles), the city, your hand and your father by the broadcast, and your friend by the escape (plan). Draft
 * text. Ids `c3_<backed|defied|middle>_<out|alone>`.
 */
function chapter3Endings(): Record<string, { title: string; lines: string[]; retryDay: number; coda: string; chapter: 3 }> {
  const broadcasts = {
    backed: {
      title: 'Your father\u2019s son.',
      lines: [
        'Below you, a city gone quiet.',
        'Your hand is out there now, chalking the wing on the walls.',
        'Your father trusts you. You\u2019ll have to decide, every morning, whether you deserve it.',
      ],
    },
    defied: {
      title: 'A thorn in the side of the king.',
      lines: [
        'Below you, a city chanting your name, for you are giving them hope.',
        'A hand at your side, to guide you.',
        'By night, he\u2019s out in the city, chalking the wing on the walls.',
        'Your father hasn\u2019t spoken to you since. He will.',
      ],
    },
    middle: {
      title: 'The weight of the crown.',
      lines: [
        'Below you, a city waiting to find out what you meant.',
        'Your hand keeps his distance now. Polite. Watching.',
        'By night, he\u2019s out in the city, chalking the wing on the walls.',
        'Your father has started telling you things. Not everything. Not yet.',
      ],
    },
  };
  const friend = {
    out: 'Somewhere on the road, your friend.',
    alone: 'Somewhere on the road, your friend. He didn\u2019t say goodbye.',
  };
  const endings: Record<string, { title: string; lines: string[]; retryDay: number; coda: string; chapter: 3 }> = {};
  for (const [b, e] of Object.entries(broadcasts))
    for (const [f, line] of Object.entries(friend)) endings[`c3_${b}_${f}`] = { title: e.title, lines: [...e.lines, line], coda: 'End of Chapter 3', chapter: 3, retryDay: 8 };
  return endings;
}

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
      ...(ending.coda && !ending.chapter ? [{ label: 'Begin Chapter 2', run: () => beginChapter2(this) }] : []),
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
