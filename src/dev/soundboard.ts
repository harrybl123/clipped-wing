// DEV ONLY (soundboard.html, not part of the build): a button for every sound, the Day 6 score and each
// voice, for hearing them one at a time. No Phaser: the game's sound code only needs a scene's sound
// manager (its audio context and output), so a stand-in is enough.

import type Phaser from 'phaser';
import { ACOUSTICS, setAcoustics, type Acoustics } from '../ui/audioMix';
import { duckScore, stopScore, updateScore } from '../ui/score';
import { playSound, SOUND_IDS, type SoundId } from '../ui/soundscape';
import { playSyllable } from '../ui/voice';
import { typeLine, VOICES } from '../systems/voices';

const ctx = new AudioContext();
const master = ctx.createGain();
master.connect(ctx.destination);
/** Just enough of a Phaser scene for the sound code. */
const scene = { sound: { context: ctx, destination: master, locked: false } } as unknown as Phaser.Scene;

/** What each sound is (from docs/sound-effects-plan.md and the soundscape). */
const GROUPS: { title: string; sounds: [SoundId, string][] }[] = [
  {
    title: 'Crowds',
    sounds: [
      ['murmur', 'a low babble of many voices'], ['gasp', 'everyone drawing breath at once'], ['roar', 'a swell of shouting'],
      ['jeer', 'ugly laughter'], ['chant', 'Cur-sed, three times'], ['whispers', 'hissing, half-heard words'],
      ['scream', 'one voice, a short cry'], ['sob', 'a child crying'],
    ],
  },
  {
    title: 'Hitting, breaking, opening',
    sounds: [
      ['hit', 'something thrown lands on you'], ['spit', 'spat at your feet'], ['smash', 'clay jars breaking'], ['staff', 'the Tender\'s staff on wood'],
      ['latch', 'the cage shutting'], ['bolt', 'the cell bolt'], ['pound', 'fists on a door'], ['crash', 'a door broken in'],
      ['hammer', 'boards nailed down'], ['splinter', 'boards torn up'], ['grate', 'a heavy grate lifted'], ['boots', 'guards outside'],
      ['punch', 'a body blow'], ['knock', 'a knock at the door'], ['door', 'a door opening'], ['thump', 'a heavy thud (the screen shakes)'],
      ['crack', 'wood splitting'], ['whoosh', 'something flying past'],
    ],
  },
  {
    title: 'Your hands (the close-ups)',
    sounds: [
      ['chop', 'the knife biting into wood'], ['shave', 'a curl of wood coming off'], ['skid', 'the knife skidding off'],
      ['scratch', 'a point on metal'], ['pop', 'a plug in, a seam opening'], ['rub', 'the rag on the plate'], ['slip', 'the prologue\'s slip'],
      ['tap', 'the eye, a small knock'], ['crackle', 'soot crumbling'],
    ],
  },
  {
    title: 'The tube, light, big moments',
    sounds: [
      ['rush', 'offerings up, blessings down'], ['boom', 'the tube going dark'], ['shimmer', 'a flash of light'], ['rise', 'rising up the tube'],
      ['sting', 'a big choice begins'], ['heartbeat', 'your heart, during a choice'], ['resolve', 'the choice made'], ['shuffle', 'a crowd stepping back'],
    ],
  },
  {
    title: 'The world',
    sounds: [
      ['step', 'a footstep'], ['jump', 'a jump'], ['land', 'a landing'], ['creak', 'wood creaking'], ['plink', 'a water drop'],
      ['splash', 'a drop of rot'], ['bloop', 'a bubble'], ['tick', 'a clock'], ['chime', 'the seeds in the grove'], ['rumble', 'the tunnel coming down'],
      ['skitter', 'the beetle rushing'],
    ],
  },
];

const root = document.getElementById('board')!;
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = '') => {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
};
const wake = () => ctx.state === 'suspended' && void ctx.resume();

// The room, and the overall volume.
const bar = el('div', 'bar');
const room = el('select');
for (const name of Object.keys(ACOUSTICS)) room.append(new Option(name, name));
room.onchange = () => {
  wake();
  setAcoustics(scene, room.value as Acoustics);
};
const roomLabel = el('label', '', 'Room:');
roomLabel.append(room);
const volume = el('input');
volume.type = 'range';
volume.min = '0';
volume.max = '1';
volume.step = '0.05';
volume.value = '0.8';
master.gain.value = 0.8;
volume.oninput = () => (master.gain.value = Number(volume.value));
const volumeLabel = el('label', '', 'Volume:');
volumeLabel.append(volume);
bar.append(roomLabel, volumeLabel);
root.append(bar);

function button(label: string, what: string, play: () => void): HTMLButtonElement {
  const b = el('button');
  b.append(el('span', 'id', label), el('span', 'what', what));
  b.onclick = () => {
    wake();
    setAcoustics(scene, room.value as Acoustics);
    play();
  };
  return b;
}

const listed = new Set<string>();
for (const group of GROUPS) {
  root.append(el('h2', '', group.title));
  const grid = el('div', 'grid');
  for (const [id, what] of group.sounds) {
    listed.add(id);
    grid.append(button(id, what, () => playSound(scene, id)));
  }
  root.append(grid);
}
// Anything added to the game since this list was written still gets a button.
const rest = SOUND_IDS.filter((id) => !listed.has(id));
if (rest.length) {
  root.append(el('h2', '', 'Other'));
  const grid = el('div', 'grid');
  for (const id of rest) grid.append(button(id, '', () => playSound(scene, id)));
  root.append(grid);
}

// The Day 6 score: on and off, and dipped as it is under a big choice.
root.append(el('h2', '', 'Music'));
const music = el('div', 'grid');
let scoreTimer: number | null = null;
const scoreButton = button('Day 6 score', 'click to start, again to stop', () => {
  if (scoreTimer !== null) {
    clearInterval(scoreTimer);
    scoreTimer = null;
    stopScore(scene);
    scoreButton.classList.remove('on');
    return;
  }
  let last = performance.now();
  scoreTimer = window.setInterval(() => {
    const now = performance.now();
    updateScore(scene, 'day6', now - last);
    last = now;
  }, 50);
  scoreButton.classList.add('on');
});
let ducked = false;
const duckButton = button('Dip the score', 'as under a big choice (click again to bring it back)', () => {
  ducked = !ducked;
  duckScore(scene, ducked);
  duckButton.classList.toggle('on', ducked);
});
music.append(scoreButton, duckButton);
root.append(music);

// Each voice saying a line, as a line of dialogue types out.
root.append(el('h2', '', 'Voices'));
const voices = el('div', 'grid');
const SAMPLE = "I don't know what it means. Do you?";
for (const [name, voice] of Object.entries(VOICES)) {
  voices.append(button(name, SAMPLE, () => {
    let at = 0;
    for (const letter of typeLine(SAMPLE, voice)) {
      at += letter.delay;
      if (letter.syllable) playSyllable(scene, voice, letter.syllable, { delay: at });
    }
  }));
}
root.append(voices);
