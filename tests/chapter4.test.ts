import { Story } from 'inkjs';
import { describe, expect, it } from 'vitest';
import { LORE_PANELS, LORE_PICTURE_H, LORE_W } from '../src/ui/loreArt';
import { storyJson } from './compiledStory';

/** Plays a knot through, taking the given choices in turn; returns its text and tags. */
function player(story: Story) {
  return (knot: string, ...choices: number[]) => {
    story.ChoosePathString(knot);
    let text = '';
    const tags: string[] = [];
    for (;;) {
      while (story.canContinue) {
        text += story.Continue();
        tags.push(...(story.currentTags ?? []));
      }
      const next = choices.shift();
      if (next === undefined || story.currentChoices.length === 0) break;
      story.ChooseChoiceIndex(next);
    }
    return { text, tags };
  };
}

describe('Chapter 4, Day 1', () => {
  it('up the tube: the master, Grounded, the seed, the great house, the hall, the child, the lookout, bed', () => {
    const story = new Story(storyJson());
    const v = story.variablesState;
    const play = player(story);
    v['c4_left'] = 'tube';
    v['seed'] = 'healthy';
    expect(play('c4day1_tube').text).toContain('Nobody');
    expect(v['c4_guide']).toBe('master');
    expect(v['objective_target']).toBe('groundeds-house:grounded-1');
    // At his house: ask what this is (deferred), then why you; then the cost.
    const house = play('c4day1_grounded', 0, 2, 0);
    expect(house.text).toContain('Is she all right');
    expect(house.text).toContain('heavy wing');
    expect(house.tags).toContain('leave:master-guide:10');
    expect(v['c4day1']).toBe('seed');
    expect(play('c4day1_seed').tags).toContain('time:afternoon');
    expect(v['c4day1']).toBe('look');
    // The master won't take you through until you've seen the sorting deck.
    play('c4day1_workshop');
    expect(v['c4day1']).toBe('look');
    play('c4day1_sorting');
    expect(v['c4day1_sorted']).toBe(true);
    play('c4day1_workshop');
    expect(v['c4day1']).toBe('hall');
    expect(play('c4day1_hall').tags).toContain('time:evening');
    expect(v['c4day1']).toBe('mess');
    // Grounded waits until you've eaten (and the child's owned up).
    play('c4day1_lookout');
    expect(v['c4day1']).toBe('mess');
    expect(play('c4day1_child').text).toContain('bit one');
    expect(play('c4day1_lookout').tags).toContain('lore:c4lore:c4day1_after_lore');
    expect(play('c4day1_after_lore', 2).tags).toContain('time:night');
    expect(v['objective_target']).toBe('ascended-hall:bed');
    const bed = play('c4day1_bed');
    expect(bed.tags.some((t) => t.startsWith('endday'))).toBe(true);
    expect(v['c4day1']).toBe('done');
  });

  it("out of the rot with the girl: the hunter tells you both to shut up, she's fed, and she's awake in the next bed", () => {
    const story = new Story(storyJson());
    const v = story.variablesState;
    const play = player(story);
    v['c4_left'] = 'rot';
    v['c4_girl'] = 'follows';
    v['seed'] = 'roots';
    expect(play('c4day1_rot').text).toContain('Shut the fuck up');
    expect(v['c4_guide']).toBe('hunter');
    play('c4day1_cage');
    expect(v['c4day1']).toBe('led');
    const house = play('c4day1_grounded', 2, 2);
    expect(house.tags).toContain('leave:girl-guide:10');
    expect(v['c4_girl']).toBe('mess');
    expect(play('c4day1_seed').text).toContain('The rot');
    play('c4day1_sorting');
    expect(play('c4day1_workshop').text).toContain('You know her face');
    play('c4day1_hall');
    play('c4day1_child');
    play('c4day1_lookout');
    play('c4day1_after_lore', 0);
    expect(v['c4_girl']).toBe('bed');
    expect(play('c4day1_bed').text).toContain('He showed me too');
  });

  it("Grounded's telling covers his list, panel by panel, and ends", () => {
    for (const left of ['tube', 'rot']) {
      const story = new Story(storyJson());
      story.variablesState['c4_left'] = left;
      const { text, tags } = player(story)('c4lore');
      for (const words of ['Join it, or be ruled by it', 'keeps the peace', 'Slaves', 'Imperfection', 'Scavengers', 'smaller', 'the king has to']) expect(text).toContain(words);
      expect(tags).toContain('end');
      for (const panel of tags.filter((t) => t.startsWith('panel:')).map((t) => t.split(':')[1]!)) expect(LORE_PANELS[panel], panel).toBeDefined();
    }
  });

  it("the telling's pictures draw on the picture, at every beat", () => {
    for (const [id, panel] of Object.entries(LORE_PANELS)) {
      for (let beat = 0; beat <= 3; beat++) {
        for (const since of [0, 0.7, 3, 9]) {
          for (const r of panel.frame({ beat, since, t: since + 2 })) {
            expect(Number.isInteger(r.x) && Number.isInteger(r.y) && r.w > 0 && r.h > 0, `${id} ${beat}`).toBe(true);
            // (Things may slip off the edge as they go, but nothing's drawn far off the picture.)
            expect(r.x > -60 && r.x < LORE_W + 60 && r.y > -60 && r.y < LORE_PICTURE_H + 60, `${id} ${beat} ${JSON.stringify(r)}`).toBe(true);
          }
        }
      }
    }
  });
});
