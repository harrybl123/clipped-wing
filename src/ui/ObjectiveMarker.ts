import Phaser from 'phaser';
import { SHADES } from './pixelArt';
import { makeSpriteTexture } from './pixelTextures';
import { PixelText } from './PixelText';
import { BIRD } from './sprites';

/**
 * What to do next: a short line at the top-left of the screen with a little red bird beside it, and a
 * red bird bobbing over the place to go (a person, an object, or the door on the way), or one over
 * each place when it's a choice. Red is reserved
 * for birds, so the marker is one. The story sets the objective (ink variables); the scene works out
 * where to point.
 */
export class ObjectiveMarker {
  private readonly hud: Phaser.GameObjects.Container;
  private readonly text: PixelText;
  private readonly plate: Phaser.GameObjects.Rectangle;
  /** One bird per place to go (an objective can offer a choice: your friend or the thin man). */
  private readonly markers: Phaser.GameObjects.Container[] = [];
  private readonly birdKey: string;

  constructor(private readonly scene: Phaser.Scene) {
    const bird = makeSpriteTexture(scene, 'bird', BIRD.rows, BIRD.colours);
    this.birdKey = bird;
    this.plate = scene.add.rectangle(0, 0, 1, 1, SHADES.shadow, 0.8).setOrigin(0).setScrollFactor(0);
    const icon = scene.add.image(6, 5, bird).setOrigin(0).setScrollFactor(0);
    this.text = new PixelText(scene, 20, 5, '', { color: SHADES.light }).setScrollFactor(0);
    this.hud = scene.add.container(0, 0, [this.plate, icon, this.text]).setDepth(26).setScrollFactor(0).setVisible(false);
  }

  /** A marker bird that bobs inside a container, so moving the container doesn't fight the bob tween. */
  private marker(i: number): Phaser.GameObjects.Container {
    let m = this.markers[i];
    if (!m) {
      const markerBird = this.scene.add.image(0, 0, this.birdKey).setOrigin(0.5, 1);
      m = this.scene.add.container(0, 0, [markerBird]).setDepth(24).setVisible(false);
      this.scene.tweens.add({ targets: markerBird, y: -3, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 150 });
      this.markers[i] = m;
    }
    return m;
  }

  /** Shows the objective line, or hides it (and the markers) when there's nothing to do. */
  setObjective(text: string): void {
    this.hud.setVisible(text !== '');
    if (!text) {
      this.markers.forEach((m) => m.setVisible(false));
      return;
    }
    this.text.setText(text);
    this.plate.setPosition(2, 2).setSize(this.text.x + this.text.width + 4 - 2, 13);
  }

  /** Puts a marker bird at each place (its feet), hiding the rest. */
  pointAt(points: { x: number; y: number }[]): void {
    points.forEach((at, i) => this.marker(i).setVisible(this.hud.visible).setPosition(Math.round(at.x), Math.round(at.y)));
    this.markers.slice(points.length).forEach((m) => m.setVisible(false));
  }
}
