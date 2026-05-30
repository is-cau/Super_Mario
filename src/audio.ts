/*
 * 音效系统 — Web Audio API 合成 8-bit 风格音效
 */

import { SfxType, SFX_ENABLED } from "./settings";

let audioCtx: AudioContext | null = null;

function ctx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function beep(freq: number, duration: number, type: OscillatorType = "square", vol = 0.12): void {
  if (!SFX_ENABLED) return;
  try {
    const c = ctx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  } catch { /* mute */ }
}

function noise(duration: number, vol = 0.06): void {
  if (!SFX_ENABLED) return;
  try {
    const c = ctx();
    const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * vol;
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    const filter = c.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 1000;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    src.start(c.currentTime);
  } catch { /* mute */ }
}

function arpeggio(notes: number[], speed: number, vol = 0.1): void {
  if (!SFX_ENABLED) return;
  notes.forEach((freq, i) => {
    beep(freq, speed, "square", vol / notes.length);
    // 使用 setTimeout 简单实现
  });
  let t = 0;
  notes.forEach(freq => {
    setTimeout(() => beep(freq, speed, "square", vol / notes.length), t);
    t += speed * 1000;
  });
}

export function playSfx(name: SfxType): void {
  switch (name) {
    case "jump":
      arpeggio([400, 500, 600], 0.06);
      break;
    case "coin":
      arpeggio([988, 1319], 0.05);
      break;
    case "mushroom":
      arpeggio([260, 330, 390, 520], 0.07);
      break;
    case "stomp":
      beep(150, 0.1, "square", 0.1);
      noise(0.08, 0.04);
      break;
    case "hurt":
      arpeggio([300, 200, 100], 0.1);
      break;
    case "win":
      arpeggio([523, 659, 784, 1047, 784, 1047], 0.08);
      break;
    case "powerup":
      arpeggio([260, 330, 390, 520, 660, 780], 0.06);
      break;
    case "gameover":
      arpeggio([400, 350, 300, 200, 100], 0.12);
      break;
  }
}
