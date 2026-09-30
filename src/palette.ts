/** Art-direction palette. Must match the table in CLAUDE.md exactly. Shades live in src/ui/pixelArt.ts.
 * Kept free of Phaser imports so logic modules and tests can use it. */
export const PALETTE = {
  /** The unknowable top of the tree */
  canopyWhite: 0xf4f1e8,
  /** The sacred tube */
  tubeCyan: 0xaef6f7,
  /** Warmth, wealth, the upper branches */
  lampAmber: 0xf2b45a,
  /** Fungi of the lower roots */
  rootGreen: 0x6fe0c0,
  /** Reserved: birds and the protagonist only */
  offeringRed: 0xd8323a,
  /** The tree itself */
  carvedWood: 0x2a221b,
} as const;
