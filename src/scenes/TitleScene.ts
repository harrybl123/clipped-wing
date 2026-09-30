import Phaser from 'phaser';
import { css, GAME_HEIGHT, GAME_WIDTH, PALETTE } from '../config';
import { addCarvedBands, addFungus, addTube } from '../ui/scenery';
import { TEXTURES } from './PreloadScene';

// Placeholder title screen, visual only: looking up the trunk at the tube rising into the
// white Canopy, with the menu carved beside it. Only New Game does anything yet.
// Parked menu ideas live in docs/ideas.md.

const FONT = 'Georgia, serif';
const TUBE_X = 1380;
const FLOOR_Y = 1010;
const MENU_X = 300;
const MENU_Y = 580;
const MENU_SPACING = 72;

interface MenuItem {
  label: string;
  action: () => void;
}

export class TitleScene extends Phaser.Scene {
  private phase: 'gate' | 'menu' | 'leaving' = 'gate';
  private items: Phaser.GameObjects.Text[] = [];
  private selected = 0;
  private cursor!: Phaser.GameObjects.Container;
  private pressAnyKey!: Phaser.GameObjects.Text;
  private notice!: Phaser.GameObjects.Text;
  private menu: MenuItem[] = [];

  constructor() {
    super('Title');
  }

  create(): void {
    this.phase = 'gate';
    this.items = [];
    this.selected = 0;
    this.cameras.main.setBackgroundColor(css('carvedWood')).fadeIn(1500);

    this.drawWorld();

    this.add.text(MENU_X - 20, 330, 'Clipped Wing', { fontFamily: FONT, fontSize: '140px', color: css('canopyWhite') });

    this.pressAnyKey = this.add.text(MENU_X, MENU_Y, 'press any key', { fontFamily: FONT, fontSize: '36px', color: css('canopyWhite') });
    this.tweens.add({ targets: this.pressAnyKey, alpha: 0.3, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.menu = [
      { label: 'New Game', action: () => this.startGame() },
      { label: 'Continue', action: () => this.showNotice('Continue isn’t built yet.') },
      { label: 'Settings', action: () => this.showNotice('Settings aren’t built yet.') },
      { label: 'Credits', action: () => this.showNotice('Credits aren’t built yet.') },
    ];
    this.buildMenu();

    this.add
      .text(GAME_WIDTH - 24, GAME_HEIGHT - 20, '[placeholder title screen]', { fontFamily: FONT, fontSize: '22px', color: css('canopyWhite') })
      .setOrigin(1, 1)
      .setAlpha(0.35);

    this.input.keyboard?.on('keydown', this.handleKey, this);
    this.input.on('pointerdown', () => this.phase === 'gate' && this.openMenu());
  }

  /** Looking up the inside of the trunk: carved wall, the tube, the Canopy's glare, roots below. */
  private drawWorld(): void {
    addCarvedBands(this, GAME_WIDTH, GAME_HEIGHT, 0);

    // The Canopy: a blinding white glare at the top that the tube disappears into.
    this.add.image(TUBE_X, -120, TEXTURES.softGlow).setDisplaySize(2600, 900).setTint(PALETTE.canopyWhite).setAlpha(0.55).setBlendMode(Phaser.BlendModes.ADD);
    this.add.image(TUBE_X, -40, TEXTURES.softGlow).setDisplaySize(900, 420).setTint(PALETTE.canopyWhite).setAlpha(0.9).setBlendMode(Phaser.BlendModes.ADD);

    // Distant amber lamps of the upper branches, high on the trunk.
    for (const [x, y, s] of [
      [980, 170, 0.5], [1120, 240, 0.35], [1640, 200, 0.45], [1790, 290, 0.3], [1540, 120, 0.3],
    ] as const) {
      const halo = this.add.image(x, y, TEXTURES.softGlow).setScale(s).setTint(PALETTE.lampAmber).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: halo, alpha: 0.25, duration: Phaser.Math.Between(1600, 2800), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.add.circle(x, y, 5 * s * 2, PALETTE.lampAmber, 0.9);
    }

    addTube(this, TUBE_X, -40, GAME_HEIGHT + 40, 70);

    // Roots and fungi along the bottom.
    this.add.rectangle(GAME_WIDTH / 2, FLOOR_Y + 60, GAME_WIDTH, 120, PALETTE.carvedWood).setStrokeStyle(2, PALETTE.canopyWhite, 0.15);
    for (const [x, size] of [[160, 0.8], [260, 1.1], [360, 0.6], [1060, 0.7], [1700, 1.2], [1820, 0.7]] as const) {
      addFungus(this, x, FLOOR_Y, size);
    }
  }

  private buildMenu(): void {
    for (const [i, item] of this.menu.entries()) {
      const text = this.add
        .text(MENU_X + 70, MENU_Y + i * MENU_SPACING, item.label, { fontFamily: FONT, fontSize: '48px', color: css('canopyWhite') })
        .setAlpha(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => this.phase === 'menu' && this.select(i))
        .on('pointerdown', () => this.phase === 'menu' && this.activate());
      this.items.push(text);
    }
    this.cursor = this.makeBirdCursor().setAlpha(0);
    this.notice = this.add
      .text(MENU_X + 70, MENU_Y + this.menu.length * MENU_SPACING + 20, '', { fontFamily: FONT, fontSize: '28px', color: css('canopyWhite') })
      .setAlpha(0);
  }

  /**
   * A small red carved bird with one heavy, clipped wing: the selection cursor.
   * (Red is reserved for birds and the protagonist.)
   */
  private makeBirdCursor(): Phaser.GameObjects.Container {
    const g = this.add.graphics();
    g.fillStyle(PALETTE.offeringRed);
    g.fillEllipse(0, 0, 40, 22); // body
    g.fillCircle(17, -9, 9); // head
    g.fillTriangle(24, -12, 34, -8, 24, -5); // beak
    g.fillTriangle(-18, -2, -32, -10, -30, 6); // tail
    g.fillStyle(PALETTE.carvedWood, 0.35);
    g.fillTriangle(-8, -6, 8, -6, -2, 6); // clipped wing, heavy and short
    const bird = this.add.container(MENU_X + 20, MENU_Y + 28, [g]);
    this.tweens.add({ targets: g, y: -5, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return bird;
  }

  private openMenu(): void {
    if (this.phase !== 'gate') return;
    this.phase = 'menu';
    this.tweens.killTweensOf(this.pressAnyKey);
    this.tweens.add({ targets: this.pressAnyKey, alpha: 0, duration: 300 });
    this.tweens.add({ targets: this.items, alpha: 0.55, duration: 600, delay: this.tweens.stagger(80, {}) });
    this.tweens.add({ targets: this.cursor, alpha: 1, duration: 600, delay: 200 });
    this.select(0);
  }

  private select(index: number): void {
    this.selected = (index + this.items.length) % this.items.length;
    for (const [i, text] of this.items.entries()) {
      this.tweens.add({ targets: text, alpha: i === this.selected ? 1 : 0.55, x: MENU_X + 70 + (i === this.selected ? 12 : 0), duration: 180 });
    }
    this.tweens.add({ targets: this.cursor, y: MENU_Y + this.selected * MENU_SPACING + 28, duration: 180, ease: 'Sine.easeOut' });
  }

  private activate(): void {
    this.menu[this.selected]?.action();
  }

  private showNotice(message: string): void {
    this.notice.setText(message);
    this.tweens.killTweensOf(this.notice);
    this.notice.setAlpha(0.7);
    this.tweens.add({ targets: this.notice, alpha: 0, delay: 1800, duration: 600 });
  }

  private startGame(): void {
    this.phase = 'leaving';
    this.cameras.main.fadeOut(700, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('TestArea'));
  }

  private handleKey(event: KeyboardEvent): void {
    if (event.repeat) return;
    if (this.phase === 'gate') {
      this.openMenu();
      return;
    }
    if (this.phase !== 'menu') return;
    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        this.select(this.selected - 1);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        this.select(this.selected + 1);
        break;
      case 'Enter':
      case ' ':
      case 'e':
      case 'E':
        this.activate();
        break;
    }
  }
}
