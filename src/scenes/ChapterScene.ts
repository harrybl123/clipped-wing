import Phaser from 'phaser';
import { GAME_WIDTH as W } from '../config';
import { SHADES } from '../ui/pixelArt';
import { makeSpriteTexture } from '../ui/pixelTextures';
import { PixelText } from '../ui/PixelText';
import { BIRD } from '../ui/sprites';
import type { AreaSceneData } from './AreaScene';
import type { RiotTableSceneData } from './RiotTableScene';
import { getSession } from '../session';

export interface ChapterSceneData {
  /** "Chapter 1". */
  number: string;
  /** The chapter's name, large: "Fly or Fall". */
  title: string;
  /** Where the game goes next. */
  next: AreaSceneData;
}

/**
 * Chapter 2 begins (designer: an option once you've finished Chapter 1): the scavenger, on the picked
 * fields, digging. The story carries on from where Chapter 1 left it; the calendar starts again at Day 1.
 */
export function beginChapter2(scene: Phaser.Scene): void {
  const session = getSession(scene);
  session.story.setVariable('chapter', 2);
  // Nothing of Chapter 1's left to do (the day's first knot sets her objective).
  session.story.setVariable('objective', '');
  session.story.setVariable('objective_target', '');
  session.calendar.jumpTo(1);
  const next: AreaSceneData = { areaId: 'picked-fields', start: { x: 60, y: 232 }, card: 'Day 1', script: 'c2day1_start' };
  session.dayStarts = { 1: { ink: session.story.saveState(), calendar: session.calendar.toJSON(), wake: { areaId: next.areaId, start: next.start!, script: next.script } } };
  scene.scene.start('Chapter', { number: 'Chapter 2', title: 'On the Scent', next } satisfies ChapterSceneData);
}

/** Dev: straight to the start of one of Chapter 2's days, as if the days before had been played (`?chapter=2&day=2` to `5`). */
/** The page's query (dev links). */
const params0 = () => new URLSearchParams(window.location.search);

export function devChapter2Day(scene: Phaser.Scene, day: number): void {
  const session = getSession(scene);
  const set = (vars: Record<string, string | number | boolean>) => {
    for (const [name, value] of Object.entries(vars)) session.story.setVariable(name, value);
  };
  set({ chapter: 2, c2day1: 'done', owe_double: true, traded_light: true, objective: '', objective_target: '' });
  if (day >= 3) set({ c2day2: 'done', found_dog: true, dog_owned: true, dog_name: 'Peggy', dog_choice: 'keep' });
  if (day >= 4) set({ c2day3: 'done', owe_double: false, summoned: true });
  if (day >= 5) set({ c2day4: 'done', in_circle: true, brother_choice: 'home', spar_done: true, bar_arrived: true });
  if (day >= 6) set({ c2day5: 'done', board_mark: 'far fields' });
  if (day >= 7) set({ c2day6: 'done', raid_won: true });
  if (day >= 9) set({ c2day8: 'done', drop_choice: params0().get('drop') ?? 'swap', has_bead: true, friend_lie_known: true, scout_seen: params0().get('drop') === 'leave', has_note: params0().get('drop') === 'take' });
  if (day >= 8) set({ c2day7: 'done', board_mark: params0().get('square') === 'ditch' ? 'ditch' : 'hull', gambler_choice: 'fought', has_chain: true });
  // Earlier choices, for trying each path (dev): &brother=compound (big choice 1: he moved in), &spar=won|sunk|deep
  // (won the spar, or lost it and told the bar the sunk town or the deep ground), &gambler=helped (gave him a find on Day 5).
  const params = new URLSearchParams(window.location.search);
  if (day >= 5 && params.get('brother') === 'compound') set({ brother_choice: 'compound', brother_moved: true });
  const spar = params.get('spar');
  if (day >= 5 && spar === 'won') set({ spar_won: true });
  if (day >= 5 && (spar === 'sunk' || spar === 'deep')) set({ spar_won: false, told_where: spar });
  if (day >= 6 && params.get('gambler') === 'helped') set({ gambler_trust: 1 });
  if (day >= 8 && params.get('gambler') === 'left') set({ gambler_choice: 'left', has_chain: false });
  // Day 10 (dev): Day 9's choices: &scout=turned_in|let_go (default let_go), &friend=reported|covered (default
  // covered), &watcher=2 (the watcher's respect: 2 or more and he's with you), &note=found (the enforcer found the
  // drop's note in your shack; with &drop=take).
  if (day >= 10) {
    const scout = params.get('scout') === 'turned_in' ? 'turned_in' : 'let_go';
    set({
      c2day9: 'done', house9_done: true, old9_done: true, line_open: true, line9_arrived: true, friend_seen9: true, watched9: true, chase_seen: true, scout_cornered: true,
      scout_choice: scout, turnin9: scout === 'turned_in', letgo9: scout === 'let_go', knows_meeting: scout === 'let_go', scout_held: scout === 'turned_in',
      friend_choice: params.get('friend') === 'reported' ? 'reported' : 'covered',
      watcher_respect: Number(params.get('watcher') ?? 0),
      boss_knows_dog: params.get('brother') === 'compound',
      found_note: params.get('note') === 'found',
    });
  }
  const starts: Record<number, AreaSceneData & { vars: Record<string, string | boolean> }> = {
    2: { areaId: 'shack', start: { x: 382, y: 184 }, vars: { c2day2: 'wake', objective: 'Talk to your brother', objective_target: 'shack:brother' } },
    3: { areaId: 'dogs-hollow', start: { x: 60, y: 206 }, script: 'c2day3_start', vars: { c2day3: 'sunk' } },
    4: { areaId: 'compound', start: { x: 40, y: 232 }, script: 'c2day4_start', vars: { c2day4: 'gate' } },
    5: { areaId: 'swap-yard', start: { x: 600, y: 232 }, script: 'c2day5_start', vars: { c2day5: 'town' } },
    6: { areaId: 'picked-fields', start: { x: 860, y: 232 }, script: 'c2day6_start', vars: { c2day6: 'fields' } },
    7: { areaId: 'dogs-hollow', start: { x: 60, y: 206 }, script: 'c2day7_start', vars: {} },
    8: { areaId: 'shack', start: { x: 382, y: 184 }, script: 'c2day8_start', vars: {} },
    9: { areaId: 'shack', start: { x: 382, y: 184 }, script: 'c2day9_start', vars: {} },
    10: { areaId: 'shack', start: { x: 382, y: 184 }, script: 'c2day10_start', vars: {} },
    11: { areaId: 'tally-house', start: { x: 240, y: 236 }, script: 'c2day11_brand', vars: {} },
  };
  // Day 7, part way in (dev): &at=den (down the den's steps, the gambler at the wall), &at=tribute (at the
  // tally house, your share to pay), &at=home (out of the tally, on foot home through the yard at night).
  const at = params.get('at');
  const day7: Record<string, { area: AreaSceneData; slots: number; vars: Record<string, string | boolean> }> = {
    den: {
      area: { areaId: 'gambling-den', start: { x: 40, y: 172 } }, slots: 1,
      vars: { c2day7: 'den', wells_seen: true, yard7_done: true, den7: true, gambler_at_wall: true, collectors_here: true, objective: 'See what the gambler wants', objective_target: 'gambling-den:gambler-wall' },
    },
    tribute: {
      area: { areaId: 'tally-house', start: { x: 60, y: 236 } }, slots: 2,
      vars: { c2day7: 'tribute', wells_seen: true, yard7_done: true, den7_seen: true, gambler_choice: 'fought', collectors_won: true, has_chain: true, tribute_night: true, objective: 'Pay your tribute', objective_target: 'tally-house:tallyman' },
    },
    home: {
      area: { areaId: 'swap-yard', start: { x: 552, y: 232 } }, slots: 2,
      vars: { c2day7: 'home', wells_seen: true, yard7_done: true, door_marked: true, den7_seen: true, gambler_choice: 'fought', collectors_won: true, has_chain: true, tribute7_done: true, board_mark: 'sunk town', ambush_night: true, ambush_set: true, objective: 'Go home', objective_target: 'shack:bed' },
    },
  };
  // Day 6: &at=tally (the night of the first raid, walking into the tally house).
  const day6: Record<string, { area: AreaSceneData; slots: number; vars: Record<string, string | boolean> }> = {
    tally: { area: { areaId: 'tally-house', start: { x: 30, y: 236 } }, slots: 2, vars: { c2day6: 'tally', raid_won: true, raid_night: true, tribute_night: true, objective: 'Go to the tally house', objective_target: '' } },
  };
  // Day 8: &at=deep (at the hollow, the dog, about to go out), &at=search (back in the yard at midday, the
  // enforcer on his way), &at=brothel (the evening, the madam). With &drop=leave|take|swap for the drop.
  const drop = params.get('drop') ?? 'leave';
  const after = { going_deep8: true, deep_arrived: true, drop_found: true, has_bead: true, guards_won: true, drop_choice: drop, has_note: drop === 'take', scout_seen: drop === 'leave', son_met8: true, son_slipped: true };
  const day8: Record<string, { area: AreaSceneData; slots: number; vars: Record<string, string | boolean> }> = {
    deep: { area: { areaId: 'dogs-hollow', start: { x: 60, y: 206 } }, slots: 0, vars: { c2day8: 'hollow', son_met8: true, son_slipped: true, objective: 'Get to the hollow', objective_target: 'dogs-hollow:dog' } },
    search: { area: { areaId: 'swap-yard', start: { x: 1060, y: 232 } }, slots: 0, vars: { ...after, c2day8: 'noon', noon8: true, sent_home8: true, objective: 'Go home', objective_target: 'swap-yard:to-shack' } },
    brothel: { area: { areaId: 'shack', start: { x: 90, y: 236 } }, slots: 2, vars: { ...after, c2day8: 'brothel', noon8_seen: true, search_started: false, objective: 'Ask the madam about the bead', objective_target: 'brothel:madam' } },
  };
  // Day 9: &at=line (the fields, just shown the way to the line, at dusk), &at=watch (the line at night, the dog with
  // you), &at=follow (the line after the raiders, following the dog on the scout's scent), &at=chase (the stacks,
  // the scout ahead of you). With &drop=leave|take|swap (default swap).
  const day9: Record<string, { area: AreaSceneData; slots: number; vars: Record<string, string | boolean> }> = {
    line: { area: { areaId: 'picked-fields', start: { x: 470, y: 232 } }, slots: 1, vars: { c2day9: 'dusk', house9_done: true, old9: true, old9_done: true, line_open: true, objective: 'Go out to the line by sunset', objective_target: 'picked-fields:to-rival-line' } },
    watch: { area: { areaId: 'rival-line', start: { x: 140, y: 232 } }, slots: 3, vars: { c2day9: 'watch', house9_done: true, old9: true, old9_done: true, line_open: true, line9_arrived: true, friend_seen9: true, friend_choice: 'covered', dog_with_you: true, objective: 'Keep watch at the post', objective_target: 'rival-line:post' } },
    follow: { area: { areaId: 'rival-line', start: { x: 230, y: 232 } }, slots: 3, vars: { c2day9: 'chase', house9_done: true, old9_done: true, line_open: true, line9_arrived: true, friend_seen9: true, friend_choice: 'covered', watched9: true, line_won: true, scout_gone9: true, dog_with_you: true, chase9: true, dog_leading: true, objective: 'Follow the dog', objective_target: 'rival-line:dog-lead;picked-fields:dog-lead;swap-yard:dog-lead;scrap-stacks:scout-stacks' } },
    chase: { area: { areaId: 'scrap-stacks', start: { x: 616, y: 510 } }, slots: 3, vars: { c2day9: 'chase', house9_done: true, old9_done: true, line_open: true, line9_arrived: true, friend_seen9: true, friend_choice: 'covered', watched9: true, line_won: true, dog_with_you: true, chase9: true, objective: 'After the scout', objective_target: 'scrap-stacks:scout-stacks' } },
  };
  // Day 10: &at=yard (the yard in the afternoon, after your brother), &at=line (the line at nightfall, the dog with
  // you; let go), &at=night (home at night, the enforcer waiting), &at=won (just after beating him), &at=tally (the tally house, in front of everyone).
  const after10 = { c2day10: 'yard', boss_growled10: true, knows_boss: true, perch10_seen: true, witness10: params.get('brother') !== 'compound', brother_taken10: params.get('brother') !== 'compound', dog_home: true };
  const day10: Record<string, { area: AreaSceneData; slots: number; vars: Record<string, string | boolean> }> = {
    yard: { area: { areaId: 'swap-yard', start: { x: 40, y: 232 } }, slots: 1, vars: { ...after10, yard10: true, gambler_yard10: true, friend_yard10: params.get('friend') !== 'reported', friend_mother10: params.get('friend') === 'reported', objective: 'Go through the yard', objective_target: 'swap-yard:gambler-yard10' } },
    line: { area: { areaId: 'rival-line', start: { x: 30, y: 232 } }, slots: 2, vars: { ...after10, c2day10: 'line', yard10: true, yard10_seen: true, cairn10: true, dog_home: false, dog_with_you: true, objective: 'Go out to the line: lie up by the post', objective_target: 'rival-line:post' } },
    night: { area: { areaId: 'swap-yard', start: { x: 60, y: 232 } }, slots: 3, vars: { ...after10, c2day10: 'home', yard10: true, yard10_seen: true, night10: true, objective: 'Go home', objective_target: 'shack:door' } },
    // (Straight after beating the enforcer, in your shack: the rubbing, the dog away into the dark.)
    won: { area: { areaId: 'shack', start: { x: 120, y: 236 }, script: 'c2day10_after_night' }, slots: 3, vars: { ...after10, c2day10: 'home', yard10: true, yard10_seen: true, night10: true, night10_seen: true, enforcer_night10: true, son_night10: true, enforcer_won: true, dog_home: false, dog_up10: true } },
    tally: { area: { areaId: 'tally-house', start: { x: 120, y: 236 }, script: 'c2day10_tally' }, slots: 3, vars: { ...after10, c2day10: 'tally', yard10: true, yard10_seen: true, night10: true, night10_seen: true, brand_night: true, dog_home: false, dog_ran10: true, friend_back10: params.get('friend') === 'reported', brother_brand10: params.get('brother') === 'compound' } },
  };
  // Day 11: &at=cellar (in the cellar after the brand), &at=hollow (out, to find the dog), &at=choice (the
  // dog and the rubbing: big choice 3), &at=camp (out on the deep ground behind the scout), &at=edge (dusk at the tree's edge, with &last=girl|truce|war). Day 10's
  // choices as above (&watcher=2 and &scout=let_go open every last act).
  if (day >= 11) {
    set({
      c2day10: 'done', knows_boss: true, boss_growled10: true, enforcer_won: true, has_rubbing10: true, dog_ran10: true, brand_night: false,
      witness10: params.get('brother') !== 'compound', brother_taken10: params.get('brother') !== 'compound', brother_brand10: params.get('brother') === 'compound',
      watcher_ally: Number(params.get('watcher') ?? 0) >= 2, knows_why: params.get('scout') !== 'turned_in', scout_friend: params.get('scout') !== 'turned_in',
      rival_trust: params.get('scout') !== 'turned_in' ? 1 : 0,
    });
  }
  const last = params.get('last') ?? 'war';
  const day11: Record<string, { area: AreaSceneData; slots: number; vars: Record<string, string | boolean> }> = {
    cellar: { area: { areaId: 'tally-cellar', start: { x: 120, y: 200 }, script: 'c2day11_cellar' }, slots: 0, vars: { c2day11: 'brand' } },
    hollow: { area: { areaId: 'scrap-stacks', start: { x: 40, y: 510 }, script: 'c2day11_out_stacks' }, slots: 1, vars: { c2day11: 'out', let_out11: true } },
    choice: { area: { areaId: 'dogs-hollow', start: { x: 120, y: 206 }, script: 'c2day11_hollow' }, slots: 1, vars: { c2day11: 'hollow', let_out11: true } },
    camp: { area: { areaId: 'deep-ground', start: { x: 60, y: 232 }, script: 'c2day11_girl_deep' }, slots: 2, vars: { c2day11: 'girl', let_out11: true, dog_with_you: true, last_act: 'girl', girl11: true, girl_dip11: true } },
    edge: { area: { areaId: 'picked-fields', start: { x: 900, y: 232 } }, slots: 2, vars: { c2day11: 'edge', let_out11: true, dog_with_you: true, last_act: last, edge_ready11: true, boss_why: true, objective: "Out past the tree's edge", objective_target: 'trees-edge:crack' } },
  };
  const mid = at ? (day === 7 ? day7[at] : day === 6 ? day6[at] : day === 8 ? day8[at] : day === 9 ? day9[at] : day === 10 ? day10[at] : day === 11 ? day11[at] : undefined) : undefined;
  const { vars, ...next } = starts[day] ?? starts[2]!;
  set(mid?.vars ?? vars);
  if (at === 'home' && params.get('brother') !== 'compound') set({ brother_scrubbing: true });
  session.calendar.jumpTo(day as 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11);
  for (let i = 0; i < (mid?.slots ?? 0); i++) session.calendar.advance();
  scene.scene.start('Area', { ...(mid?.area ?? next), card: day === 3 ? 'Weeks later' : day === 7 ? 'Two weeks on' : day === 10 ? 'Three nights on' : day === 11 ? 'First light' : `Day ${day}` } satisfies AreaSceneData);
}

/**
 * Chapter 3 begins (docs/sequences/chapter-3/plan.md): the prince, in his quarters at dawn, his hand at the
 * door. The calendar starts again at Day 1; the story's Chapter 3 people take over the capital (`c3_story`).
 */
export function beginChapter3(scene: Phaser.Scene): void {
  const session = getSession(scene);
  session.story.setVariable('chapter', 3);
  session.story.setVariable('c3_story', true);
  session.story.setVariable('objective', '');
  session.story.setVariable('objective_target', '');
  session.calendar.jumpTo(1);
  const next: AreaSceneData = { areaId: 'prince-quarters', start: { x: 120, y: 226 }, card: 'Day 1', script: 'c3day1_start' };
  session.dayStarts = { 1: { ink: session.story.saveState(), calendar: session.calendar.toJSON(), wake: { areaId: next.areaId, start: next.start!, script: next.script } } };
  scene.scene.start('Chapter', { number: 'Chapter 3', title: 'The Prince', next } satisfies ChapterSceneData);
}

/**
 * Dev: part way into one of Chapter 3's days (`?chapter=3&at=...`), as if the day had been played to there.
 * Day 1: `&at=spar` (on the balcony, your hand waiting), `audience` (in the audience hall, your seat ahead),
 * `walk` (on the promenade, the afternoon), `requests` (at the data centre), `banquet` (the banquet gallery,
 * the steward with the plan), `night` (coming back to your quarters). With `&lift=mended`, `&seated=hostess`.
 * Day 2 (`&day=2`): `&at=start` (dawn, your father at the door), `study` (the bookshelf), `table` (the
 * simulation room, at the war table), `council`, `dusk` (your balcony, watching it go dark), `below` (your
 * hand's office at night, then down); `&energy=high|people`.
 * Day 3 (`&day=3`): `start|audience|requests|salon|below|low`. Day 4 (`&day=4`): `start` (dawn, your friend on
 * the balcony), `physician`, `afternoon`, `evening` (back to your balcony as it starts), `table` (the
 * simulation room), `riot` (straight onto the war table), `square` (out of the fight; `&table=lost`);
 * `&sleeve=asked|told`, `&physician=yes|no`.
 */
export function devChapter3(scene: Phaser.Scene, at: string, day = 1): void {
  const session = getSession(scene);
  const params = params0();
  const set = (vars: Record<string, string | number | boolean>) => {
    for (const [name, value] of Object.entries(vars)) session.story.setVariable(name, value);
  };
  set({ chapter: 3, c3_story: true, spar1: 'won', lift_mended: params.get('lift') === 'mended', seated: params.get('seated') ?? '' });
  const day1: Record<string, { area: AreaSceneData; slots: number; vars: Record<string, string | number | boolean> }> = {
    spar: { area: { areaId: 'prince-quarters', start: { x: 506, y: 226 } }, slots: 0, vars: { c3day1: 'spar', spar1: '', objective: 'Meet your hand on the balcony', objective_target: 'prince-quarters:hand' } },
    audience: { area: { areaId: 'audience-hall', start: { x: 60, y: 236 } }, slots: 0, vars: { c3day1: 'audience', hand_with_you: true, brief1: true, objective: 'Take your seat in the audience hall', objective_target: 'audience-hall:seat-1' } },
    walk: { area: { areaId: 'promenade', start: { x: 40, y: 232 } }, slots: 1, vars: { c3day1: 'walk', hand_with_you: true, brief1: true, objective: 'Inspect the watch on the promenade', objective_target: 'promenade:commander-1' } },
    requests: { area: { areaId: 'data-centre', start: { x: 50, y: 230 } }, slots: 1, vars: { c3day1: 'requests', hand_with_you: true, brief1: true, stall1: true, bird1: true, objective: "Sign the day's requests", objective_target: 'data-centre:operator-1' } },
    banquet: { area: { areaId: 'banquet-gallery', start: { x: 40, y: 230 } }, slots: 2, vars: { c3day1: 'banquet', brief1: true, stall1: true, bird1: true, signed_requests: true, objective: 'Seat the banquet', objective_target: 'banquet-gallery:steward' } },
    night: { area: { areaId: 'citadel-halls', start: { x: 130, y: 136 } }, slots: 2, vars: { c3day1: 'night', brief1: true, stall1: true, bird1: true, signed_requests: true, seated: params.get('seated') ?? 'councillor', right_placed: true, cards_done: true, objective: 'Go to bed', objective_target: 'prince-quarters:bed-1' } },
  };
  // Day 2 (`&day=2`, with `&at=` below; Day 1's choices as above, and `&energy=high|people` for big choice 1).
  const energy = params.get('energy') === 'people' ? 'people' : 'high';
  const dark = energy === 'high' ? 'low' : 'promenade';
  const day2: Record<string, { area: AreaSceneData; slots: number; vars: Record<string, string | number | boolean> }> = {
    start: { area: { areaId: 'prince-quarters', start: { x: 120, y: 226 }, script: 'c3day2_start', card: 'Day 2' }, slots: 0, vars: {} },
    study: { area: { areaId: 'fathers-study', start: { x: 60, y: 230 }, script: 'c3day2_study' }, slots: 0, vars: { c3day2: 'study', objective: 'Go with your father', objective_target: 'fathers-study:father-2' } },
    table: { area: { areaId: 'simulation-room', start: { x: 300, y: 230 } }, slots: 0, vars: { c3day2: 'room', sim_open: true, room2: true, objective: 'Practise the art of war', objective_target: 'simulation-room:table' } },
    council: { area: { areaId: 'citadel-halls', start: { x: 300, y: 232 } }, slots: 1, vars: { c3day2: 'council', sim_open: true, room2: true, objective: 'Go to the council chamber', objective_target: 'council-chamber:father-4' } },
    dusk: { area: { areaId: 'prince-quarters', start: { x: 300, y: 226 } }, slots: 2, vars: { c3day2: 'dusk', sim_open: true, room2: true, council2: true, heard2: 3, energy, objective: 'Watch from your balcony', objective_target: 'prince-quarters:telescope' } },
    below: { area: { areaId: 'diplomats-office', start: { x: 200, y: 230 } }, slots: 2, vars: { c3day2: 'report', sim_open: true, room2: true, council2: true, energy, dark_district: dark, citadel_dimmed: energy === 'people', dusk2: true, reported2: true, objective: "Go to your hand's office", objective_target: 'diplomats-office:hand-6' } },
  };
  // Day 3 (`&day=3`; Day 2's choice as `&energy=`, and this morning's: `&envoy=granted|refused`, `&scrubbed=1`).
  const envoy = params.get('envoy') === 'refused' ? 'refused' : 'granted';
  const morning3 = { envoy, scrubbed: params.get('scrubbed') === '1' };
  const day3: Record<string, { area: AreaSceneData; slots: number; vars: Record<string, string | number | boolean> }> = {
    start: { area: { areaId: 'prince-quarters', start: { x: 120, y: 226 }, script: 'c3day3_start', card: 'Two weeks on.' }, slots: 0, vars: {} },
    audience: { area: { areaId: 'audience-hall', start: { x: 60, y: 236 } }, slots: 0, vars: { c3day3: 'audience', hand_with_you: true, objective: 'Hold the audience', objective_target: 'audience-hall:seat-3' } },
    requests: { area: { areaId: 'data-centre', start: { x: 50, y: 230 } }, slots: 1, vars: { c3day3: 'requests', ...morning3, objective: "Sign the day's requests", objective_target: 'data-centre:operator-3' } },
    salon: { area: { areaId: 'glasshouse', start: { x: 40, y: 230 } }, slots: 2, vars: { c3day3: 'salon', ...morning3, signed3: true, objective: 'Show your face at the salon', objective_target: 'glasshouse:hostess-3' } },
    below: { area: { areaId: 'diplomats-office', start: { x: 200, y: 230 } }, slots: 2, vars: { c3day3: 'office', ...morning3, signed3: true, hostess3: true, friend3: true, objective: "Go to your hand's office", objective_target: 'diplomats-office:hand-3o' } },
    low: { area: { areaId: 'low-district', start: { x: 24, y: 236 } }, slots: 3, vars: { c3day3: 'below', ...morning3, signed3: true, hostess3: true, friend3: true, plain_coat: true, hand_with_you: true, objective: 'Go down to the low district', objective_target: 'lifts:to-low-district' } },
  };
  // Day 4 (`&day=4`; Day 3's choices as above, and this day's: `&sleeve=asked|told`, `&physician=yes|no`).
  // `&at=riot` goes straight to the war table; `&at=square` comes out of the fight at the square.
  const sleeve = params.get('sleeve') === 'told' ? 'told' : 'asked';
  const physician = params.get('physician') === 'no' ? 'no' : 'yes';
  const leader = energy === 'high' ? 'firebrand' : 'reformer';
  const morning4 = { spar4: 'won', sleeve, physician };
  const evening4 = { ...morning4, afternoon4: 2, table4: true, painter4: true, riot_leader: leader };
  const day4: Record<string, { area: AreaSceneData; slots: number; vars: Record<string, string | number | boolean> }> = {
    start: { area: { areaId: 'prince-quarters', start: { x: 120, y: 226 }, script: 'c3day4_start', card: 'Day 4' }, slots: 0, vars: {} },
    physician: { area: { areaId: 'citadel-halls', start: { x: 110, y: 136 } }, slots: 0, vars: { c3day4: 'physician', spar4: 'won', sleeve, objective: 'Talk to the physician', objective_target: 'citadel-halls:physician-4' } },
    afternoon: { area: { areaId: 'citadel-halls', start: { x: 110, y: 136 } }, slots: 1, vars: { c3day4: 'afternoon', ...morning4, objective: 'Wait for the evening', objective_target: 'council-chamber:table-4,lifts:painter-4,citadel-halls:sister-4' } },
    evening: { area: { areaId: 'prince-quarters', start: { x: 300, y: 226 } }, slots: 2, vars: { c3day4: 'evening', ...morning4, afternoon4: 2, table4: true, painter4: true, objective: 'Go back to your rooms', objective_target: 'prince-quarters:telescope' } },
    table: { area: { areaId: 'simulation-room', start: { x: 120, y: 230 } }, slots: 2, vars: { c3day4: 'table', ...evening4, room4: true, objective: 'Get to the war table', objective_target: 'simulation-room:table-4' } },
    riot: { area: { areaId: 'simulation-room', start: { x: 330, y: 230 } }, slots: 2, vars: { c3day4: 'table', ...evening4, room4: true } },
    square: { area: { areaId: energy === 'high' ? 'low-district' : 'promenade', start: { x: 720, y: energy === 'high' ? 236 : 232 }, script: 'c3day4_square' }, slots: 2, vars: { c3day4: 'table', ...evening4, room4: true, riot_table: params.get('table') === 'lost' ? 'lost' : 'won', riot_turns: 11, riot_fight: 'won', plain_coat: true } },
  };
  if (day >= 2) set({ c3day1: 'done', c3day2: 'wake', lift_mended: params.get('lift') === 'mended', seated: params.get('seated') ?? 'councillor', signed_requests: true });
  // (Day 2 done: the energy choice made, the district dark, the war table played, below with your hand.)
  if (day >= 3) set({ c3day2: 'done', sim_open: true, sim_turns: 3, sim_wiped: true, energy, dark_district: dark, dark_fade: 100, citadel_dimmed: energy === 'people', painter2: true, woman2: true, streets_cut: true, rewards: true });
  // (Day 3 done: the audience, the requests, the salon, below to the hideout.)
  if (day >= 4) set({ c3day3: 'done', ...morning3, signed3: true, hostess3: true, friend3: true, low3: true, met_hideout: true, heard3: 4, painter3: true, outside3: true });
  const table = day >= 4 ? day4 : day >= 3 ? day3 : day >= 2 ? day2 : day1;
  const mid = table[at] ?? Object.values(table)[0]!;
  set(mid.vars);
  session.calendar.jumpTo(day as 1 | 2 | 3 | 4);
  for (let i = 0; i < mid.slots; i++) session.calendar.advance();
  if (day >= 4 && at === 'riot') {
    scene.scene.start('RiotTable', { scenario: leader === 'firebrand' ? 'riot_low' : 'riot_promenade', back: mid.area } satisfies RiotTableSceneData);
    return;
  }
  scene.scene.start('Area', mid.area);
}

/** How long the card holds before fading out (ms). */
const HOLD = 2800;

/**
 * A chapter's title card, on black (designer: after the prologue, "Chapter 1: Fly or Fall"): the number small,
 * the name large in the title's carved letters, a small red bird beneath. It fades in, holds, fades out,
 * and the game goes on. Any key or click skips it, after the first second.
 */
export class ChapterScene extends Phaser.Scene {
  private leaving = false;
  private next!: AreaSceneData;

  constructor() {
    super('Chapter');
  }

  create(data: ChapterSceneData): void {
    this.leaving = false;
    this.next = data.next;
    this.cameras.main.setBackgroundColor(SHADES.shadow);
    const number = new PixelText(this, 0, 92, data.number, { color: SHADES.dim });
    number.setX(Math.round((W - number.width) / 2));
    const title = new PixelText(this, 0, 108, data.title, { color: SHADES.light, scale: 3, shadow: SHADES.shadow, chisel: { light: SHADES.white, dark: SHADES.dim } });
    title.setX(Math.round((W - title.width) / 2));
    const bird = this.add.image(W / 2, title.y + title.height + 14, makeSpriteTexture(this, 'bird', BIRD.rows, BIRD.colours)).setOrigin(0.5, 0);
    const parts = [number, title, bird];
    for (const p of parts) p.setAlpha(0);
    // The number first, then the name, then the bird.
    parts.forEach((p, i) => this.tweens.add({ targets: p, alpha: 1, duration: 1100, delay: 500 + i * 600, ease: 'Sine.easeOut' }));
    this.time.delayedCall(500 + 2 * 600 + 1100 + HOLD, () => this.leave());
    // Skippable after a moment (so a key still held from the prologue doesn't skip it).
    this.time.delayedCall(1000, () => {
      this.input.keyboard?.once('keydown', () => this.leave());
      this.input.once('pointerdown', () => this.leave());
    });
  }

  private leave(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(1200, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Area', this.next));
  }
}
