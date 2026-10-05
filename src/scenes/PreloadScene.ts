import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import titleMusicUrl from '../assets/audio/light-through-the-window.mp3';
import { AREAS } from '../data/areas';
import { getSession } from '../session';
import { SHADES } from '../ui/pixelArt';
import { PIXEL } from '../ui/pixelTextures';
import { savedMuted } from '../ui/soundSetting';

/** Loads assets (the title music; everything else is generated) with a progress bar, then shows the title. */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    const barWidth = 120;
    const x = Math.round((GAME_WIDTH - barWidth) / 2);
    const y = Math.round(GAME_HEIGHT / 2);
    this.add.rectangle(x, y, barWidth, 2, SHADES.woodPale).setOrigin(0);
    const bar = this.add.rectangle(x, y, 0, 2, SHADES.white).setOrigin(0);
    this.load.on('progress', (p: number) => (bar.width = Math.round(barWidth * p)));
    // Audio files live in src/assets/audio/ and are imported, so Vite bundles them with hashed names.
    this.load.audio('title-music', titleMusicUrl);
  }

  create(): void {
    const g = this.make.graphics({}, false);
    g.fillStyle(0xffffff).fillRect(0, 0, 1, 1);
    g.generateTexture(PIXEL, 1, 1);
    g.destroy();
    // Dev builds only: ?area=<id> skips the title and opens that area directly; ?scene=prologue opens the
    // prologue; ?scene=decode opens the first message's decoding; ?day=2 to 6 wakes at home on that day;
    // ?day=5&at=archivist jumps to the archivist (big choice 2), ?day=5&at=night to the night's choice (&told=1 if you told him);
    // ?day=6 (&seed=healthy for the archivist's seed) with &at=tail (the market, cloaked) or &at=interrogation (&plate=1 if they found it);
    // ?day=7 wakes in the cell (you saved the girl; &girl=blamed wakes at home under guard), with &at=trial (the cage goes up), &at=visits (the cell's visitors), &at=evening (the cage comes back),
    // &at=night (message 6 by the bench or hearth), &at=chase (up through the shrine, the mob behind) or &at=fall (thrown into the rot);
    // &told=1 if you told the archivist, &lied=1 if you lied to your friend; ?scene=combat opens the turn-based market scrap.
    const params = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null;
    // Sound as the player left it (the speaker in the corner), always there from here on.
    this.sound.setMute(savedMuted());
    this.scene.launch('SoundButton');
    // Dev: &mute=1 starts with all sound off (this visit only).
    if (params?.get('mute') === '1') this.sound.setMute(true);
    const areaId = params?.get('area');
    if (areaId && areaId in AREAS) this.scene.start('Area', { areaId });
    else if (params?.get('scene') === 'prologue') this.scene.start('Prologue');
    else if (params?.get('scene') === 'chapter') {
      // The chapter card after the prologue, then Day 1.
      getSession(this).calendar.jumpTo(1);
      this.scene.start('Chapter', { number: 'Chapter 1', title: 'Seen', next: { areaId: 'home', start: { x: 50, y: 150 }, card: 'Day 1: Ascension Day' } });
    }
    // ?scene=combat: a fight picker (every fight, and each of the zealot's moves to practise), then back to
    // the roots market; &encounter=<id> starts that fight, &foe=<move> makes him use only that move.
    else if (params?.get('scene') === 'combat') {
      const encounter = params.get('encounter');
      const foe = params.get('foe');
      this.scene.start('Combat', { encounter: encounter ?? 'market_scrap', back: { areaId: 'roots-market' }, ...(foe ? { only: foe } : {}), ...(!encounter && !foe ? { pick: true } : {}) });
    }
    else if (params?.get('scene') === 'decode') this.scene.start('Decode', { message: 'message1' });
    else if (params?.get('ending')) this.scene.start('Ending', { ending: params.get('ending')! });
    else if (params && ['2', '3', '4', '5', '6', '7'].includes(params.get('day') ?? '')) {
      const day = Number(params.get('day')) as 2 | 3 | 4 | 5 | 6 | 7;
      this.devStartDay(day, params.get('reply') === 'usual' ? 'usual' : 'fledgling', params.get('at'), params.get('told') === '1' || params.get('seed') === 'healthy', params.get('plate') === '1');
      // &late=1: you answered message 1 a day late (Day 4 sends the fledgling; message 3 has message 2 folded in).
      if (day === 4 && params.get('late') === '1') getSession(this).story.setVariable('answered_late', true);
      if (day === 7) this.devDay7(params.get('girl') === 'blamed', params.get('lied') === '1', params.get('at'), params.get('told') === '1');
    } else this.scene.start('Title');
  }

  /** Dev only: wakes at home on Day 2 to 5 with the story as if the earlier days had been played (?day=3&reply=usual for the ignore path). */
  private devStartDay(day: 2 | 3 | 4 | 5 | 6 | 7, reply: 'fledgling' | 'usual', at: string | null = null, told = false, plate = false): void {
    const session = getSession(this);
    const { story, calendar } = session;
    const set = (vars: Record<string, string | number | boolean>) => Object.entries(vars).forEach(([k, v]) => story.setVariable(k, v));
    calendar.jumpTo(2);
    set({ dialogue_style: 'hide', day1: 'done', rite_done: true, watched_lights: true, day2: 'wake', objective: 'Talk to Mum', objective_target: 'home:mum' });
    session.dayStarts[2] = { ink: story.saveState(), calendar: calendar.toJSON() };
    if (day >= 3) {
      calendar.jumpTo(3);
      set({ day2: 'done', got_rations: true, afternoon_with: 'friend', friend_trust: 1, suspicion: 1, reply1: reply, times_ignored: reply === 'usual' ? 1 : 0, day3: 'wake' });
      for (const [k, v] of Object.entries({ self: 'I', see: 'see', you: 'you', clipped: 'clipped', wing: 'wing', send: 'send', new: 'new', life: 'life', cant: "can't", fly: 'fly' })) story.setVariable(`glossary_${k}`, v);
      session.dayStarts[3] = { ink: story.saveState(), calendar: calendar.toJSON() };
    }
    if (day >= 4) {
      calendar.jumpTo(4);
      set({ reply1: 'fledgling', times_ignored: 0, day3: 'done', fledgling_size: 'small', fledgling_wing: 'left', fledgling_eye: 'open', blessings_withheld: true, confided: true, friend_trust: 2, suspicion: 2, food_store: 6 });
      set({ day4: 'wake', summons_on_floor: true, objective: "See what's by the door", objective_target: 'home:summons' });
      for (const [k, v] of Object.entries({ rest: 'rest', beyond: 'beyond', bark: 'bark', would: 'would', like: 'like' })) story.setVariable(`glossary_${k}`, v);
      session.dayStarts[4] = { ink: story.saveState(), calendar: calendar.toJSON() };
    }
    if (day >= 5) {
      calendar.jumpTo(5);
      set({ day4: 'done', summons_on_floor: false, reply2: 'why', fought: true, girl_trust: 2, has_feather: true, house_watched: true, food_store: 4 });
      set({ day5: 'wake', objective: 'Answer Grounded', objective_target: 'home:bench' });
      for (const [k, v] of Object.entries({ because: 'because', carve: 'carve', grounded: 'grounded', many: 'many' })) story.setVariable(`glossary_${k}`, v);
      session.dayStarts[5] = { ink: story.saveState(), calendar: calendar.toJSON() };
    }
    if (day >= 6) {
      calendar.jumpTo(6);
      set({ day5: 'done', reply3: 'who', told_archivist: told, archivist_trust: told ? 3 : 0, caught_stealing: !told, seed: told ? 'healthy' : 'roots', food_store: 3, suspicion: 4 });
      set({ day6: 'wake', objective: 'Answer Grounded', objective_target: 'home:bench', glossary_seed: 'seed' });
      session.dayStarts[6] = { ink: story.saveState(), calendar: calendar.toJSON() };
    }
    if (day === 2 && at === 'night') {
      // Night 2 at home after the rejection: the bird by the hearth, Mum gone to bed (message 1, the first choice).
      calendar.advanceTo('night');
      set({ day2: 'burn', reply1: '', mum_in_bed: true, objective: 'Burn the bird', objective_target: 'home:hearth' });
      this.scene.start('Area', { areaId: 'home', start: { x: 120, y: 236 } });
    } else if (day === 3 && at === 'night') {
      // Night 3 at home, the bird by the hearth (with &reply=usual: the second, stern choice; the loyal ending).
      calendar.advanceTo('night');
      set({ day3: 'open', mum_in_bed: true, objective: 'Open the bird', objective_target: 'home:hearth' });
      this.scene.start('Area', { areaId: 'home', start: { x: 120, y: 236 } });
    } else if (day === 6 && at === 'tail') {
      // Cloaked, at the market at noon, the Tender about to cross it.
      calendar.advanceTo('afternoon');
      set({ day6: 'tail', has_disguise: true, tailing: true, objective: 'Follow the Tender without being seen', objective_target: 'roots-market:tender-tail;roots-market:ration-hatch' });
      this.scene.start('Area', { areaId: 'roots-market', start: { x: 27, y: 236 } });
    } else if (day === 6 && at === 'interrogation') {
      // Marched up to the shrine at night.
      calendar.advanceTo('night');
      set({ day6: 'interrogation', has_disguise: true, interrogating: true, plate_found: plate, objective: '', objective_target: '' });
      this.scene.start('Area', { areaId: 'tenders-shrine', start: { x: 218, y: 236 }, script: 'day6_interrogation' });
    } else if (day === 5 && at === 'archivist') {
      // Up in the upper halls with the escort, just before the archivist.
      calendar.advanceTo('afternoon');
      set({ day5: 'upper', reply3: 'who', escorted: true, objective: 'Meet the archivist in the upper halls', objective_target: 'upper-halls:archivist' });
      this.scene.start('Area', { areaId: 'upper-halls', start: { x: 578, y: 156 } });
    } else if (day === 5 && at === 'night') {
      // At home after the ceremony, message 4 ready by the hearth.
      calendar.advanceTo('night');
      set({ day5: 'open', reply3: 'who', told_archivist: told, archivist_trust: told ? 3 : 0, mum_in_bed: true, objective: 'Open the bird', objective_target: 'home:hearth' });
      this.scene.start('Area', { areaId: 'home', start: { x: 120, y: 236 } });
    } else if (day === 5 && at === 'grove') {
      // Night 5 with the archivist: at the seed grove's bridge, the guard walking the beds.
      calendar.advanceTo('night');
      set({ day5: 'grove', reply3: 'who', told_archivist: true, archivist_trust: 3, mum_in_bed: true, in_grove: true, grove_sneak: true, objective: 'Get to the seed vault without being seen', objective_target: 'seed-grove:seed-vault' });
      this.scene.start('Area', { areaId: 'seed-grove', start: { x: 156, y: 236 }, script: 'day5_grove_arrive' });
    } else if (day < 7 && !((day === 2 || day === 3) && at === 'night')) this.scene.start('Area', { areaId: 'home', start: { x: 50, y: 150 }, card: `Day ${day}` });
  }

  /** Dev only: Day 7, in custody (you saved the girl) or at home under guard (you blamed her), optionally jumping ahead. */
  private devDay7(blamed: boolean, lied: boolean, at: string | null, told = false): void {
    const session = getSession(this);
    const { story, calendar } = session;
    const set = (vars: Record<string, string | number | boolean>) => Object.entries(vars).forEach(([k, v]) => story.setVariable(k, v));
    calendar.jumpTo(7);
    set({ day6: 'done', reply4: 'blame', has_disguise: true, suspicion: 7, food_store: 1, confided: !lied, friend_trust: lied ? 0 : 2, told_archivist: told, archivist_trust: told ? 3 : 0, archivist_goodbye: told && blamed });
    for (const [k, v] of Object.entries({ seed: 'seed', lives: 'lives', stayalive: 'stay alive', not: 'not', rot: 'rot', need: 'need', hurry: 'hurry' })) story.setVariable(`glossary_${k}`, v);
    if (blamed) set({ girl_fate: 'blamed', girl_trust: -2, girl_in_rot: true, house_guarded: true, day7: 'carve', objective: 'Carve your offering', objective_target: 'home:bench' });
    else set({ girl_fate: 'saved', girl_trust: 4, in_custody: true, day7: 'wake' });
    const wake = blamed ? undefined : { areaId: 'shrine-cell', start: { x: 250, y: 236 }, script: 'day7_cell_wake' };
    session.dayStarts[7] = { ink: story.saveState(), calendar: calendar.toJSON(), wake };
    const here = (home: { areaId: string; x: number; y: number }, cell: { areaId: string; x: number; y: number }) => (blamed ? home : cell);
    if (at === 'trial') {
      set({ reply5: 'caged', day7: 'rite', trial: true });
      this.scene.start('Area', { areaId: 'offering-floor', start: { x: 104, y: 236 }, script: 'day7_trial' });
    } else if (at === 'visits' && !blamed) {
      calendar.advanceTo('afternoon');
      set({ reply5: 'caged', day7: 'visits', told_archivist: true, archivist_trust: 3 });
      this.scene.start('Area', { areaId: 'shrine-cell', start: { x: 250, y: 236 }, script: 'day7_cell_afternoon' });
    } else if (at === 'evening') {
      calendar.advanceTo('evening');
      set({ reply5: 'caged', day7: 'evening', trial: true });
      this.scene.start('Area', { areaId: 'offering-floor', start: { x: 104, y: 236 }, script: 'day7_return' });
    } else if (at === 'night') {
      calendar.advanceTo('night');
      const { areaId, x, y } = here({ areaId: 'home', x: 130, y: 236 }, { areaId: 'shrine-cell', x: 250, y: 236 });
      set({ reply5: 'caged', day7: 'open', objective: 'Open the bird', objective_target: blamed ? 'home:hearth' : 'shrine-cell:bench' });
      this.scene.start('Area', { areaId, start: { x, y } });
    } else if (at === 'chase') {
      calendar.advanceTo('night');
      set({ reply5: 'caged', day7: 'chase', chased: true, friend_helps: !lied, girl_runs: !blamed, objective: 'Climb. Get to the top', objective_target: 'ascension-gate:gate;back-routes:to-shrine;tenders-shrine:up-to-trunk' });
      this.scene.start('Area', { areaId: 'tenders-shrine', start: { x: 182, y: 236 }, script: 'day7_shrine_escape' });
    } else if (at === 'fall') {
      calendar.advanceTo('night');
      set({ reply5: 'caged', day7: 'fall' });
      this.scene.start('Area', { areaId: 'the-rot', start: { x: 100, y: 232 }, script: 'day7_cast_down' });
    } else if (blamed) this.scene.start('Area', { areaId: 'home', start: { x: 50, y: 150 }, card: 'Day 7' });
    else this.scene.start('Area', { areaId: 'shrine-cell', start: { x: 250, y: 236 }, script: 'day7_cell_wake', card: 'Day 7' });
  }
}
