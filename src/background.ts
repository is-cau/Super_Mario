/*
 * 视差滚动背景
 */

import { SCREEN_HEIGHT, TILE, PIXEL } from "./settings";
import { drawSprite, PALETTE, solidMatrix, overlay } from "./renderer";

// 云朵 (32×16 像素点阵，1x scale)
const CLOUD = (() => {
  const m = solidMatrix(32, 16, 0);
  const patches: [number, number, number][] = [
    [6, 6, 8], [14, 4, 10], [22, 6, 8],
    [8, 4, 6], [18, 3, 8],
  ];
  for (const [cx, cy, r] of patches) {
    for (let ry = cy; ry < Math.min(16, cy + r); ry++) {
      for (let rx = cx; rx < Math.min(32, cx + r * 1.5); rx++) {
        if (rx < 32 && ry < 16) m[ry][rx] = 80; // 白色云
      }
    }
  }
  return m;
})();

// 小山
const HILL_SMALL = (() => {
  const m = solidMatrix(48, 24, 0);
  for (let r = 0; r < 24; r++) {
    for (let c = 0; c < 48; c++) {
      const dist = Math.abs(c - 24);
      if (dist < (24 - r) * 2.0) m[r][c] = 81;
    }
  }
  return m;
})();

const HILL_BIG = (() => {
  const m = solidMatrix(80, 36, 0);
  for (let r = 0; r < 36; r++) {
    for (let c = 0; c < 80; c++) {
      const dist = Math.abs(c - 40);
      if (dist < (36 - r) * 2.2) m[r][c] = 81;
    }
  }
  return m;
})();

// 灌木
const BUSH_SMALL = (() => {
  const m = solidMatrix(32, 12, 0);
  for (let r = 0; r < 12; r++) {
    for (let c = 0; c < 32; c++) {
      if (r >= c && r >= 32 - c && r < 12) m[r][c] = 82;
      if (c > 4 && c < 28 && r < 8) m[r][c] = 82;
    }
  }
  return m;
})();

const BUSH_MED = (() => {
  const m = solidMatrix(48, 16, 0);
  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < 48; c++) {
      if (c > 3 && c < 45 && r < 12) m[r][c] = 82;
      if (r + 4 > c && r + 4 > 48 - c && r < 12) m[r][c] = 82;
    }
  }
  return m;
})();

interface LayerItem {
  x: number;
  y: number;
  sprite: number[][];
}

class Layer {
  items: LayerItem[] = [];
  speed: number;
  y: number;
  minGap: number;
  maxGap: number;
  sprite: number[][];
  useSprite?: boolean;

  constructor(speed: number, y: number, minGap: number, maxGap: number, sprite: number[][]) {
    this.speed = speed;
    this.y = y;
    this.minGap = minGap;
    this.maxGap = maxGap;
    this.sprite = sprite;
  }

  reset(rightEdge: number) {
    this.items = [];
    let x = 100;
    while (x < rightEdge + 800) {
      this.items.push({ x, y: this.y, sprite: this.sprite });
      x += this.minGap + Math.random() * (this.maxGap - this.minGap);
    }
  }

  update(cameraX: number) {
    const screenRight = cameraX + 900;
    // 移出左边界的删除
    this.items = this.items.filter(i => i.x + this.sprite[0].length * PIXEL > cameraX * this.speed - 200);
    // 右边补充
    const last = this.items[this.items.length - 1];
    if (last && last.x < screenRight * this.speed) {
      this.items.push({
        x: last.x + this.minGap + Math.random() * (this.maxGap - this.minGap),
        y: this.y,
        sprite: this.sprite,
      });
    }
  }
}

export const CLOUDS = new Layer(0.15, 30, 200, 350, CLOUD);
export const HILLS = new Layer(0.3, SCREEN_HEIGHT - 140, 300, 500, HILL_SMALL);
export const BUSHES = new Layer(0.55, SCREEN_HEIGHT - 48, 150, 300, BUSH_SMALL);

// 初始化
export function initBackground(cameraX: number) {
  CLOUDS.reset(cameraX + 800);
  HILLS.reset(cameraX + 800);
  BUSHES.reset(cameraX + 800);
}

export function updateBackground(cameraX: number) {
  CLOUDS.update(cameraX);
  HILLS.update(cameraX);
  BUSHES.update(cameraX);
}

export function drawBackground(ctx: CanvasRenderingContext2D, cameraX: number) {
  // 天空
  ctx.fillStyle = "#5C94FC";
  ctx.fillRect(0, 0, 900, SCREEN_HEIGHT);

  for (const layer of [CLOUDS, HILLS, BUSHES]) {
    for (const item of layer.items) {
      drawSprite(ctx, item.sprite,
        item.x - cameraX * layer.speed,
        item.y,
        PIXEL
      );
    }
  }
}
