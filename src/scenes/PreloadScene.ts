import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import titleMusicUrl from '../assets/audio/light-through-the-window.mp3';
import { AREAS } from '../data/areas';
import { getSession } from '../session';
import { SHADES } from '../ui/pixelArt';
import { PIXEL } from '../ui/pixelTextures';

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
    // prologue; ?scene=decode opens the first message's decoding; ?day=2 to 5 wakes at home on that day;
    // ?day=5&at=archivist jumps to the archivist (big choice 2), ?day=5&at=night to the night's choice (&told=1 if you told him).
    const params = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null;
    const areaId = params?.get('area');
    if (areaId && areaId in AREAS) this.scene.start('Area', { areaId });
    else if (params?.get('scene') === 'prologue') this.scene.start('Prologue');
    else if (params?.get('scene') === 'decode') this.scene.start('Decode', { message: 'message1' });
    else if (params && ['2', '3', '4', '5'].includes(params.get('day') ?? '')) {
      const day = Number(params.get('day')) as 2 | 3 | 4 | 5;
      this.devStartDay(day, params.get('reply') === 'usual' ? 'usual' : 'fledgling', params.get('at'), params.get('told') === '1');
    } else this.scene.start('Title');
  }

  /** Dev only: wakes at home on Day 2 to 5 with the story as if the earlier days had been played (?day=3&reply=usual for the ignore path). */
  private devStartDay(day: 2 | 3 | 4 | 5, reply: 'fledgling' | 'usual', at: string | null = null, told = false): void {
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
    if (day === 5) {
      calendar.jumpTo(5);
      set({ day4: 'done', summons_on_floor: false, reply2: 'why', fought: true, girl_trust: 2, has_feather: true, house_watched: true, food_store: 4 });
      set({ day5: 'wake', objective: 'Answer Grounded', objective_target: 'home:bench' });
      for (const [k, v] of Object.entries({ because: 'because', carve: 'carve', grounded: 'grounded', many: 'many' })) story.setVariable(`glossary_${k}`, v);
      session.dayStarts[5] = { ink: story.saveState(), calendar: calendar.toJSON() };
    }
    if (day === 5 && at === 'archivist') {
      // Up in the upper halls with the escort, just before the archivist.
      calendar.advanceTo('afternoon');
      set({ day5: 'upper', reply3: 'who', escorted: true, objective: 'Meet the archivist in the upper halls', objective_target: 'upper-halls:archivist' });
      this.scene.start('Area', { areaId: 'upper-halls', start: { x: 578, y: 156 } });
    } else if (day === 5 && at === 'night') {
      // At home after the ceremony, message 4 ready by the hearth.
      calendar.advanceTo('night');
      set({ day5: 'open', reply3: 'who', told_archivist: told, archivist_trust: told ? 3 : 0, mum_in_bed: true, objective: 'Open the bird', objective_target: 'home:hearth' });
      this.scene.start('Area', { areaId: 'home', start: { x: 120, y: 236 } });
    } else this.scene.start('Area', { areaId: 'home', start: { x: 50, y: 150 }, card: `Day ${day}` });
  }
}
