import Phaser from 'phaser';
import { SHADES } from './pixelArt';
import { makeSpriteTexture } from './pixelTextures';
import { PixelText } from './PixelText';
import { BIRD } from './sprites';

/**
 * What to do next: a short line at the top-left of the screen with a little red bird beside it, and a
 * red bird bobbing over the place to go (a person, an object, or the door on the way). Red is reserved
 * for birds, so the marker is one. The story sets the objective (ink variables); the scene works out
 * where to point.
 */
export class ObjectiveMarker {
  private readonly hud: Phaser.GameObjects.Container;
  private readonly text: PixelText;
  private readonly plate: Phaser.GameObjects.Rectangle;
  private readonly marker: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    const bird = makeSpriteTexture(scene, 'bird', BIRD.rows, BIRD.colours);
    this.plate = scene.add.rectangle(0, 0, 1, 1, SHADES.shadow, 0.8).setOrigin(0).setScrollFactor(0);
    const icon = scene.add.image(6, 5, bird).setOrigin(0).setScrollFactor(0);
    this.text = new PixelText(scene, 20, 5, '', { color: SHADES.light }).setScrollFactor(0);
    this.hud = scene.add.container(0, 0, [this.plate, icon, this.text]).setDepth(26).setScrollFactor(0).setVisible(false);
    // The marker bird bobs inside a container, so moving the container doesn't fight the bob tween.
    const markerBird = scene.add.image(0, 0, bird).setOrigin(0.5, 1);
    this.marker = scene.add.container(0, 0, [markerBird]).setDepth(24).setVisible(false);
    scene.tweens.add({ targets: markerBird, y: -3, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  /** Shows the objective line, or hides it (and the marker) when there's nothing to do. */
  setObjective(text: string): void {
    this.hud.setVisible(text !== '');
    if (!text) {
      this.marker.setVisible(false);
      return;
    }
    this.text.setText(text);
    this.plate.setPosition(2, 2).setSize(this.text.x + this.text.width + 4 - 2, 13);
  }

  /** Puts the marker bird at (x, y) (its feet), or hides it. */
  pointAt(at: { x: number; y: number } | null): void {
    this.marker.setVisible(!!at && this.hud.visible);
    if (at) this.marker.setPosition(Math.round(at.x), Math.round(at.y));
  }
}
