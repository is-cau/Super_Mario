/*
 * 粒子特效系统
 */

import { PIXEL } from "./settings";
import { drawSprite } from "./renderer";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

let particles: Particle[] = [];

/** 砖块破碎粒子 */
export function spawnBrickParticles(x: number, y: number) {
  for (let i = 0; i < 6; i++) {
    particles.push({
      x: x + Math.random() * 32,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: -Math.random() * 6 - 2,
      life: 30,
      maxLife: 30,
      color: i % 2 === 0 ? "#C84C0C" : "#E09040",
      size: 4 + Math.random() * 4,
    });
  }
}

/** 金币弹跳粒子（从问号砖飞出） */
export function spawnCoinPop(x: number, y: number) {
  particles.push({
    x, y,
    vx: 0,
    vy: -8,
    life: 25,
    maxLife: 25,
    color: "#F8D800",
    size: 10,
  });
}

/** 踩敌粒子 */
export function spawnStompParticles(x: number, y: number) {
  for (let i = 0; i < 4; i++) {
    particles.push({
      x: x + Math.random() * 32,
      y,
      vx: (Math.random() - 0.5) * 3,
      vy: -Math.random() * 4,
      life: 20,
      maxLife: 20,
      color: "#D84000",
      size: 3 + Math.random() * 3,
    });
  }
}

/** 飘字粒子 */
let floatingTexts: { x: number; y: number; text: string; life: number; color: string }[] = [];

export function spawnFloatingText(x: number, y: number, text: string, color = "#FFFFFF") {
  floatingTexts.push({ x, y, text, life: 40, color });
}

/** 烟花粒子（通关） */
let fireworks: Particle[] = [];

export function spawnFirework(x: number, y: number) {
  for (let i = 0; i < 20; i++) {
    fireworks.push({
      x, y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8 - 2,
      life: 40 + Math.random() * 20,
      maxLife: 60,
      color: ["#FF0000", "#FFD700", "#00FF00", "#FF6600", "#FF00FF"][Math.floor(Math.random() * 5)],
      size: 2 + Math.random() * 3,
    });
  }
}

export function updateParticles() {
  particles = particles.filter(p => {
    p.life--;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2;
    return p.life > 0;
  });
  floatingTexts = floatingTexts.filter(t => {
    t.life--;
    t.y -= 0.8;
    return t.life > 0;
  });
  fireworks = fireworks.filter(f => {
    f.life--;
    f.x += f.vx;
    f.y += f.vy;
    f.vy += 0.1;
    return f.life > 0;
  });
}

export function drawParticles(ctx: CanvasRenderingContext2D, cameraX: number) {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - cameraX, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  for (const t of floatingTexts) {
    const alpha = Math.min(1, t.life / 20);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = t.color;
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(t.text, t.x - cameraX, t.y);
  }
  ctx.globalAlpha = 1;

  for (const f of fireworks) {
    ctx.globalAlpha = f.life / f.maxLife;
    ctx.fillStyle = f.color;
    ctx.fillRect(f.x - cameraX, f.y, f.size, f.size);
  }
  ctx.globalAlpha = 1;
}

export function clearParticles() {
  particles = [];
  floatingTexts = [];
  fireworks = [];
}
