import { readdirSync, readFileSync } from 'node:fs';
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
    expect(play('day3_decoded')).toContain('when:evidence_left:day3_visit:15');
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

  it('on Day 4, if you answered a day late, you send the fledgling, and message 3 comes back with message 2 folded in', () => {
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
    Object.entries({ dialogue_style: 'voice', day1: 'done', day2: 'done', day3: 'done', reply1: 'fledgling', answered_late: true, day4: 'carve' }).forEach(([k, x]) => (v[k] = x));
    const carving = play('day4_carving', 0, 0, 0);
    expect(carving).toEqual(expect.arrayContaining(['step:rough', 'step:smooth', 'step:wing', 'step:eye', 'end']));
    expect(carving).not.toContain('plate:reply2'); // no question to answer yet
    expect(v['reply2']).toBe('');
    expect(v['day4']).toBe('shrine');
    v['day4'] = 'open';
    v['mum_in_bed'] = true;
    expect(play('home_hearth')).toContain('decode:message3_late:day4_decoded');
    expect(play('day4_decoded')).toContain('inset:feather');
    expect(v['has_feather']).toBe(true);
    expect(v['day4']).toBe('sneak');
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
    expect(play('shrine_tender_summons', 2, 2, 2, 2, 1, 2, 2)).toEqual(expect.arrayContaining(['sound:heartbeat', 'time:afternoon']));
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
      const tags = play('upper_archivist', 2, 2, truth ? 0 : 1, 0);
      expect(tags).toEqual(expect.arrayContaining(['hide:escort', 'dim:on', 'dim:off', 'time:evening', 'goto:offering-floor:60:236']));
      expect(tags.includes('inset:feather')).toBe(truth); // you win him over with the feather
      expect(v['told_archivist']).toBe(truth);
      expect(play('offering_floor_chalk_ring', 0)).toEqual(expect.arrayContaining(['show:rejected-bird', 'goto:home:130:236:day5_mum_night']));
      expect(v['escorted']).toBe(false);
      play('day5_mum_night');
      expect(play('home_hearth')).toContain('decode:message4_take:day5_decoded'); // he answers "take me"
      return { v, play };
    };

    it('if you told the archivist, you go back up, he takes you to the seed grove, and you get a living seed', () => {
      const { v, play } = start(true);
      play('day5_decoded', 0);
      expect(v['day5']).toBe('archive');
      expect(v['objective_target']).toBe('archive:archivist-night');
      expect(play('archive_archivist')).toContain('goto:seed-grove:156:236:day5_grove_arrive');
      expect(v['grove_sneak']).toBe(true); // past the guard to the vault
      expect(v['objective_target']).toBe('seed-grove:seed-vault');
      expect(play('day5_grove_vault', 0, 2)).toContain('goto:archive:60:236'); // the wrong mark, then the right one
      expect(v['grove_sneak']).toBe(false);
      expect(v['in_grove']).toBe(false);
      expect(v['seed']).toBe('healthy');
      expect(play('home_bed', 0)).toContain('endday:Day 6');
      expect(v['day6']).toBe('wake');
    });

    it('if you told him, you can still go to the lower roots, where the boy sells you a seed for food', () => {
      const { v, play } = start(true);
      play('day5_decoded', 1);
      expect(v['day5']).toBe('roots');
      expect(v['sneaking']).toBe(true); // the watch is out again
      expect(v['objective_target']).toBe('lower-roots:girl-doorstep');
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

  describe('Day 6', () => {
    const play6 = (seed: 'healthy' | 'roots') => {
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
      Object.entries({ dialogue_style: 'voice', day1: 'done', day2: 'done', day3: 'done', day4: 'done', day5: 'done', reply1: 'fledgling', seed, day6: 'wake', food_store: 3 }).forEach(([k, x]) => (v[k] = x));
      play('home_mum', 0);
      expect(play('home_bench', 0)).toContain('carve:day6_carving');
      // What you ask him beside the pointing hands: why me? (or, with the boy's seed, what do I do?).
      expect(play('day6_carving', seed === 'healthy' ? 2 : 1)).toEqual(expect.arrayContaining(['plate:blame', 'plate:ask', 'step:scratch', 'step:seal', 'end']));
      expect(v['reply4_ask']).toBe(seed === 'healthy' ? 'why' : 'todo');
      expect(play('shrine_tender_summons', 2)).not.toContain('time:afternoon');
      expect(v['objective_target']).toBe('roots-market:food-seller');
      expect(play('market_food_seller', 2)).toEqual(expect.arrayContaining(['throw', 'time:afternoon', 'goto:home:40:236']));
      expect(v['objective_target']).toBe(seed === 'roots' ? 'lower-roots:dodger' : 'lower-roots:girl');
      if (seed === 'healthy') play('lower_roots_girl');
      play('lower_roots_dodger', 1);
      expect(v['has_disguise']).toBe(true);
      expect(v['tailing']).toBe(true);
      expect(v['food_store']).toBe(1);
      // The quarry feature sets tail_done when they slip behind the ration hatch.
      expect(play('market_ration_hatch')).not.toContain('goto:back-routes:646:120:day6_tail_down');
      v['tail_done'] = true;
      expect(play('market_ration_hatch')).toContain('goto:back-routes:646:120:day6_tail_down');
      expect(v['meeting']).toBe(true);
      expect(play('back_routes_listen')).toContain('time:evening');
      expect(play('offering_floor_chalk_ring', 2)).toEqual(expect.arrayContaining(['show:bitten-bird', 'recoil', 'goto:home:130:236:day6_mum_night']));
      play('day6_mum_night');
      expect(play('home_hearth')).toContain(seed === 'healthy' ? 'decode:message5_lives_why:day6_decoded' : 'decode:message5_sleeps_todo:day6_decoded');
      expect(play('day6_decoded')).toContain('when:evidence_left:day6_guards:5');
      return { v, play };
    };

    it('if you save the girl, she goes free and you spend the night in custody', () => {
      const { v, play } = play6('healthy');
      play('home_hide_plate');
      expect(v['evidence_left']).toBe(0);
      expect(play('day6_guards')).toContain('goto:tenders-shrine:218:236:day6_interrogation');
      expect(v['plate_found']).toBe(false);
      expect(play('day6_interrogation', 2, 2, 0, 0)).toEqual(expect.arrayContaining(['show:girl-shrine', 'dim:on', 'dim:off', 'wake:shrine-cell:250:236:day7_cell_wake', 'endday:Day 7']));
      expect(v['girl_fate']).toBe('saved');
      expect(v['in_custody']).toBe(true);
    });

    it("if you blame her, she's taken to the lower rot and you're sent home; a plate left out is found", () => {
      const { v, play } = play6('roots');
      play('day6_guards'); // too slow: the plate's still out
      expect(v['plate_found']).toBe(true);
      expect(play('day6_interrogation', 0, 0, 1, 0)).toContain('goto:home:130:236:day6_home_after');
      expect(v['girl_fate']).toBe('blamed');
      expect(v['in_custody']).toBe(false);
      expect(play('home_bed', 0)).toContain('endday:Day 7');
      expect(v['house_guarded']).toBe(true);
      expect(v['objective_target']).toBe('home:bench');
    });
  });

  describe('Day 7', () => {
    const start = (vars: Record<string, string | number | boolean>) => {
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
      Object.entries({ dialogue_style: 'voice', day1: 'done', day2: 'done', day3: 'done', day4: 'done', day5: 'done', day6: 'done', reply1: 'fledgling', ...vars }).forEach(([k, x]) => (v[k] = x));
      return { v, play };
    };

    it('in custody: carve under guard, the trial, visitors by your choices, message 6, then up through the shrine and into the tube', () => {
      const { v, play } = start({ in_custody: true, girl_fate: 'saved', day7: 'wake', told_archivist: true, confided: true });
      play('day7_cell_wake');
      expect(v['objective_target']).toBe('shrine-cell:bench');
      expect(play('shrine_cell_bench', 0)).toContain('carve:day7_carving');
      expect(play('day7_carving')).toEqual(expect.arrayContaining(['plate:caged', 'step:scratch', 'step:seal', 'end']));
      expect(v['reply5']).toBe('caged');
      expect(play('shrine_cell_guard')).toContain('goto:offering-floor:104:236:day7_trial');
      expect(v['trial']).toBe(true);
      expect(play('day7_trial', 0)).toEqual(expect.arrayContaining(['show:caged-bird', 'time:afternoon', 'goto:shrine-cell:250:236:day7_cell_afternoon']));
      expect(play('day7_cell_afternoon')).toContain('show:mum-cell');
      // Mum, then the archivist (an ally), then your friend at the grate (you confided), then the evening.
      expect(play('shrine_cell_mum', 0)).toEqual(expect.arrayContaining(['hide:mum-cell', 'show:archivist-cell']));
      expect(play('shrine_cell_archivist', 2)).toEqual(expect.arrayContaining(['inset:spiral', 'hide:archivist-cell', 'show:friend-cell']));
      expect(play('shrine_cell_friend', 2)).toEqual(expect.arrayContaining(['hide:friend-cell', 'time:evening']));
      expect(play('shrine_cell_guard')).toContain('goto:offering-floor:104:236:day7_return');
      expect(play('day7_return', 2)).toEqual(expect.arrayContaining(['show:caged-bird', 'recoil', 'throw', 'goto:shrine-cell:250:236:day7_cell_night']));
      expect(play('shrine_cell_bench')).toContain('decode:message6:day7_decoded');
      expect(play('day7_decoded', 0, 0)).toEqual(expect.arrayContaining(['show:girl-cell', 'goto:tenders-shrine:182:236:day7_shrine_escape']));
      expect(v['chased']).toBe(true);
      expect(v['friend_helps']).toBe(true);
      expect(play('day7_middle_guard')).toEqual(expect.arrayContaining(['show:friend-chase', 'hide:guard']));
      expect(v['guard_passed']).toBe(true);
      expect(v['girl_runs']).toBe(true);
      expect(play('gate_gate', 0, 0)).toEqual(expect.arrayContaining(['rise', 'ending:fly']));
    });

    it('at home under guard: goodbyes in your cloak, then you give yourself up and find the girl in the rot', () => {
      const { v, play } = start({ girl_fate: 'blamed', girl_in_rot: true, house_guarded: true, day7: 'carve', objective_target: 'home:bench', confided: false, has_disguise: true });
      play('home_mum', 0);
      expect(play('home_bench', 0)).toContain('carve:day7_carving');
      play('day7_carving');
      expect(v['objective_target']).toBe('home:guard-door');
      expect(play('home_guard_door')).toContain('goto:offering-floor:104:236:day7_trial');
      expect(play('day7_trial', 1)).toEqual(expect.arrayContaining(['time:afternoon', 'goto:home:130:236']));
      expect(v['day7']).toBe('goodbyes');
      play('home_mum', 0);
      expect(v['objective_target']).toBe('home:guard-door');
      expect(play('back_routes_window')).not.toContain('show:friend-window'); // you lied to him
      expect(play('home_guard_door', 0)).toEqual(expect.arrayContaining(['time:evening', 'goto:offering-floor:104:236:day7_return']));
      expect(play('day7_return', 0)).toContain('goto:home:130:236:day7_home_night');
      expect(play('home_hearth')).toContain('decode:message6:day7_decoded');
      expect(play('day7_decoded', 1, 0)).toContain('goto:the-rot:100:232:day7_cast_down');
      expect(v['chased']).toBe(false);
      play('day7_cast_down');
      expect(v['objective_target']).toBe('the-rot:girl-fallen;the-rot:crack');
      expect(play('the_rot_crack')).not.toContain('ending:fall_together'); // not without her
      play('the_rot_girl_fallen', 0);
      expect(v['girl_follows']).toBe(true);
      expect(play('the_rot_crack')).toEqual(expect.arrayContaining(['daylight:702:134:232', 'ending:fall_together']));
    });

    // Fly if you can (designer): only if the girl (saved) or the archivist (told) opens the way up.
    const atTheFork = (vars: Record<string, unknown>) => {
      const { v, play } = start({ girl_fate: 'blamed', girl_in_rot: true, house_guarded: true, day7: 'open', ...vars });
      return { v, play };
    };

    it('if you turned your back on the girl and the archivist, up fails, and you must fall', () => {
      const { v, play } = atTheFork({ told_archivist: false, confided: true });
      // Up (it fails, and goes), then the only choice left: down, and yes.
      const tags = play('day7_decoded', 0, 0, 0);
      expect(tags).toContain('goto:the-rot:100:232:day7_cast_down');
      expect(v['chased']).toBe(false);
      expect(v['day7']).toBe('fall');
    });

    it('if you told the archivist, he has the man on your gap called away, and you can fly', () => {
      const { v, play } = atTheFork({ told_archivist: true, confided: false });
      expect(play('day7_decoded', 0, 0)).toContain('goto:back-routes:120:232:day7_routes_escape');
      expect(v['chased']).toBe(true);
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

  it('has no placeholder text left in the story', () => {
    for (const file of readdirSync('story').filter((f) => f.endsWith('.ink'))) {
      const lines = readFileSync(`story/${file}`, 'utf8').split('\n').filter((l) => !l.trim().startsWith('//'));
      expect(lines.filter((l) => l.includes('PLACEHOLDER') || l.includes('TEST:')), file).toEqual([]);
    }
  });

  it('has the market turn on you as the week goes on', () => {
    const story = new Story(readFileSync(compileInk().outFile, 'utf8'));
    const say = (day: number) => {
      for (let d = 2; d <= 7; d++) story.variablesState[`day${d}`] = d <= day ? 'wake' : '';
      story.ChoosePathString('market_food_seller');
      return story.ContinueMaximally();
    };
    const lines = [1, 3, 4, 5, 6].map(say);
    expect(new Set(lines).size).toBe(lines.length);
    expect(lines[0]).toContain('Root stew');
    expect(lines[4]).toContain('nerve');
  });

  it('says how the bird turned out from the slips while carving', () => {
    const story = new Story(readFileSync(compileInk().outFile, 'utf8'));
    const verdict = (flaws: number) => {
      story.variablesState['carve_flaws'] = flaws;
      story.ChoosePathString('day3_rite');
      return story.ContinueMaximally();
    };
    expect(verdict(0)).toContain('surprise');
    expect(verdict(3)).toContain('Careless');
    expect(verdict(7)).toContain('state of it');
  });
});
