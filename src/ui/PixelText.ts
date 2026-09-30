import Phaser from 'phaser';
import { drawLine, layout, LINE_HEIGHT } from './pixelFont';

export interface PixelTextStyle {
  color: number;
  /** Whole-number scale; each font pixel becomes scale × scale game pixels. */
  scale?: number;
  /** Wrap width in game pixels. */
  wrapWidth?: number;
  /** Colour of a hard 1-pixel drop shadow (down-right), if any. */
  shadow?: number;
}

let nextId = 0;

/** Text drawn with the pixel font into its own canvas texture. Redraws on setText/setColor. */
export class PixelText extends Phaser.GameObjects.Image {
  private readonly key: string;
  private content = '';
  private style: Required<Omit<PixelTextStyle, 'shadow'>> & { shadow: number | null };

  constructor(scene: Phaser.Scene, x: number, y: number, text: string, style: PixelTextStyle) {
    const key = `pixel-text-${nextId++}`;
    scene.textures.createCanvas(key, 1, 1);
    super(scene, x, y, key);
    this.key = key;
    this.style = { scale: 1, wrapWidth: Infinity, ...style, shadow: style.shadow ?? null };
    this.setOrigin(0);
    scene.add.existing(this);
    this.once(Phaser.GameObjects.Events.DESTROY, () => scene.textures.remove(key));
    this.setText(text);
  }

  get text(): string {
    return this.content;
  }

  setText(text: string): this {
    this.content = text;
    this.redraw();
    return this;
  }

  setColor(color: number): this {
    if (color !== this.style.color) {
      this.style.color = color;
      this.redraw();
    }
    return this;
  }

  private redraw(): void {
    const { scale, wrapWidth, color, shadow } = this.style;
    const { lines, width, height } = layout(this.content, wrapWidth / scale);
    const pad = shadow === null ? 0 : 1;
    const texture = this.scene.textures.get(this.key) as Phaser.Textures.CanvasTexture;
    texture.setSize(Math.max(1, width * scale + pad), Math.max(1, height * scale + pad));
    const ctx = texture.getContext();
    ctx.clearRect(0, 0, texture.width, texture.height);
    const pass = (fill: number, offset: number) => {
      ctx.fillStyle = `#${fill.toString(16).padStart(6, '0')}`;
      lines.forEach((line, i) => drawLine(ctx, line, offset, offset + i * LINE_HEIGHT * scale, scale));
    };
    if (shadow !== null) pass(shadow, 1);
    pass(color, 0);
    texture.refresh();
    this.setTexture(this.key);
    this.setSizeToFrame();
    if (this.input) this.input.hitArea.setSize(this.width, this.height);
  }
}
