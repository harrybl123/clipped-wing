import Phaser from 'phaser';
import { GAME_WIDTH as W } from '../config';
import { getSession } from '../session';
import { DialogueBox } from '../ui/DialogueBox';
import { SHADES } from '../ui/pixelArt';
import { PixelText } from '../ui/PixelText';
import type { AreaSceneData } from './AreaScene';

// A close-up that steps through an ink knot itself (the carving, the fight): lines to read, choices as
// menus, and lines tagged #step:<name> that stay up while you play that step's little timing game.
// A line tagged #end finishes, and you're back in the area (`back`, which can play a knot on arrival).
// Subclasses draw the scene and run the steps; E, Space or a click calls press().

export interface StepSceneData {
  knot: string;
  /** Where to go back to afterwards. */
  back: AreaSceneData;
}

export abstract class StepScene extends Phaser.Scene {
  protected params!: StepSceneData;
  protected dialogue!: DialogueBox;
  protected hint!: PixelText;
  /** When the current step began, so the press that closed the last line doesn't count. */
  protected stepStarted = 0;
  private ending = false;

  init(data: StepSceneData): void {
    this.params = data;
    this.ending = false;
  }

  /** Whether this scene plays a step with that name. */
  protected abstract hasStep(name: string): boolean;
  protected abstract startStep(name: string): void;
  /** E, Space or a click. */
  protected abstract press(): void;
  /** Called with each line's tags before it's shown (e.g. #plate). */
  protected onLine(_tags: string[]): void {}

  /** Call at the end of create(), once the scene is drawn: keys, the dialogue box, and the first line. */
  protected begin(hintY: number): void {
    this.hint = new PixelText(this, 0, hintY, '', { color: SHADES.light, shadow: SHADES.shadow }).setDepth(20);
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (!e.repeat && (e.key === 'e' || e.key === 'E' || e.key === ' ')) this.tryPress();
    });
    this.input.on('pointerdown', () => this.tryPress());
    this.dialogue = new DialogueBox(this, getSession(this).story);
    getSession(this).story.startKnot(this.params.knot);
    this.cameras.main.fadeIn(800);
    this.time.delayedCall(700, () => this.next());
  }

  private tryPress(): void {
    if (this.time.now - this.stepStarted < 200) return;
    this.press();
  }

  /** The step is over: on to the next line. */
  protected endStep(delay = 450): void {
    this.setHint('');
    this.dialogue.close();
    this.time.delayedCall(delay, () => this.next());
  }

  /** The next ink line: a menu if choices follow it, a step for #step, else a line to read. */
  protected next(): void {
    const { story } = getSession(this);
    if (!story.canContinue) return this.finish();
    const line = story.nextLine();
    if (!line) return this.finish();
    const tags = line.tags;
    this.onLine(tags);
    const stepName = tags.find((t) => t.startsWith('step:'))?.slice(5);
    const choices = story.canContinue ? [] : story.choices();
    if (choices.length) {
      this.dialogue.openMenu(line.text, choices.map((c) => ({ label: c.text, run: () => (story.choose(c.index), this.time.delayedCall(150, () => this.next())) })));
    } else if (stepName && this.hasStep(stepName)) {
      this.dialogue.hold(line.text, tags);
      this.stepStarted = this.time.now;
      this.startStep(stepName);
    } else if (tags.includes('end')) {
      this.dialogue.line(line.text, tags, () => this.finish());
    } else {
      this.dialogue.line(line.text, tags, () => this.next());
    }
  }

  protected finish(): void {
    if (this.ending) return;
    this.ending = true;
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Area', this.params.back));
  }

  protected setHint(text: string): void {
    this.hint.setText(text).setX(Math.round((W - this.hint.width) / 2)).setVisible(text !== '');
  }
}
