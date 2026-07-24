/*
 * Web Audio API synthesizer for compact 8-bit sound effects and music.
 */

import { SfxType } from "./settings";

let audioContext: AudioContext | null = null;
let audioEnabled = true;
let bgmGain: GainNode | null = null;
let bgmPlaying = false;
let bgmTimer: number | null = null;

function context(): AudioContext {
  if (!audioContext) audioContext = new AudioContext();
  if (audioContext.state === "suspended") void audioContext.resume();
  return audioContext;
}

export function isAudioEnabled(): boolean {
  return audioEnabled;
}

export function setAudioEnabled(enabled: boolean): void {
  audioEnabled = enabled;
  if (!enabled) stopBgm();
}

function beep(freq: number, duration: number, type: OscillatorType = "square", volume = 0.12): void {
  if (!audioEnabled) return;
  try {
    const currentContext = context();
    const oscillator = currentContext.createOscillator();
    const gain = currentContext.createGain();
    oscillator.type = type;
    oscillator.frequency.value = freq;
    gain.gain.setValueAtTime(volume, currentContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, currentContext.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(currentContext.destination);
    oscillator.start(currentContext.currentTime);
    oscillator.stop(currentContext.currentTime + duration);
  } catch {
    // Audio is optional and may be blocked by browser policy.
  }
}

function noise(duration: number, volume = 0.06): void {
  if (!audioEnabled) return;
  try {
    const currentContext = context();
    const buffer = currentContext.createBuffer(1, currentContext.sampleRate * duration, currentContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index++) {
      data[index] = (Math.random() * 2 - 1) * volume;
    }
    const source = currentContext.createBufferSource();
    const gain = currentContext.createGain();
    const filter = currentContext.createBiquadFilter();
    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, currentContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, currentContext.currentTime + duration);
    filter.type = "highpass";
    filter.frequency.value = 1000;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(currentContext.destination);
    source.start(currentContext.currentTime);
  } catch {
    // Audio is optional and may be blocked by browser policy.
  }
}

function arpeggio(notes: number[], speed: number, volume = 0.1): void {
  if (!audioEnabled) return;
  notes.forEach((frequency, index) => {
    window.setTimeout(() => beep(frequency, speed, "square", volume), index * speed * 1000);
  });
}

export function playSfx(name: SfxType): void {
  const effects: Record<SfxType, () => void> = {
    jump: () => arpeggio([400, 500, 600], 0.06, 0.04),
    coin: () => arpeggio([988, 1319], 0.05, 0.05),
    mushroom: () => arpeggio([260, 330, 390, 520], 0.07, 0.04),
    stomp: () => {
      beep(150, 0.1, "square", 0.1);
      noise(0.08, 0.04);
    },
    hurt: () => arpeggio([300, 200, 100], 0.1, 0.05),
    win: () => arpeggio([523, 659, 784, 1047, 784, 1047], 0.08, 0.05),
    powerup: () => arpeggio([260, 330, 390, 520, 660, 780], 0.06, 0.04),
    gameover: () => arpeggio([400, 350, 300, 200, 100], 0.12, 0.05),
  };
  effects[name]();
}

const melodyNotes = [
  659, 659, 0, 659, 0, 523, 659, 0, 784, 0, 0, 0, 392, 0, 0, 0,
  523, 0, 0, 392, 0, 0, 330, 0, 0, 440, 0, 494, 466, 440, 0,
  392, 659, 784, 880, 0, 698, 784, 0, 659, 0, 523, 587, 494, 0, 0,
];
const melodyTimes = [
  0.12, 0.12, 0.12, 0.12, 0.12, 0.12, 0.12, 0.12, 0.24, 0.24, 0.12, 0.12, 0.24, 0.12, 0.12, 0.12,
  0.24, 0.12, 0.12, 0.24, 0.12, 0.12, 0.24, 0.12, 0.12, 0.12, 0.12, 0.12, 0.12, 0.24, 0.12,
  0.12, 0.12, 0.12, 0.12, 0.12, 0.12, 0.12, 0.12, 0.24, 0.12, 0.12, 0.12, 0.12, 0.24, 0.12,
];

export function startBgm(): void {
  if (bgmPlaying || !audioEnabled) return;
  try {
    const currentContext = context();
    bgmGain = currentContext.createGain();
    bgmGain.gain.value = 0.04;
    bgmGain.connect(currentContext.destination);
    bgmPlaying = true;
    let noteIndex = 0;

    const playNote = () => {
      if (!bgmPlaying || !bgmGain) return;
      if (noteIndex >= melodyNotes.length) noteIndex = 0;
      const frequency = melodyNotes[noteIndex];
      const duration = melodyTimes[noteIndex];
      if (frequency > 0) {
        const oscillator = currentContext.createOscillator();
        const gain = currentContext.createGain();
        oscillator.type = "square";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.04, currentContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentContext.currentTime + duration);
        oscillator.connect(gain);
        gain.connect(bgmGain);
        oscillator.start(currentContext.currentTime);
        oscillator.stop(currentContext.currentTime + duration);
      }
      noteIndex++;
      bgmTimer = window.setTimeout(playNote, duration * 1000);
    };

    playNote();
  } catch {
    bgmPlaying = false;
  }
}

export function stopBgm(): void {
  bgmPlaying = false;
  if (bgmTimer !== null) window.clearTimeout(bgmTimer);
  bgmTimer = null;
  if (bgmGain) {
    try {
      bgmGain.disconnect();
    } catch {
      // The node may already be disconnected.
    }
  }
  bgmGain = null;
}
