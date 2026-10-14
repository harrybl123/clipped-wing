// Recorded sounds, dropped in to replace synthesised ones. A file in src/assets/audio/sfx/ named after
// a sound (`roar.ogg`, `gasp.mp3`, `chant.wav`…) plays wherever that sound plays, instead of the
// synthesised version; nothing else needs changing. Several takes of one sound (`savage-1.wav`,
// `savage-2.wav`…) are played in turn at random, so it doesn't repeat itself. Each is decoded once per audio context, in the
// background, as soon as sound is available; until then the synthesised one (if any) plays.

const FILES = import.meta.glob('../assets/audio/sfx/*.{ogg,mp3,wav,m4a,webm}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

/** Sound id → its takes' file URLs, from the files in the folder (`<id>` or `<id>-<n>`). */
export const RECORDINGS: ReadonlyMap<string, string[]> = (() => {
  const takes = new Map<string, string[]>();
  for (const [path, url] of Object.entries(FILES)) {
    const id = path.slice(path.lastIndexOf('/') + 1).replace(/\.[^.]+$/, '').replace(/-\d+$/, '');
    takes.set(id, [...(takes.get(id) ?? []), url]);
  }
  return takes;
})();

const decoded = new WeakMap<AudioContext, Map<string, AudioBuffer[]>>();

/** Starts decoding every recording for this context (once). */
export function loadRecordings(ctx: AudioContext): void {
  if (decoded.has(ctx)) return;
  const buffers = new Map<string, AudioBuffer[]>();
  decoded.set(ctx, buffers);
  for (const [id, urls] of RECORDINGS) {
    for (const url of urls) {
      fetch(url)
        .then((r) => r.arrayBuffer())
        .then((data) => ctx.decodeAudioData(data))
        .then((buffer) => buffers.set(id, [...(buffers.get(id) ?? []), buffer]))
        .catch(() => console.warn(`Couldn't load the recording for "${id}" (${url})`));
    }
  }
}

/** Whether a recording of `id` is ready to play. */
export const hasRecording = (ctx: AudioContext, id: string): boolean => !!decoded.get(ctx)?.get(id)?.length;

/**
 * Plays a recording for `id` (one of its takes, at random) into `dest` at `t`, a little varied in pitch
 * each time, and `rate` times as fast (and high). With `stutter`, its first split second catches and
 * repeats that many times before it plays through. False if there isn't one (yet).
 */
export function playRecording(ctx: AudioContext, dest: AudioNode, t: number, id: string, volume: number, opts: { rate?: number; stutter?: number } = {}): boolean {
  const takes = decoded.get(ctx)?.get(id);
  const buffer = takes?.[Math.floor(Math.random() * takes.length)];
  if (!buffer) return false;
  const rate = (0.95 + Math.random() * 0.1) * (opts.rate ?? 1);
  const gain = ctx.createGain();
  gain.gain.value = volume;
  gain.connect(dest);
  const play = (at: number, length?: number) => {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    src.connect(gain);
    src.start(at, 0, length);
  };
  const catches = opts.stutter ?? 0;
  for (let i = 0; i < catches; i++) play(t + i * 0.07, 0.06 * rate);
  play(t + catches * 0.07);
  return true;
}
