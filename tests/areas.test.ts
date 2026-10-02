import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compileInk } from '../scripts/ink.mjs';
import { AREA_NAMES, AREAS, PLANNED_AREAS } from '../src/data/areas';
import type { AreaDefinition } from '../src/data/areas/types';
import { StoryBridge } from '../src/systems/StoryBridge';
import type { RowSprite } from '../src/ui/sprites';

/** Compiles the real story via the project script, so INCLUDEs resolve relative to story/. */
function compileStory(): StoryBridge {
  const result = compileInk();
  if (!result.ok) throw new Error(result.errors.join('\n'));
  return new StoryBridge(readFileSync(result.outFile, 'utf8'));
}

function spritesOf(area: AreaDefinition): [string, RowSprite][] {
  return [
    ...area.props.map((p, i) => [`prop ${i}`, p.sprite] as [string, RowSprite]),
    ...area.people.map((p) => [`person ${p.id}`, p.sprite] as [string, RowSprite]),
    ...area.features.flatMap((f) => ('sprite' in f ? [[`${f.type} feature`, f.sprite] as [string, RowSprite]] : [])),
  ];
}

describe.each(Object.values(AREAS))('area $id', (area) => {
  it('has well-formed sprites (equal-width rows, every character coloured or transparent)', () => {
    for (const [label, sprite] of spritesOf(area)) {
      expect(new Set(sprite.rows.map((r) => r.length)).size, `${label} row widths`).toBe(1);
      const unknown = [...new Set(sprite.rows.join(''))].filter((ch) => ch !== '.' && !(ch in sprite.colours));
      expect(unknown, `${label} uncoloured characters`).toEqual([]);
    }
  });

  it('keeps props inside the area', () => {
    for (const p of area.props) {
      expect(p.x >= 0 && p.y >= 0, `prop at ${p.x},${p.y}`).toBe(true);
      expect(p.x + p.sprite.rows[0]!.length <= area.width && p.y + p.sprite.rows.length <= area.height, `prop at ${p.x},${p.y}`).toBe(true);
    }
  });

  it('starts the player on a solid surface inside the hollow', () => {
    const { x, y } = area.playerStart;
    const c = area.cavity;
    expect(x > c.x && x < c.x + c.width && y > c.y && y <= c.y + c.height).toBe(true);
    expect(area.solids.some((s) => y === s.y && x >= s.x && x <= s.x + s.width)).toBe(true);
  });

  it('is one of the planned areas (or a hidden one, off the map), with the same name', () => {
    expect(AREA_NAMES[area.id]).toBe(area.name);
  });

  it('has exits that lead to planned areas', () => {
    for (const exit of area.exits) expect(Object.keys(PLANNED_AREAS), exit.id).toContain(exit.to);
  });

  it('puts every interactable, person and exit on a solid surface', () => {
    for (const it of [...area.interactables, ...area.people, ...area.exits]) {
      expect(area.solids.some((s) => it.y === s.y && it.x >= s.x && it.x <= s.x + s.width), it.id).toBe(true);
    }
  });

  it('only uses ink knots and variables that exist', () => {
    const story = compileStory();
    const knots = [...area.interactables.map((it) => it.knot), ...area.people.flatMap((p) => (p.knot ? [p.knot] : []))];
    for (const knot of knots) expect(() => story.startKnot(knot), knot).not.toThrow();
    for (const f of area.features) if (f.type === 'jars') expect(story.variableNames()).toContain(f.variable);
    const conditions = [...area.people.flatMap((p) => [p.showIf, p.hideIf].flat()), ...area.features.flatMap((f) => ('showIf' in f ? [f.showIf] : [])), ...(area.ambience ?? []).flatMap((l) => [l.showIf, l.hideIf].flat())];
    for (const name of conditions.filter((c): c is string => !!c)) expect(story.variableNames(), name).toContain(name);
  });
});
