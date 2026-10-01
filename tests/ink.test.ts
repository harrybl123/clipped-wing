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
    expect(play('day3_decoded')).toContain('when:evidence_left:day3_visit:10');
    play('day3_hide_plate');
    expect(v['objective']).toBe('Hide everything (2 left)');
    expect(v['objective_target']).toBe('home:evidence-shavings');
    play('day3_hide_bird');
    play('day3_hide_shavings');
    expect(v['evidence_left']).toBe(0);
    play('day3_visit', 0);
    expect(v['confided']).toBe(true);
    expect(v['friend_trust']).toBe(2);
    expect(play('home_bed', 0)).toContain('endday:Day 4');
    expect(v['day4']).toBe('wake');
    expect(v['objective_target']).toBe('home:summons');
  });

  it('plays Day 4 through: the summons, the reply, the shrine, the market, the girl, the ritual, message 3, the night', () => {
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
    Object.entries({ dialogue_style: 'voice', day1: 'done', day2: 'done', day3: 'done', reply1: 'fledgling', day4: 'wake', summons_on_floor: true, food_store: 6 }).forEach(([k, x]) => (v[k] = x));
    expect(play('home_summons', 2)).toContain('inset:summons');
    expect(v['summons_on_floor']).toBe(false);
    expect(v['objective_target']).toBe('home:bench');
    expect(play('home_bench', 0)).toContain('carve:day4_carving');
    expect(play('day4_carving', 2)).toEqual(expect.arrayContaining(['plate:reply2', 'step:scratch', 'step:rough', 'step:hollow', 'step:seal', 'end']));
    expect(v['reply2']).toBe('why');
    expect(v['objective_target']).toBe('tenders-shrine:tender-summons');
    expect(v['mum_away']).toBe(true);
    // Two wrong answers and he asks to see your hands.
    expect(play('shrine_tender_summons', 2, 2, 2, 2, 1, 2, 2)).toEqual(expect.arrayContaining(['dim:on', 'time:afternoon']));
    expect(v['showed_hands']).toBe(true);
    expect(v['objective_target']).toBe('roots-market:mum-market');
    expect(play('market_mum', 0)).toEqual(expect.arrayContaining(['show:zealot-market', 'fight:day4_fight:day4_after_fight']));
    expect(v['food_store']).toBe(5);
    expect(play('day4_fight', 1)).toEqual(expect.arrayContaining(['step:dodge', 'step:shove', 'step:grab', 'end']));
    expect(v['fight_won']).toBe(false); // nothing landed (the fight scene counts the hits)
    expect(play('day4_after_fight')).toContain('show:girl-market');
    expect(v['hurt']).toBe(true);
    expect(v['food_store']).toBe(3);
    expect(play('market_girl', 0, 0)).toContain('time:evening');
    expect(v['girl_trust']).toBe(1);
    expect(v['objective_target']).toBe('offering-floor:chalk-ring');
    expect(play('offering_floor_chalk_ring', 0)).toEqual(expect.arrayContaining(['turn', 'goto:home:130:236:day4_mum_night']));
    expect(v['house_watched']).toBe(true);
    play('day4_mum_night');
    expect(play('home_hearth')).toContain('decode:message3_why:day4_decoded');
    expect(play('day4_decoded')).toContain('inset:feather');
    expect(v['sneaking']).toBe(true);
    expect(v['objective_target']).toBe('lower-roots:girls-door');
    expect(play('lower_roots_girls_door')).toContain('goto:girls-home:150:236:day4_girls_home');
    expect(v['sneaking']).toBe(false);
    play('day4_girls_home', 0);
    expect(play('girls_home_board')).toContain('goto:the-rot:40:232:day4_rot_arrive');
    expect(v['girl_with_you']).toBe(true);
    expect(play('the_rot_way_up')).not.toContain('goto:girls-home:200:236:day4_girls_goodbye'); // look at the wood first
    play('the_rot_dying_root', 0);
    expect(v['girl_trust']).toBe(2);
    expect(play('the_rot_way_up')).toContain('goto:girls-home:200:236:day4_girls_goodbye');
    expect(v['girl_with_you']).toBe(false);
    expect(play('day4_girls_goodbye', 2)).toContain('goto:home:440:236:day4_home_late');
    expect(play('home_bed', 0)).toContain('endday:Day 5');
    expect(v['day5']).toBe('wake');
    expect(v['day4']).toBe('done');
  });

  describe('Day 5', () => {
    const start = (truth: boolean) => {
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
      Object.entries({ dialogue_style: 'voice', day1: 'done', day2: 'done', day3: 'done', day4: 'done', reply1: 'fledgling', reply2: 'why', day5: 'wake', food_store: 6 }).forEach(([k, x]) => (v[k] = x));
      expect(play('home_bench', 0)).toContain('carve:day5_carving');
      expect(play('day5_carving', 1)).toEqual(expect.arrayContaining(['plate:reply3', 'step:scratch', 'step:hollow', 'step:seal', 'end']));
      expect(v['reply3']).toBe('take');
      expect(play('shrine_tender_summons', 2)).toContain('time:afternoon');
      expect(v['objective_target']).toBe('home:escort-home');
      expect(play('home_escort')).toContain('goto:middle-tiers:60:360:day5_checkpoint');
      expect(v['escorted']).toBe(true);
      // Big choice 2: tell him (0, then yes) or pander (1, then yes).
      expect(play('upper_archivist', 2, 2, truth ? 0 : 1, 0)).toEqual(expect.arrayContaining(['dim:on', 'dim:off', 'time:evening', 'goto:offering-floor:60:236']));
      expect(v['told_archivist']).toBe(truth);
      expect(play('offering_floor_chalk_ring', 0)).toEqual(expect.arrayContaining(['show:rejected-bird', 'goto:home:130:236:day5_mum_night']));
      expect(v['escorted']).toBe(false);
      play('day5_mum_night');
      expect(play('home_hearth')).toContain('decode:message4:day5_decoded');
      return { v, play };
    };

    it('if you told the archivist, you can go back up and he gives you a healthy seed', () => {
      const { v, play } = start(true);
      play('day5_decoded', 0);
      expect(v['day5']).toBe('archive');
      expect(v['objective_target']).toBe('archive:archivist-night');
      play('archive_archivist', 0, 2); // the wrong mark, then the right one
      expect(v['seed']).toBe('healthy');
      expect(play('home_bed', 0)).toContain('endday:Day 6 (not built yet)');
    });

    it('if you told him, you can still go to the lower roots, where the boy sells you a seed for food', () => {
      const { v, play } = start(true);
      play('day5_decoded', 1);
      expect(v['day5']).toBe('roots');
      play('lower_roots_girl');
      expect(v['objective_target']).toBe('lower-roots:dodger');
      play('lower_roots_dodger', 0, 0);
      expect(v['seed']).toBe('roots');
      expect(v['food_store']).toBe(4);
    });

    it("if you didn't, you try to steal one, get caught, and have to go to the roots", () => {
      const { v, play } = start(false);
      play('day5_decoded');
      expect(v['day5']).toBe('steal');
      expect(v['stealing']).toBe(true);
      expect(play('archive_drawers', 2)).toEqual(expect.arrayContaining(['show:archivist-catch', 'goto:trunk-climb:201:118']));
      expect(v['caught_stealing']).toBe(true);
      expect(v['stealing']).toBe(false);
      play('lower_roots_girl');
      play('lower_roots_dodger', 1);
      expect(v['seed']).toBe('roots');
      expect(v['food_store']).toBe(3);
    });
  });

  it('on Day 4, holding back at the market skips the fight, and winning it raises suspicion', () => {
    const story = new Story(readFileSync(compileInk().outFile, 'utf8'));
    const v = story.variablesState;
    v['day4'] = 'market';
    story.ChoosePathString('market_mum');
    story.ContinueMaximally();
    story.ChooseChoiceIndex(1);
    const tags: string[] = [];
    while (story.canContinue) {
      story.Continue();
      tags.push(...(story.currentTags ?? []));
    }
    expect(tags).toContain('show:girl-market');
    expect(tags.some((t) => t.startsWith('fight'))).toBe(false);
    expect(v['held_back']).toBe(true);
    v['fight_won'] = true;
    const before = v['suspicion'] as number;
    story.ChoosePathString('day4_after_fight');
    story.ContinueMaximally();
    expect(v['suspicion']).toBe(before + 2);
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
