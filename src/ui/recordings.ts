// Recorded sounds, dropped in to replace synthesised ones. A file in src/assets/audio/sfx/ named after
// a sound (`roar.ogg`, `gasp.mp3`, `chant.wav`…) plays wherever that sound plays, instead of the
// synthesised version; nothing else needs changing. Each is decoded once per audio context, in the
// background, as soon as sound is available; until then the synthesised one (if any) plays.

const FILES = import.meta.glob('../assets/audio/sfx/*.{ogg,mp3,wav,m4a,webm}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

/** Sound id → file URL, from the files in the folder. */
export const RECORDINGS: ReadonlyMap<string, string> = new Map(
  Object.entries(FILES).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1).replace(/\.[^.]+$/, ''), url]),
);

const decoded = new WeakMap<AudioContext, Map<string, AudioBuffer>>();

/** Starts decoding every recording for this context (once). */
export function loadRecordings(ctx: AudioContext): void {
  if (decoded.has(ctx)) return;
  const buffers = new Map<string, AudioBuffer>();
  decoded.set(ctx, buffers);
  for (const [id, url] of RECORDINGS) {
    fetch(url)
      .then((r) => r.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => buffers.set(id, buffer))
      .catch(() => console.warn(`Couldn't load the recording for "${id}" (${url})`));
  }
}

/** Plays the recording for `id` into `dest` at `t`, a little varied in pitch each time, and `rate` times as fast (and high). False if there isn't one (yet). */
export function playRecording(ctx: AudioContext, dest: AudioNode, t: number, id: string, volume: number, rate = 1): boolean {
  const buffer = decoded.get(ctx)?.get(id);
  if (!buffer) return false;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.playbackRate.value = (0.95 + Math.random() * 0.1) * rate;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  src.connect(gain).connect(dest);
  src.start(t);
  return true;
}
