import Phaser from 'phaser';
import { css, PALETTE } from '../config';
import { loadSession, saveSession, type Session } from '../session';

const HELP = [
  '` hide   T advance time   U use afternoon action',
  'K save   L load   X delete save',
].join('\n');

/**
 * Developer overlay, toggled with the backtick key: calendar state, live ink variables,
 * and keys to poke the systems by hand. The keys only work while the overlay is visible.
 */
export class DebugOverlay {
  private readonly text: Phaser.GameObjects.Text;
  private readonly background: Phaser.GameObjects.Rectangle;
  private message = '';
  private messageTimer: Phaser.Time.TimerEvent | null = null;
  private readonly unsubscribes: (() => void)[] = [];

  /** @param isBusy while this returns a reason, save/load are refused (e.g. mid-conversation). */
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly session: Session,
    private readonly isBusy: () => string | null = () => null,
  ) {
    this.background = scene.add.rectangle(24, 24, 10, 10, PALETTE.carvedWood, 0.85).setOrigin(0);
    this.text = scene.add.text(48, 44, '', {
      fontFamily: 'Menlo, Consolas, monospace',
      fontSize: '24px',
      color: css('canopyWhite'),
      lineSpacing: 6,
    });
    for (const o of [this.background, this.text]) o.setScrollFactor(0).setDepth(2000).setVisible(false);

    for (const name of session.story.variableNames()) {
      this.unsubscribes.push(session.story.observe(name, () => this.render()));
    }
    scene.input.keyboard?.on('keydown', this.handleKey, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.keyboard?.off('keydown', this.handleKey, this);
      for (const unsubscribe of this.unsubscribes) unsubscribe();
    });
  }

  get visible(): boolean {
    return this.text.visible;
  }

  toggle(): void {
    const visible = !this.visible;
    this.text.setVisible(visible);
    this.background.setVisible(visible);
    this.render();
  }

  private handleKey(event: KeyboardEvent): void {
    if (event.key === '`' || event.code === 'Backquote') {
      this.toggle();
      return;
    }
    if (!this.visible || event.repeat) return;
    const { calendar } = this.session;
    switch (event.key.toLowerCase()) {
      case 't':
        this.flash(calendar.advance() ? 'Time advanced.' : 'Already at the end of the week.');
        break;
      case 'u':
        this.flash(calendar.takeAfternoonAction() ? 'Afternoon action used.' : 'No afternoon action available now.');
        break;
      case 'k':
        this.flash(this.isBusy() ?? saveSession(this.session));
        break;
      case 'l':
        this.flash(this.isBusy() ?? loadSession(this.session));
        break;
      case 'x':
        this.session.saves.clear();
        this.flash('Save deleted.');
        break;
    }
  }

  private flash(message: string): void {
    this.message = message;
    this.messageTimer?.remove();
    this.messageTimer = this.scene.time.delayedCall(3000, () => {
      this.message = '';
      this.render();
    });
    this.render();
  }

  private render(): void {
    if (!this.visible) return;
    const { calendar, story, saves } = this.session;
    const left = calendar.afternoonActionsLeft;
    const variables = story.variableNames().map((name) => `  ${name} = ${JSON.stringify(story.getVariable(name))}`);
    this.text.setText(
      [
        'DEBUG',
        `Day: ${calendar.day}   Slot: ${calendar.slot}`,
        `Afternoon actions left: ${left === Infinity ? 'unlimited' : left}${calendar.slot === 'afternoon' ? '' : ' (not afternoon)'}`,
        'Ink variables:',
        ...(variables.length ? variables : ['  (none)']),
        `Save: ${!saves.isAvailable ? 'storage unavailable' : saves.hasSave() ? 'present' : 'none'}`,
        '',
        HELP,
        ...(this.message ? ['', `> ${this.message}`] : []),
      ].join('\n'),
    );
    this.background.setSize(this.text.width + 48, this.text.height + 40);
  }
}
