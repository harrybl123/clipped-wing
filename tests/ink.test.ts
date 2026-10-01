import { readFileSync } from 'node:fs';
import { Story } from 'inkjs';
import { describe, expect, it } from 'vitest';
import { compileInk } from '../scripts/ink.mjs';

describe('ink pipeline', () => {
  it('compiles story/main.ink to JSON the runtime can load', () => {
    const result = compileInk();
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);

    const story = new Story(readFileSync(result.outFile, 'utf8'));
    expect(story.variablesState['suspicion']).toBe(0);
    expect(story.variablesState['food_store']).toBe(8);
    expect(story.variablesState['dialogue_style']).toBe('');
  });

  it('has Mum ask how you are the first time, and remembers your dialogue style', () => {
    const story = new Story(readFileSync(compileInk().outFile, 'utf8'));
    story.ChoosePathString('home_mum');
    expect(story.ContinueMaximally()).toContain('How are you feeling');
    expect(story.currentChoices).toHaveLength(3);
    story.ChooseChoiceIndex(1);
    story.ContinueMaximally();
    expect(story.variablesState['dialogue_style']).toBe('joke');
    story.ChoosePathString('home_mum');
    expect(story.ContinueMaximally()).not.toContain('How are you feeling');
  });

  it('has a prologue ending in #end', () => {
    const story = new Story(readFileSync(compileInk().outFile, 'utf8'));
    story.ChoosePathString('prologue');
    let tags: string[] = [];
    while (story.canContinue) {
      story.Continue();
      tags = story.currentTags ?? [];
    }
    expect(tags).toContain('end');
  });

  it('plays Day 2 through: the rite, two visits, the rejection, the fire, the decoding and the choice', () => {
    const story = new Story(readFileSync(compileInk().outFile, 'utf8'));
    const v = story.variablesState;
    const play = (knot: string, ...choices: number[]) => {
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
    v['dialogue_style'] = 'hide';
    v['day1'] = 'done';
    v['day2'] = 'wake';
    play('home_mum');
    play('home_bench', 0);
    expect(v['objective_target']).toBe('offering-floor:tender');
    expect(play('offering_floor_tender').tags).toContain('time:afternoon');
    expect(v['visits_left']).toBe(2);

    play('home_mum');
    expect(v['objective']).toContain('1 visit left');
    expect(play('home_mum').text).toContain('already');
    const food = v['food_store'] as number;
    expect(play('market_ration_hatch', 0).tags).toContain('time:evening');
    expect(v['food_store']).toBe(food + 1);
    expect(v['objective_target']).toBe('offering-floor:tender');

    const rejection = play('offering_floor_tender', 2);
    expect(rejection.tags).toEqual(expect.arrayContaining(['show:rejected-bird', 'recoil', 'goto:home:130:236:day2_mum_burn']));
    expect(v['suspicion']).toBe(2);

    play('day2_mum_burn', 0);
    expect(v['objective_target']).toBe('home:hearth');
    expect(play('home_hearth', 0, 0).tags).toContain('decode:message1:day2_decoded');
    play('day2_decoded', 1);
    expect(v['reply1']).toBe('usual');
    expect(v['times_ignored']).toBe(1);
    play('home_hiding_spot');
    expect(play('home_bed', 0).tags).toContain('endday:Day 3 (not built yet)');
    expect(v['day2']).toBe('done');
  });
});
