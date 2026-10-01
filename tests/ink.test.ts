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
    expect(v['objective_target']).toBe('roots-market:ration-hatch');

    // The hatch is compulsory; then one visit, your friend or the thin man, not both.
    const food = v['food_store'] as number;
    play('offering_floor_grumbler', 2, 0);
    expect(v['suspicion']).toBe(1);
    expect(v['day2']).toBe('afternoon');
    expect(play('friends_home_friend').text).toContain("isn't time");
    expect(play('market_ration_hatch', 0).tags).toContain('time:evening');
    expect(v['food_store']).toBe(food + 1);
    expect(v['objective_target']).toBe('offering-floor:tender');

    const rejection = play('offering_floor_tender', 2);
    expect(rejection.tags).toEqual(expect.arrayContaining(['show:rejected-bird', 'recoil', 'goto:home:130:236:day2_mum_burn']));
    expect(v['suspicion']).toBe(3);

    play('day2_mum_burn', 0);
    expect(v['objective_target']).toBe('home:hearth');
    expect(play('home_hearth', 0, 0).tags).toContain('decode:message1:day2_decoded');
    // The big choice asks you to be sure: thinking again goes back to the choice.
    play('day2_decoded', 1, 1, 1, 0);
    expect(v['reply1']).toBe('usual');
    expect(v['times_ignored']).toBe(1);
    play('home_hiding_spot');
    expect(play('home_bed', 0).tags).toContain('endday:Day 3');
    expect(v['day2']).toBe('done');
  });

  it('plays Day 3 through: the carving, the rite, the girl, the window, the second rejection, hiding, confiding', () => {
    const story = new Story(readFileSync(compileInk().outFile, 'utf8'));
    const v = story.variablesState;
    const play = (knot: string, ...choices: number[]) => {
      story.ChoosePathString(knot);
      const tags: string[] = [];
      for (;;) {
        while (story.canContinue) {
          story.Continue();
          tags.push(...(story.currentTags ?? []));
        }
        const next = choices.shift();
        if (next === undefined || story.currentChoices.length === 0) break;
        story.ChooseChoiceIndex(next);
      }
      return tags;
    };
    Object.entries({ dialogue_style: 'voice', day1: 'done', day2: 'done', day3: 'wake', reply1: 'fledgling', friend_trust: 1 }).forEach(([k, x]) => (v[k] = x));
    play('home_mum');
    expect(play('home_bench', 0)).toContain('carve:day3_carving');
    expect(play('day3_carving', 0, 0, 1)).toEqual(expect.arrayContaining(['step:rough', 'step:eye', 'end']));
    expect(v['fledgling_wing']).toBe('left');
    expect(play('offering_floor_tender')).toContain('show:girl-rite');
    expect(play('offering_floor_girl_rite', 2, 1, 0, 0)).toContain('goto:lower-roots:80:360:day3_lower_roots');
    expect(v['girl_with_you']).toBe(true);
    expect(play('back_routes_window', 2, 0)).toEqual(expect.arrayContaining(['show:friend-window', 'time:evening']));
    expect(v['routes_collapsing']).toBe(true);
    const food = v['food_store'] as number;
    expect(play('offering_floor_tender', 0, 0)).toEqual(expect.arrayContaining(['throw', 'goto:home:130:236:day3_mum_night']));
    expect(v['food_store']).toBe(food - 2);
    play('day3_mum_night');
    expect(play('home_hearth')).toContain('decode:message2:day3_decoded');
    expect(play('day3_decoded')).toContain('when:evidence_left:day3_visit');
    play('day3_hide_plate');
    expect(v['objective']).toBe('Hide everything (2 left)');
    expect(v['objective_target']).toBe('home:evidence-shavings');
    play('day3_hide_bird');
    play('day3_hide_shavings');
    expect(v['evidence_left']).toBe(0);
    play('day3_visit', 0);
    expect(v['confided']).toBe(true);
    expect(v['friend_trust']).toBe(2);
    expect(play('home_bed', 0)).toContain('endday:Day 4 (not built yet)');
  });

  it('ends the game loyally if you ignore the message a second time', () => {
    const story = new Story(readFileSync(compileInk().outFile, 'utf8'));
    story.variablesState['reply1'] = 'usual';
    story.ChoosePathString('day3_second_choice');
    story.ContinueMaximally();
    story.ChooseChoiceIndex(1); // ignore
    story.ContinueMaximally();
    story.ChooseChoiceIndex(0); // yes, stay loyal
    let tags: string[] = [];
    while (story.canContinue) {
      story.Continue();
      tags = [...tags, ...(story.currentTags ?? [])];
    }
    expect(tags).toContain('ending:loyal');
    expect(story.variablesState['times_ignored']).toBe(1);
  });
});
