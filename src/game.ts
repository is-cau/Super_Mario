/*
 * 游戏主类 — 集成像素渲染、音效、粒子、背景
 */

import {
  SCREEN_WIDTH, SCREEN_HEIGHT, GRAVITY, PLAYER_ACC, PLAYER_FRICTION,
  PLAYER_JUMP, MAX_SPEED, PIXEL, TILE, SFX_ENABLED, GameState,
} from "./settings";
import { Player, Platform, QuestionBlock, Coin, Mushroom, Goomba, Flag } from "./sprites";
import { buildLevel, LevelData } from "./level";
import { initBackground, updateBackground, drawBackground } from "./background";
import { updateParticles, drawParticles, clearParticles, spawnBrickParticles, spawnCoinPop, spawnStompParticles, spawnFloatingText, spawnFirework } from "./particles";
import { playSfx } from "./audio";

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  state: GameState = "menu";
  cameraX: number = 0;
  player!: Player;
  level!: LevelData;
  mushrooms: Mushroom[] = [];
  keysDown: Set<string> = new Set();
  animTick: number = 0;
  gameOverTimer: number = 0;
  winTimer: number = 0;
  flagReached: boolean = false;

  constructor() {
    this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    this.canvas.width = SCREEN_WIDTH;
    this.canvas.height = SCREEN_HEIGHT;
    this.ctx = this.canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
  }

  resetLevel() {
    this.level = buildLevel();
    this.mushrooms = [];
    this.cameraX = 0;
    this.animTick = 0;
    this.gameOverTimer = 0;
    this.winTimer = 0;
    this.flagReached = false;
    this.player = new Player(80, (13 - 2) * TILE); // 地面之上
    clearParticles();
    initBackground(0);
  }

  bindInput() {
    window.addEventListener("keydown", e => {
      this.keysDown.add(e.key);
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (this.state === "menu") { this.state = "playing"; this.resetLevel(); return; }
        if (this.state === "playing" && this.player.onGround) { this.player.vy = PLAYER_JUMP; playSfx("jump"); }
        if (this.state === "gameover" || this.state === "win") { this.state = "menu"; }
      }
    });
    window.addEventListener("keyup", e => this.keysDown.delete(e.key));
  }

  // ================== 物理更新 ==================

  update() {
    this.animTick++;
    if (this.state !== "playing") {
      if (this.state === "gameover") this.gameOverTimer++;
      if (this.state === "win") this.winTimer++;
      return;
    }

    const { player, level } = this;
    updateParticles();
    updateBackground(this.cameraX);

    // 水平移动
    player.ax = 0;
    player.ay = GRAVITY;
    if (this.keysDown.has("ArrowLeft") || this.keysDown.has("a") || this.keysDown.has("A")) {
      player.ax = -PLAYER_ACC;
      player.facingRight = false;
    }
    if (this.keysDown.has("ArrowRight") || this.keysDown.has("d") || this.keysDown.has("D")) {
      player.ax = PLAYER_ACC;
      player.facingRight = true;
    }
    player.ax += player.vx * PLAYER_FRICTION;
    player.vx += player.ax;
    player.vy += player.ay;
    if (Math.abs(player.vx) < 0.1) player.vx = 0;
    player.vx = Math.max(-MAX_SPEED, Math.min(player.vx, MAX_SPEED));
    player.x += player.vx;
    player.y += player.vy;

    // 行走动画
    player.animTimer++;
    if (player.onGround && Math.abs(player.vx) > 0.5) {
      if (player.animTimer > 8) { player.animFrame = (player.animFrame + 1) % 3; player.animTimer = 0; }
    } else if (!player.onGround) {
      player.animFrame = 2;
    } else {
      player.animFrame = 0;
    }

    // 边界
    player.x = Math.max(0, Math.min(player.x, (level.width || 6700) - player.w));

    // 平台碰撞
    player.onGround = false;
    for (const plat of level.platforms) {
      if (!player.collides(plat)) continue;
      if (player.vy > 0) {
        player.y = plat.top - player.h;
        player.vy = 0;
        player.onGround = true;
      } else if (player.vy < 0) {
        player.y = plat.bottom;
        player.vy = 0;
      }
    }

    // 掉落
    if (player.top > SCREEN_HEIGHT + 50) {
      player.lives--;
      if (player.lives <= 0) { this.state = "gameover"; playSfx("gameover"); return; }
      player.x = 80; player.y = (13 - 2) * TILE; player.vx = 0; player.vy = 0;
      player.big = false; player.h = 32; player.w = 16 * PIXEL;
      player.invincible = true; player.invincibleTimer = 120;
      playSfx("hurt");
      return;
    }

    // 无敌
    if (player.invincible) { player.invincibleTimer--; if (player.invincibleTimer <= 0) player.invincible = false; }

    // 敌人
    for (const enemy of level.enemies) {
      if (!enemy.alive) { if (enemy.squishTimer > 0) enemy.squishTimer--; continue; }
      enemy.vy += GRAVITY;
      enemy.x += enemy.vx;
      enemy.y += enemy.vy;
      enemy.onGround = false;
      for (const plat of level.platforms) {
        if (enemy.collides(plat)) {
          if (enemy.vy > 0) { enemy.y = plat.top - enemy.h; enemy.vy = 0; enemy.onGround = true; }
          if (Math.abs(enemy.right - plat.left) < 4) enemy.vx = -Math.abs(enemy.vx);
          if (Math.abs(enemy.left - plat.right) < 4) enemy.vx = Math.abs(enemy.vx);
        }
      }
    }

    // 蘑菇
    for (const mush of this.mushrooms) {
      if (mush.collected) continue;
      mush.vy += GRAVITY * 0.5;
      mush.x += mush.vx;
      mush.y += mush.vy;
      for (const plat of level.platforms) {
        if (mush.collides(plat)) {
          if (mush.vy > 0) { mush.y = plat.top - mush.h; mush.vy = 0; }
          if (Math.abs(mush.right - plat.left) < 4) mush.vx = -mush.vx;
          if (Math.abs(mush.left - plat.right) < 4) mush.vx = mush.vx;
        }
      }
      if (mush.top > SCREEN_HEIGHT) mush.collected = true;
    }

    // 金币
    for (const coin of level.coins) {
      if (!coin.collected && player.collides(coin)) {
        coin.collected = true;
        player.coins++;
        player.score += 200;
        playSfx("coin");
        spawnFloatingText(coin.x, coin.y, "+200", "#FFD700");
      }
    }

    // 蘑菇收集
    for (const mush of this.mushrooms) {
      if (!mush.collected && player.collides(mush)) {
        mush.collected = true;
        player.score += 500;
        if (!player.big) { this.growPlayer(); playSfx("powerup"); }
        spawnFloatingText(mush.x, mush.y, "1UP", "#00FF00");
      }
    }

    // 敌人碰撞
    if (!player.invincible) {
      for (const enemy of level.enemies) {
        if (!enemy.alive) continue;
        if (player.collides(enemy)) {
          if (player.vy > 0 && player.bottom - enemy.top < 20) {
            enemy.alive = false;
            enemy.squishTimer = 30;
            player.vy = -6;
            player.score += 500;
            playSfx("stomp");
            spawnStompParticles(enemy.x, enemy.bottom);
            spawnFloatingText(enemy.x, enemy.y, "+500", "#FFFFFF");
          } else {
            if (player.big) { this.shrinkPlayer(); player.invincible = true; player.invincibleTimer = 90; }
            else {
              player.lives--;
              if (player.lives <= 0) { this.state = "gameover"; playSfx("gameover"); return; }
              player.x = 80; player.y = (13 - 2) * TILE; player.vx = 0; player.vy = 0;
              player.invincible = true; player.invincibleTimer = 120;
            }
            playSfx("hurt");
          }
        }
      }
    }

    // 问号砖（从下方）
    for (const qb of level.questionBlocks) {
      if (!qb.used && player.vy < 0 && Math.abs(player.top - qb.bottom) < 12 && Math.abs(player.centerX - qb.centerX) < 20) {
        qb.used = true;
        player.vy = 0;
        if (qb.coin) {
          player.coins++;
          player.score += 200;
          playSfx("coin");
          spawnCoinPop(qb.x, qb.y - 16);
          spawnFloatingText(qb.x, qb.y, "+200", "#FFD700");
        } else {
          player.score += 100;
          playSfx("mushroom");
          if (this.mushrooms.length < 4) {
            const m = new Mushroom(qb.left, qb.top - 32);
            this.mushrooms.push(m);
            spawnFloatingText(qb.x, qb.y, "MUSH", "#00FF00");
          } else {
            spawnFloatingText(qb.x, qb.y, "+100", "#FFD700");
          }
        }
      }
    }

    // 砖块（仅 big 时从下方撞击破坏）
    for (const brick of level.bricks) {
      if (!brick.alive) continue;
      if (player.big && player.vy < 0 && Math.abs(player.top - brick.bottom) < 12 && Math.abs(player.centerX - brick.centerX) < 20) {
        brick.alive = false;
        player.vy = 0;
        player.score += 50;
        spawnBrickParticles(brick.x, brick.y);
        playSfx("stomp");
        // 从 platforms 移除
        const idx = level.platforms.indexOf(brick as unknown as Platform);
        if (idx >= 0) level.platforms.splice(idx, 1);
      }
    }

    // 旗帜
    if (!this.flagReached && level.flag && player.collides(level.flag)) {
      this.flagReached = true;
      player.score += 3000 + (player.coins * 100);
      playSfx("win");
      // 计算达到旗帜高度
      const flagHeight = Math.max(0, player.y - level.flag.y);
      const timePoints = Math.max(0, 300 - this.animTick) * 10;
      player.score += timePoints;
      spawnFloatingText(level.flag.x, level.flag.y + 100, `+${3000 + player.coins * 100 + timePoints}`, "#FFD700");
      this.state = "win";
    }

    // 相机
    this.cameraX = Math.max(0, Math.min(player.centerX - SCREEN_WIDTH / 3, (level.width || 6700) - SCREEN_WIDTH));
  }

  growPlayer() {
    if (!this.player.big) {
      this.player.big = true;
      const oldBottom = this.player.bottom;
      this.player.h = 32 * PIXEL;
      this.player.y = oldBottom - 32 * PIXEL;
      this.player.w = 16 * PIXEL;
    }
  }
  shrinkPlayer() {
    if (this.player.big) {
      this.player.big = false;
      const oldBottom = this.player.bottom;
      this.player.h = 16 * PIXEL;
      this.player.y = oldBottom - 16 * PIXEL;
      this.player.w = 16 * PIXEL;
    }
  }

  // ================== 渲染 ==================

  draw() {
    const { ctx, cameraX } = this;
    ctx.imageSmoothingEnabled = false;

    if (this.state === "menu") { drawBackground(ctx, 0); this.drawMenu(); return; }
    if (this.state === "gameover") { this.drawGameOver(); return; }

    drawBackground(ctx, cameraX);

    if (this.state === "playing" || this.state === "win") {
      const { level, player } = this;
      // 平台/地面
      for (const p of level.platforms) {
        if (p.right < cameraX - 32 || p.left > cameraX + SCREEN_WIDTH + 32) continue;
        p.draw(ctx, cameraX);
      }
      // 砖块（单独的 visible blocks）
      for (const b of level.bricks) {
        if (!b.alive) continue;
        if (b.right < cameraX - 32 || b.left > cameraX + SCREEN_WIDTH + 32) continue;
        b.draw(ctx, cameraX);
      }
      // 问号砖
      for (const qb of level.questionBlocks) {
        if (qb.right < cameraX - 32 || qb.left > cameraX + SCREEN_WIDTH + 32) continue;
        qb.draw(ctx, cameraX, this.animTick);
      }
      // 金币
      for (const coin of level.coins) {
        if (coin.right < cameraX - 32 || coin.left > cameraX + SCREEN_WIDTH + 32) continue;
        coin.draw(ctx, cameraX, this.animTick);
      }
      // 敌人
      for (const enemy of level.enemies) {
        if (enemy.right < cameraX - 32 || enemy.left > cameraX + SCREEN_WIDTH + 32) continue;
        enemy.draw(ctx, cameraX, this.animTick);
      }
      // 蘑菇
      for (const mush of this.mushrooms) {
        if (mush.right < cameraX - 32 || mush.left > cameraX + SCREEN_WIDTH + 32) continue;
        mush.draw(ctx, cameraX);
      }
      // 旗帜
      if (level.flag) level.flag.draw(ctx, cameraX);

      // 粒子
      drawParticles(ctx, cameraX);

      // 玩家
      if (!player.invincible || player.invincibleTimer % 6 < 3) {
        player.draw(ctx, cameraX, this.animTick);
      }

      // HUD
      this.drawHUD();

      if (this.state === "win") {
        this.drawWin();
        if (this.winTimer > 20 && this.winTimer < 30) {
          spawnFirework(SCREEN_WIDTH / 2 + cameraX, 100);
        }
        drawParticles(ctx, cameraX);
      }
    }
  }

  drawHUD() {
    const { ctx } = this;
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(0, 0, SCREEN_WIDTH, 28);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 14px 'Courier New', monospace";
    ctx.textAlign = "left";
    ctx.fillText(`MARIO`, 12, 20);
    const score = String(this.player.score).padStart(6, "0");
    ctx.fillText(score, 80, 20);
    ctx.fillText(`🪙 x${this.player.coins.toString().padStart(2, "0")}`, SCREEN_WIDTH / 2 - 30, 20);
    ctx.fillText(`WORLD`, SCREEN_WIDTH / 2 + 100, 20);
    ctx.fillText(`1-1`, SCREEN_WIDTH / 2 + 164, 20);
    ctx.textAlign = "right";
    ctx.fillText(`LIVES: ${this.player.lives}`, SCREEN_WIDTH - 12, 20);
  }

  drawMenu() {
    const { ctx } = this;
    ctx.textAlign = "center";
    ctx.fillStyle = "#E80000";
    ctx.font = "bold 40px 'Courier New', monospace";
    ctx.fillText("SUPER  MARIO", SCREEN_WIDTH / 2 + 1, 201);
    ctx.fillStyle = "#FF8C00";
    ctx.font = "bold 40px 'Courier New', monospace";
    ctx.fillText("SUPER  MARIO", SCREEN_WIDTH / 2, 200);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "20px 'Courier New', monospace";
    ctx.fillText("BROS.", SCREEN_WIDTH / 2, 235);
    ctx.font = "14px 'Courier New', monospace";
    ctx.fillText("© 1985 NINTENDO — HTML5 REMAKE", SCREEN_WIDTH / 2, 280);
    ctx.font = "18px 'Courier New', monospace";
    const blink = Math.sin(this.animTick * 0.1) > 0;
    if (blink) ctx.fillText("PRESS ENTER TO START", SCREEN_WIDTH / 2, 370);
    ctx.font = "13px sans-serif";
    ctx.fillStyle = "#AAAAAA";
    ctx.fillText("← → 移动    SPACE 跳跃", SCREEN_WIDTH / 2, 420);
    // 画小马里奥
    const mario = new Player(SCREEN_WIDTH / 2 - 16, 310);
    mario.draw(ctx, 0, this.animTick);
  }

  drawGameOver() {
    const { ctx } = this;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.textAlign = "center";
    ctx.fillStyle = "#E80000";
    ctx.font = "bold 40px 'Courier New', monospace";
    ctx.fillText("GAME  OVER", SCREEN_WIDTH / 2, 220);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "18px 'Courier New', monospace";
    ctx.fillText(`FINAL SCORE: ${this.player.score}`, SCREEN_WIDTH / 2, 300);
    const blink = Math.sin(this.animTick * 0.1) > 0;
    if (blink) ctx.fillText("PRESS ENTER TO CONTINUE", SCREEN_WIDTH / 2, 400);
  }

  drawWin() {
    const { ctx } = this;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, 100, SCREEN_WIDTH, 220);
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 28px 'Courier New', monospace";
    ctx.fillText("THANK YOU MARIO!", SCREEN_WIDTH / 2, 180);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "18px 'Courier New', monospace";
    ctx.fillText(`FINAL SCORE: ${this.player.score}`, SCREEN_WIDTH / 2, 220);
    ctx.fillText(`COINS: ${this.player.coins}`, SCREEN_WIDTH / 2, 250);
    const blink = Math.sin(this.animTick * 0.1) > 0;
    if (blink) ctx.fillText("PRESS ENTER TO CONTINUE", SCREEN_WIDTH / 2, 300);
  }
}
