export type SoundName = "step" | "push" | "goal" | "stuck" | "undo" | "solve";

/** One tone: a frequency (gliding to `to`, if given), its start and length in seconds. */
interface Note {
  freq: number;
  to?: number;
  at?: number;
  length: number;
  type?: OscillatorType;
  volume?: number;
}

// Short synthesized blips, so there are no audio files to load or license.
const SOUNDS: Record<SoundName, Note[]> = {
  step: [{ freq: 520, length: 0.04, type: "triangle", volume: 0.25 }],
  push: [{ freq: 180, to: 150, length: 0.09, type: "triangle", volume: 0.6 }],
  goal: [
    { freq: 660, length: 0.09 },
    { freq: 990, at: 0.08, length: 0.14 },
  ],
  stuck: [{ freq: 160, to: 110, length: 0.25, type: "triangle", volume: 0.6 }],
  undo: [{ freq: 400, to: 330, length: 0.05, type: "triangle", volume: 0.2 }],
  solve: [523, 659, 784, 1047].map((freq, i) => ({
    freq,
    at: i * 0.1,
    length: i === 3 ? 0.35 : 0.12,
  })),
};

const STORAGE_KEY = "sokobanko:sound";
// Overall loudness; each note's volume scales it.
const MASTER = 0.15;

let context: AudioContext | undefined;

/**
 * Game sounds, muted by default. The choice is remembered in this browser
 * only, and read on the client after mounting, so the server always renders
 * the muted state.
 */
export function useSound() {
  const enabled = useState("sound-enabled", () => false);

  onMounted(() => {
    try {
      enabled.value = localStorage.getItem(STORAGE_KEY) === "on";
    } catch {}
  });

  function setEnabled(on: boolean) {
    enabled.value = on;
    try {
      localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
    } catch {}
    // Turning sound on is a click, which lets the browser start audio.
    if (on) audio();
  }

  function play(name: SoundName) {
    if (!enabled.value) return;
    const ctx = audio();
    if (!ctx) return;
    const now = ctx.currentTime;
    for (const note of SOUNDS[name]) {
      const start = now + (note.at ?? 0);
      const end = start + note.length;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = note.type ?? "sine";
      osc.frequency.setValueAtTime(note.freq, start);
      if (note.to) osc.frequency.exponentialRampToValueAtTime(note.to, end);
      // A quick attack and an exponential fade, so notes don't click.
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(
        MASTER * (note.volume ?? 1),
        start + 0.005,
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(end + 0.02);
    }
  }

  return { enabled: readonly(enabled), setEnabled, play };
}

/** The shared AudioContext, created on first use and resumed if suspended. */
function audio() {
  if (typeof AudioContext === "undefined") return undefined;
  context ??= new AudioContext();
  if (context.state === "suspended") context.resume().catch(() => {});
  return context;
}
