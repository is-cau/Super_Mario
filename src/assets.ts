/*
 * 精灵缓存 — 用 OffscreenCanvas 预渲染 ImageBitmap
 */

import { drawSprite } from "./renderer";
import {
  MARIO_SMALL_1, MARIO_SMALL_2, MARIO_SMALL_STAND,
  MARIO_BIG, MARIO_BIG_JUMP,
  BRICK, GROUND,
  QUESTION_LIT, QUESTION_DARK,
  COIN_1, COIN_2,
  GOOMBA_1, GOOMBA_2,
  MUSHROOM, POLE_BALL,
} from "./sprites";

export interface Cache {
  ms0: ImageBitmap; ms1: ImageBitmap; ms2: ImageBitmap;
  mb0: ImageBitmap; mb1: ImageBitmap;
  brick: ImageBitmap;
  ground: ImageBitmap;
  qLit: ImageBitmap;
  qDark: ImageBitmap;
  c1: ImageBitmap; c2: ImageBitmap;
  g1: ImageBitmap; g2: ImageBitmap;
  mush: ImageBitmap;
  ball: ImageBitmap;
}

let _cache: Cache | null = null;

function makeSync(data: number[][], ps: number): ImageBitmap | null {
  try {
    const w = data[0].length * ps;
    const h = data.length * ps;
    const c = new OffscreenCanvas(w, h);
    const ctx = c.getContext("2d")! as any;
    drawSprite(ctx, data, 0, 0, ps);
    return c.transferToImageBitmap();
  } catch {
    // 降级：使用 DOM canvas
    try {
      const w = data[0].length * ps;
      const h = data.length * ps;
      const c2 = document.createElement("canvas");
      c2.width = w; c2.height = h;
      const ctx2 = c2.getContext("2d")!;
      drawSprite(ctx2, data, 0, 0, ps);
      // 对于不支持 transferToImageBitmap 的浏览器，回退到 null，draw 方法会 fallback
      return null;
    } catch { return null; }
  }
}

export function initCache(): Cache | null {
  if (_cache) return _cache;
  try {
    _cache = {
      ms0: makeSync(MARIO_SMALL_STAND, 2)!,
      ms1: makeSync(MARIO_SMALL_1, 2)!,
      ms2: makeSync(MARIO_SMALL_2, 2)!,
      mb0: makeSync(MARIO_BIG, 2)!,
      mb1: makeSync(MARIO_BIG_JUMP, 2)!,
      brick: makeSync(BRICK, 2.5)!,
      ground: makeSync(GROUND, 2.5)!,
      qLit: makeSync(QUESTION_LIT, 2.5)!,
      qDark: makeSync(QUESTION_DARK, 2.5)!,
      c1: makeSync(COIN_1, 1.25)!,
      c2: makeSync(COIN_2, 1.25)!,
      g1: makeSync(GOOMBA_1, 1.875)!,
      g2: makeSync(GOOMBA_2, 1.875)!,
      mush: makeSync(MUSHROOM, 2)!,
      ball: makeSync(POLE_BALL, 2)!,
    };
    // 检查是否有 null（降级失败）
    const keys = Object.keys(_cache) as (keyof Cache)[];
    for (const k of keys) {
      if (!_cache[k]) { _cache = null; return null; }
    }
    return _cache;
  } catch {
    _cache = null;
    return null;
  }
}

export function getCache(): Cache | null { return _cache; }

export function drawCached(ctx: CanvasRenderingContext2D, img: ImageBitmap, x: number, y: number, flip = false) {
  if (flip) {
    ctx.save();
    ctx.translate(x + img.width, y);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  } else {
    ctx.drawImage(img, x, y);
  }
}
