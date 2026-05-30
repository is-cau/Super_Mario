/*
 * 精灵模块 — 玩家、敌人、道具、砖块
 */

import { COLORS, TILE_SIZE, GRAVITY } from "./settings";

// ==================== 类型定义 ====================

export interface Vec2 {
  x: number;
  y: number;
}

export class Sprite {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.vx = 0;
    this.vy = 0;
  }

  get left()   { return this.x; }
  get right()  { return this.x + this.w; }
  get top()    { return this.y; }
  get bottom() { return this.y + this.h; }
  get centerX(){ return this.x + this.w / 2; }
  get centerY(){ return this.y + this.h / 2; }

  collides(other: Sprite): boolean {
    return (
      this.left < other.right &&
      this.right > other.left &&
      this.top < other.bottom &&
      this.bottom > other.top
    );
  }
}

// ==================== 玩家 ====================

export class Player extends Sprite {
  facingRight: boolean = true;
  onGround: boolean = false;
  lives: number = 3;
  coins: number = 0;
  score: number = 0;
  big: boolean = false;
  invincible: boolean = false;
  invincibleTimer: number = 0;
  ax: number = 0;
  ay: number = GRAVITY;

  constructor(x: number, y: number) {
    super(x, y, 30, 40);
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number) {
    const sx = this.x - cameraX;
    const sy = this.y;
    const h = this.big ? 60 : 40;

    // 身体（红色）
    ctx.fillStyle = COLORS.RED;
    ctx.fillRect(sx, sy, this.w, h);

    // 背带裤（蓝色）
    const pantsY = this.big ? sy + 30 : sy + 12;
    const pantsH = this.big ? 18 : 15;
    ctx.fillStyle = COLORS.BLUE;
    ctx.fillRect(sx + 5, pantsY, 20, pantsH);

    // 脸
    ctx.fillStyle = "#FFC896";
    ctx.fillRect(sx + 10, sy + 2, 10, 10);

    // 帽子
    ctx.fillStyle = COLORS.BROWN;
    ctx.fillRect(sx + 8, sy, 14, 5);
  }
}

// ==================== 平台砖块 ====================

export class Platform extends Sprite {
  color: string;

  constructor(x: number, y: number, w: number, h: number, color: string = COLORS.BROWN) {
    super(x, y, w, h);
    this.color = color;
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number) {
    const sx = this.x - cameraX;
    ctx.fillStyle = this.color;
    ctx.fillRect(sx, this.y, this.w, this.h);
    // 边框纹理
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.strokeRect(sx, this.y, this.w, this.h);
  }
}

// ==================== 问号砖 ====================

export class QuestionBlock extends Sprite {
  used: boolean = false;

  constructor(x: number, y: number) {
    super(x, y, TILE_SIZE, TILE_SIZE);
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number) {
    const sx = this.x - cameraX;
    if (this.used) {
      ctx.fillStyle = "#646464";
      ctx.fillRect(sx, this.y, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.strokeRect(sx, this.y, TILE_SIZE, TILE_SIZE);
    } else {
      ctx.fillStyle = COLORS.GOLD;
      ctx.fillRect(sx, this.y, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = "#B49600";
      ctx.strokeRect(sx, this.y, TILE_SIZE, TILE_SIZE);
      // 问号
      ctx.fillStyle = COLORS.BROWN;
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("?", sx + TILE_SIZE / 2, this.y + TILE_SIZE / 2);
    }
  }
}

// ==================== 金币 ====================

export class Coin extends Sprite {
  collected: boolean = false;

  constructor(x: number, y: number) {
    super(x, y, 20, 20);
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number) {
    if (this.collected) return;
    const sx = this.x - cameraX;
    ctx.fillStyle = COLORS.GOLD;
    ctx.beginPath();
    ctx.arc(sx + 10, this.y + 10, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.YELLOW;
    ctx.beginPath();
    ctx.arc(sx + 8, this.y + 8, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ==================== 蘑菇 ====================

export class Mushroom extends Sprite {
  collected: boolean = false;

  constructor(x: number, y: number) {
    super(x, y, 30, 30);
    this.vx = 1;
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number) {
    if (this.collected) return;
    const sx = this.x - cameraX;
    // 蘑菇头
    ctx.fillStyle = COLORS.GREEN;
    ctx.beginPath();
    ctx.ellipse(sx + 15, this.y + 8, 15, 12, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(sx, this.y + 8, 30, 22);
    // 白点
    ctx.fillStyle = COLORS.WHITE;
    ctx.beginPath();
    ctx.arc(sx + 8, this.y + 6, 5, 0, Math.PI * 2);
    ctx.arc(sx + 23, this.y + 10, 5, 0, Math.PI * 2);
    ctx.arc(sx + 13, this.y + 18, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ==================== 栗子仔 ====================

export class Goomba extends Sprite {
  alive: boolean = true;

  constructor(x: number, y: number) {
    super(x, y, 30, 30);
    this.vx = -1;
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number) {
    if (!this.alive) return;
    const sx = this.x - cameraX;
    // 身体
    ctx.fillStyle = COLORS.BROWN;
    ctx.fillRect(sx, this.y, this.w, this.h);
    // 脸
    ctx.fillStyle = "#C89664";
    ctx.fillRect(sx + 5, this.y + 5, 20, 10);
    // 眼睛
    ctx.fillStyle = COLORS.BLACK;
    ctx.fillRect(sx + 10, this.y + 8, 3, 3);
    ctx.fillRect(sx + 20, this.y + 8, 3, 3);
    // 脚
    ctx.fillStyle = COLORS.BLACK;
    ctx.fillRect(sx + 3, this.y + 22, 8, 6);
    ctx.fillRect(sx + 19, this.y + 22, 8, 6);
  }
}

// ==================== 旗帜 ====================

export class Flag extends Sprite {
  constructor(x: number, y: number) {
    super(x, y, 10, 200);
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number) {
    const sx = this.x - cameraX;
    // 旗杆
    ctx.fillStyle = "#969696";
    ctx.fillRect(sx + 4, this.y, 2, this.h);
    // 旗帜
    ctx.fillStyle = COLORS.GREEN;
    ctx.beginPath();
    ctx.moveTo(sx + 7, this.y + 5);
    ctx.lineTo(sx + 31, this.y + 20);
    ctx.lineTo(sx + 7, this.y + 35);
    ctx.closePath();
    ctx.fill();
  }
}
