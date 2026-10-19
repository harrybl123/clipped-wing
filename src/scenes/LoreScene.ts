import Phaser from 'phaser';
import { GAME_HEIGHT as H, GAME_WIDTH as W } from '../config';
import { getSession } from '../session';
import { typeLine, VOICES, type TypedLetter, type VoiceId } from '../systems/voices';
import { DialogueBox } from '../ui/DialogueBox';
import { LORE_PANELS, LORE_PICTURE_H } from '../ui/loreArt';
import { paintTree } from './MapScene';
import { SHADES } from '../ui/pixelArt';
import { makePaintedTexture, makeSpriteTexture } from '../ui/pixelTextures';
import { PixelText } from '../ui/PixelText';
import { MORE_ARROW } from '../ui/sprites';
import { playSyllable } from '../ui/voice';
import { startLoreMusic, type LoreMusic } from '../ui/loreMusic';
import { playSound, type SoundId } from '../ui/soundscape';
import type { AreaSceneData } from './AreaScene';

// Someone tells you how the world is, staged like the prologue (designer): their words under moving
// pictures, almost frame by frame (the pictures in src/ui/loreArt.ts). Grounded at the lookout on
// Chapter 4's first day (story/canopy/lore.ink). It steps through an ink knot itself:
//   #panel:<id>[:<beat>]  a new picture fades in (at that beat)
//   #beat:<n>             the picture moves on
//   #narration            the line is theirs, typed out under the picture in their voice (or silent: `voice: 'none'`)
//   #flash[:dark]         a flash of light (or of dark); #sound:<id> a sound; #black the picture fades to black
//   (#speaker:<id>)       anyone else (you), in the dialogue box
//   #end                  after this line, back to the area (`back`, which can play a knot on arrival)
// Choices, if any, are menus in the dialogue box.

export interface LoreSceneData {
  knot: string;
  /** Whose voice the narration is in (`none`: silent, your own thoughts, as the prologue's narration). */
  voice: VoiceId | 'none';
  /** The telling's music under it (designer: philosophical, soft). */
  music?: boolean;
  /** A title card on arrival back in the area (the day's, after an opening cinematic). */
  back: AreaSceneData;
}

export class LoreScene extends Phaser.Scene {
  private params!: LoreSceneData;
  private dialogue!: DialogueBox;
  private pictures!: Phaser.GameObjects.Container;
  private moving!: Phaser.GameObjects.Graphics;
  private words!: PixelText;
  private arrow!: Phaser.GameObjects.Image;
  private panel: string | null = null;
  private beat = 0;
  private panelAt = 0;
  private beatAt = 0;
  private typing: { letters: TypedLetter[]; index: number; wait: number } | null = null;
  private waiting = false;
  private ending = false;
  private endAfter = false;
  private music: LoreMusic | null = null;

  constructor() {
    super('Lore');
  }

  init(data: LoreSceneData): void {
    this.params = data;
    this.panel = null;
    this.beat = 0;
    this.typing = null;
    this.waiting = false;
    this.ending = false;
    this.endAfter = false;
  }

  create(): void {
    this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0);
    this.pictures = this.add.container(0, 0);
    this.moving = this.add.graphics().setDepth(5);
    // The band for the words, over the foot of the picture (as the prologue's stills).
    this.add.rectangle(0, LORE_PICTURE_H, W, H - LORE_PICTURE_H, 0x000000, 0.8).setOrigin(0).setDepth(8);
    this.words = new PixelText(this, 0, 0, '', { color: SHADES.light, wrapWidth: 420, centred: true }).setDepth(9).setVisible(false);
    this.arrow = this.add.image(0, 0, makeSpriteTexture(this, 'more-arrow', MORE_ARROW.rows, MORE_ARROW.colours)).setDepth(9).setVisible(false);
    this.tweens.add({ targets: this.arrow, y: '+=1', duration: 400, yoyo: true, repeat: -1 });
    this.dialogue = new DialogueBox(this, getSession(this).story);

    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (!e.repeat && [' ', 'enter', 'e'].includes(e.key.toLowerCase())) this.press();
    });
    this.input.on('pointerdown', () => this.press());

    getSession(this).story.startKnot(this.params.knot);
    if (this.params.music) this.music = startLoreMusic(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.music?.stop());
    this.cameras.main.fadeIn(1200);
    this.time.delayedCall(900, () => this.next());
  }

  override update(time: number, delta: number): void {
    this.drawMoving(time);
    this.tickTyping(delta);
  }

  // --- The pictures ---

  private showPanel(id: string, beat: number): void {
    const panel = LORE_PANELS[id];
    if (!panel) return;
    const key = `lore-${id}`;
    // (`belief` is the prologue's own picture of the tree, as the tree believes it.)
    if (!this.textures.exists(key)) makePaintedTexture(this, key, W, H, id === 'belief' ? paintTree() : panel.paint);
    // The new picture fades in over the old; the old goes once it's covered.
    const old = [...this.pictures.list];
    const image = this.add.image(0, 0, key).setOrigin(0).setAlpha(0);
    this.pictures.add(image);
    this.moving.setAlpha(0);
    this.tweens.add({ targets: [image, this.moving], alpha: 1, duration: 900, ease: 'Sine.easeInOut', onComplete: () => old.forEach((o) => o.destroy()) });
    this.panel = id;
    this.beat = beat;
    this.panelAt = this.beatAt = this.time.now;
  }

  private drawMoving(now: number): void {
    const g = this.moving;
    g.clear();
    const panel = this.panel ? LORE_PANELS[this.panel] : undefined;
    if (!panel) return;
    for (const r of panel.frame({ beat: this.beat, since: (now - this.beatAt) / 1000, t: (now - this.panelAt) / 1000 })) {
      g.fillStyle(r.c, r.a ?? 1).fillRect(r.x, r.y, r.w, r.h);
    }
  }

  // --- Stepping through the ink ---

  private next(): void {
    if (this.ending) return;
    const { story } = getSession(this);
    let line = story.canContinue ? story.nextLine() : null;
    while (line && line.text.trim() === '' && line.tags.length === 0 && story.canContinue) line = story.nextLine();
    if (!line) return this.finish();
    const tags = line.tags;
    const tag = (name: string) => tags.find((t) => t === name || t.startsWith(`${name}:`))?.split(':').slice(1);
    const panel = tag('panel');
    if (panel?.[0]) this.showPanel(panel[0], Number(panel[1] ?? 0));
    const beat = tag('beat');
    if (beat?.[0] !== undefined && !panel) {
      this.beat = Number(beat[0]);
      this.beatAt = this.time.now;
    }
    // A flash of light (bursting out of the tube), a sound, or the picture going to black.
    const flash = tag('flash');
    if (flash) this.cameras.main.flash(900, ...(flash[0] === 'dark' ? [0, 0, 0] : [255, 255, 250]) as [number, number, number]);
    for (const id of tag('sound') ?? []) playSound(this, id as SoundId);
    if (tags.includes('black')) {
      this.tweens.add({ targets: [...this.pictures.list, this.moving], alpha: 0, duration: 900 });
      this.panel = null;
    }
    this.endAfter = tags.includes('end');
    const choices = story.canContinue ? [] : story.choices();
    if (choices.length) {
      this.dialogue.openMenu(line.text, choices.map((c) => ({ label: c.text, run: () => (story.choose(c.index), this.time.delayedCall(150, () => this.next())) })));
      return;
    }
    if (tags.includes('narration')) return this.say(line.text);
    this.dialogue.line(line.text, tags, () => this.afterLine());
  }

  private afterLine(): void {
    if (this.endAfter) this.finish();
    else this.time.delayedCall(120, () => this.next());
  }

  /** Their words under the picture, typed out in their voice. */
  private say(text: string): void {
    this.words.setText(text).setRevealed(0).setVisible(true).setAlpha(1);
    const x = Math.round((W - this.words.width) / 2);
    const y = LORE_PICTURE_H + Math.round((H - LORE_PICTURE_H - this.words.height) / 2) - 2;
    this.words.setPosition(x, y);
    this.arrow.setPosition(W / 2, y + this.words.height + 6).setVisible(false);
    const voice = this.params.voice === 'none' ? undefined : VOICES[this.params.voice];
    this.typing = { letters: typeLine(this.words.laidOut, voice), index: 0, wait: 0 };
    this.waiting = false;
  }

  private tickTyping(delta: number): void {
    const t = this.typing;
    if (!t) return;
    t.wait -= delta / 1000;
    while (t.wait <= 0 && t.index < t.letters.length) {
      const letter = t.letters[t.index]!;
      t.index++;
      this.words.setRevealed(t.index);
      if (letter.syllable && this.params.voice !== 'none') playSyllable(this, VOICES[this.params.voice], letter.syllable);
      t.wait += t.letters[t.index]?.delay ?? 0;
    }
    if (t.index >= t.letters.length) this.doneTyping();
  }

  private doneTyping(): void {
    this.typing = null;
    this.words.setRevealed(null);
    this.waiting = true;
    this.arrow.setVisible(true);
  }

  private press(): void {
    if (this.typing) return this.doneTyping();
    if (!this.waiting) return;
    this.waiting = false;
    this.arrow.setVisible(false);
    this.tweens.add({ targets: this.words, alpha: 0, duration: 250, onComplete: () => (this.endAfter ? this.finish() : this.next()) });
  }

  private finish(): void {
    if (this.ending) return;
    this.ending = true;
    this.music?.stop();
    this.cameras.main.fadeOut(1400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Area', this.params.back));
  }
}
