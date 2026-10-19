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
  it('up the tube: the master leads you to Grounded, the seed, the tour, the telling, the child, bed', () => {
    const story = new Story(storyJson());
    const v = story.variablesState;
    const play = player(story);
    v['c4_left'] = 'tube';
    v['seed'] = 'healthy';
    expect(play('c4_rise').tags).toContain('end');
    const basin = play('c4day1_tube');
    expect(basin.text).toContain('What is this place?');
    expect(basin.text).not.toContain('gods');
    expect(v['c4_guide']).toBe('master');
    expect(v['c4day1']).toBe('led');
    expect(play('c4day1_tube_walk').tags).toContain('goto:groundeds-house:40:240:c4day1_grounded');
    // Each question once: what is this place, who are you, why me (deferred), then nothing left to ask.
    const house = play('c4day1_grounded', 0, 0, 0, 0);
    expect(house.text).toContain('Is she all right');
    expect(house.text).toContain('Tonight, I promise you');
    expect(house.text.match(/What is this place\?/g)).toHaveLength(1);
    expect(house.tags).toContain('goto:seed-bed:250:230:c4day1_seed');
    expect(play('c4day1_seed').tags).toContain('time:afternoon');
    expect(play('c4day1_sorting').text).toContain("Mum's.");
    expect(v['c4_mums_bird']).toBe(true);
    const workshop = play('c4day1_workshop');
    expect(workshop.text).toContain('We take some.');
    const hall = play('c4day1_hall');
    expect(hall.text).toContain('better off not knowing');
    expect(hall.text).toContain('he made sure');
    expect(v['c4day1']).toBe('lookout');
    expect(play('c4day1_lookout').tags).toContain('lore:c4lore:c4day1_after_lore');
    expect(play('c4day1_after_lore', 2).tags).toContain('time:night');
    expect(play('c4lore', 0).text).toContain('No slaves');
    const mess = play('c4day1_mess', 0);
    expect(mess.text).toContain('I bit one');
    expect(v['objective_target']).toBe('ascended-hall:bed');
    const bed = play('c4day1_bed');
    expect(bed.tags.some((t) => t.startsWith('endday'))).toBe(true);
    expect(v['c4day1']).toBe('done');
  });

  it("out of the rot with the girl: the hunter tells you both to shut up, leads you up, she's fed, and she's awake in the next bed", () => {
    const story = new Story(storyJson());
    const v = story.variablesState;
    const play = player(story);
    v['c4_left'] = 'rot';
    v['c4_girl'] = 'follows';
    v['seed'] = 'roots';
    expect(play('c4_crack').text).toContain('swearing');
    expect(play('c4day1_rot').text).toContain('Shut the fuck up');
    expect(v['c4_guide']).toBe('hunter');
    play('c4day1_cage');
    expect(v['c4day1']).toBe('platform');
    play('c4day1_cage_top');
    play('c4day1_platform_walk');
    const house = play('c4day1_grounded', 3);
    expect(house.tags).toContain('leave:girl-guide:0');
    expect(house.text).toContain('You know her face');
    expect(v['c4_girl']).toBe('mess');
    expect(v['c4_guide']).toBe('master');
    expect(play('c4day1_seed').text).toContain('The rot');
    play('c4day1_sorting');
    play('c4day1_workshop');
    play('c4day1_hall');
    play('c4day1_lookout');
    play('c4day1_after_lore', 0);
    play('c4day1_mess', 2);
    expect(v['c4_girl']).toBe('bed');
    expect(play('c4day1_bed').text).toContain('He told me too');
  });

  it('out of the rot alone: just you, and the hunter', () => {
    const story = new Story(storyJson());
    const play = player(story);
    story.variablesState['c4_left'] = 'rot';
    expect(play('c4_crack').text).toContain('alone');
    const out = play('c4day1_rot');
    expect(out.text).toContain('Just you');
    expect(out.text).not.toContain('Shut the fuck up');
  });

  it("Grounded's telling covers his list and the designer's notes, panel by panel, and ends", () => {
    for (const left of ['tube', 'rot']) {
      const story = new Story(storyJson());
      story.variablesState['c4_left'] = left;
      const { text, tags } = player(story)('c4lore', 1);
      for (const words of ['Join it, or be ruled by it', 'one mind', 'keeps the peace', 'Slaves', 'cleared away', 'Imperfection', 'learn from it', 'Then why me?', 'same heavy wing', 'I sent it anyway', 'Scavengers', 'medicine', 'It was never you', 'He\'ll have to come to us', 'the power you have now']) expect(text).toContain(words);
      expect(tags).toContain('end');
      for (const panel of tags.filter((t) => t.startsWith('panel:')).map((t) => t.split(':')[1]!)) expect(LORE_PANELS[panel], panel).toBeDefined();
    }
  });

  it("the telling's pictures draw on the picture, at every beat", () => {
    for (const [id, panel] of Object.entries(LORE_PANELS)) {
      for (let beat = 0; beat <= 4; beat++) {
        for (const since of [0, 0.7, 3, 9]) {
          for (const r of panel.frame({ beat, since, t: since + 2 })) {
            expect(Number.isInteger(r.x) && Number.isInteger(r.y) && r.w > 0 && r.h > 0, `${id} ${beat}`).toBe(true);
            // (Everything drawn is at least partly on the picture.)
            expect(r.x < LORE_W && r.x + r.w > 0 && r.y < LORE_PICTURE_H + 60 && r.y + r.h > 0, `${id} ${beat} ${JSON.stringify(r)}`).toBe(true);
          }
        }
      }
    }
  });
});
