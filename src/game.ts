/*
 * 游戏主类 — 状态管理、碰撞检测、渲染循环
 */

import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  GRAVITY,
  PLAYER_ACC,
  PLAYER_FRICTION,
  PLAYER_JUMP,
  MAX_SPEED,
  COLORS,
  TILE_SIZE,
  GameState,
} from "./settings";
import {
  Player,
  Platform,
  QuestionBlock,
  Coin,
  Mushroom,
  Goomba,
  Flag,
} from "./sprites";
import { buildLevel, LevelData } from "./level";

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  state: GameState = "menu";
  cameraX: number = 0;
  player!: Player;
  level!: LevelData;
  mushrooms: Mushroom[] = [];
  keysDown: Set<string> = new Set();

  constructor() {
    this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    this.canvas.width = SCREEN_WIDTH;
    this.canvas.height = SCREEN_HEIGHT;
    this.ctx = this.canvas.getContext("2d")!;
  }

  resetLevel() {
    this.level = buildLevel();
    this.mushrooms = [];
    this.cameraX = 0;
    this.player = new Player(80, SCREEN_HEIGHT - 200);
  }

  // ==================== 事件处理 ====================

  bindInput() {
    window.addEventListener("keydown", (e) => {
      this.keysDown.add(e.key);

      if (this.state === "menu" && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        this.state = "playing";
        this.resetLevel();
        return;
      }

      if (this.state === "playing") {
        if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
          e.preventDefault();
          if (this.player.onGround) this.player.vy = PLAYER_JUMP;
        }
      }

      if (
        (this.state === "gameover" || this.state === "win") &&
        (e.key === "Enter" || e.key === " ")
      ) {
        this.state = "menu";
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keysDown.delete(e.key);
    });
  }

  // ==================== 物理更新 ====================

  update() {
    if (this.state !== "playing") return;
    const { player, level } = this;

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

    // 边界
    player.x = Math.max(0, Math.min(player.x, SCREEN_WIDTH - player.w));

    // 平台碰撞
    player.onGround = false;
    for (const plat of level.platforms) {
      if (player.collides(plat)) {
        if (player.vy > 0) {
          // 下落 — 踩在平台上
          player.y = plat.top - player.h;
          player.vy = 0;
          player.onGround = true;
        } else if (player.vy < 0) {
          // 上升撞头
          player.y = plat.bottom;
          player.vy = 0;
        }
        // 水平碰撞修正
        if (player.x + player.w > plat.right && player.vx > 0) {
          player.x = plat.right - player.w;
        } else if (player.x < plat.left && player.vx < 0) {
          player.x = plat.left;
        }
      }
      // 问号砖也做平台碰撞
    }

    // 掉落
    if (player.top > SCREEN_HEIGHT) {
      player.lives--;
      if (player.lives <= 0) {
        this.state = "gameover";
      } else {
        player.x = 80;
        player.y = SCREEN_HEIGHT - 200;
        player.vx = 0;
        player.vy = 0;
        this.shrinkPlayer();
        player.invincible = true;
        player.invincibleTimer = 120;
      }
      return;
    }

    // 无敌倒计时
    if (player.invincible) {
      player.invincibleTimer--;
      if (player.invincibleTimer <= 0) player.invincible = false;
    }

    // 敌人更新
    for (const enemy of level.enemies) {
      if (!enemy.alive) continue;
      enemy.vy += GRAVITY;
      enemy.x += enemy.vx;
      enemy.y += enemy.vy;

      for (const plat of level.platforms) {
        if (enemy.collides(plat)) {
          if (enemy.vy > 0) {
            enemy.y = plat.top - enemy.h;
            enemy.vy = 0;
          }
          // 碰墙反弹
          if (Math.abs(enemy.right - plat.left) < 4) enemy.vx = -Math.abs(enemy.vx);
          if (Math.abs(enemy.left - plat.right) < 4) enemy.vx = Math.abs(enemy.vx);
        }
      }
    }

    // 蘑菇更新
    for (const mush of this.mushrooms) {
      if (mush.collected) continue;
      mush.vy += GRAVITY * 0.5;
      mush.x += mush.vx;
      mush.y += mush.vy;
      for (const plat of level.platforms) {
        if (mush.collides(plat)) {
          if (mush.vy > 0) {
            mush.y = plat.top - mush.h;
            mush.vy = 0;
          }
          if (Math.abs(mush.right - plat.left) < 4) mush.vx = -mush.vx;
          if (Math.abs(mush.left - plat.right) < 4) mush.vx = mush.vx;
        }
      }
    }

    // --- 金币收集 ---
    for (const coin of level.coins) {
      if (!coin.collected && player.collides(coin)) {
        coin.collected = true;
        player.coins++;
        player.score += 100;
      }
    }

    // --- 蘑菇收集 ---
    for (const mush of this.mushrooms) {
      if (!mush.collected && player.collides(mush)) {
        mush.collected = true;
        player.score += 200;
        this.growPlayer();
      }
    }

    // --- 敌人碰撞 ---
    if (!player.invincible) {
      for (const enemy of level.enemies) {
        if (!enemy.alive) continue;
        if (player.collides(enemy)) {
          if (player.vy > 0 && player.bottom < enemy.centerY) {
            // 踩死敌人
            enemy.alive = false;
            player.vy = -8;
            player.score += 500;
          } else {
            // 受伤
            if (player.big) {
              this.shrinkPlayer();
              player.invincible = true;
              player.invincibleTimer = 90;
            } else {
              player.lives--;
              if (player.lives <= 0) {
                this.state = "gameover";
                return;
              }
              player.x = 80;
              player.y = SCREEN_HEIGHT - 200;
              player.vx = 0;
              player.vy = 0;
              player.invincible = true;
              player.invincibleTimer = 120;
            }
          }
        }
      }
    }

    // --- 问号砖碰撞（从下方顶） ---
    for (const qb of level.questionBlocks) {
      if (!qb.used && player.vy < 0) {
        if (
          Math.abs(player.top - qb.bottom) < 15 &&
          Math.abs(player.centerX - qb.centerX) < 25
        ) {
          qb.used = true;
          player.vy = 0;
          // 随机出金币或蘑菇
          if (Math.random() < 0.5) {
            player.coins++;
            player.score += 200;
          } else {
            if (this.mushrooms.length < 3) {
              this.mushrooms.push(new Mushroom(qb.left, qb.top - 35));
            }
          }
        }
      }
    }

    // --- 终点旗帜 ---
    if (level.flag && player.collides(level.flag)) {
      player.score += 1000;
      this.state = "win";
    }

    // 相机跟随
    this.cameraX = Math.max(0, player.centerX - SCREEN_WIDTH / 3);
  }

  growPlayer() {
    if (!this.player.big) {
      this.player.big = true;
      const oldBottom = this.player.bottom;
      this.player.h = 60;
      this.player.y = oldBottom - 60;
    }
  }

  shrinkPlayer() {
    if (this.player.big) {
      this.player.big = false;
      const oldBottom = this.player.bottom;
      this.player.h = 40;
      this.player.y = oldBottom - 40;
    }
  }

  // ==================== 渲染 ====================

  draw() {
    const { ctx, cameraX } = this;
    ctx.fillStyle = COLORS.SKY_BLUE;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    if (this.state === "menu") return this.drawMenu();
    if (this.state === "gameover") return this.drawGameOver();
    if (this.state === "win") return this.drawWin();

    // 游戏画面
    const { level, player } = this;
    // 平台
    for (const p of level.platforms) p.draw(ctx, cameraX);
    for (const qb of level.questionBlocks) qb.draw(ctx, cameraX);
    for (const coin of level.coins) coin.draw(ctx, cameraX);
    for (const enemy of level.enemies) enemy.draw(ctx, cameraX);
    for (const mush of this.mushrooms) mush.draw(ctx, cameraX);
    if (level.flag) level.flag.draw(ctx, cameraX);

    // 玩家（无敌闪烁）
    if (!player.invincible || player.invincibleTimer % 6 < 3) {
      player.draw(ctx, cameraX);
    }

    // UI
    ctx.fillStyle = COLORS.WHITE;
    ctx.font = "18px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`❤ x${player.lives}`, 20, 30);
    ctx.fillText(`🪙 x${player.coins}`, 120, 30);
    ctx.textAlign = "right";
    ctx.fillText(`Score: ${player.score}`, SCREEN_WIDTH - 20, 30);
  }

  drawMenu() {
    const { ctx } = this;
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.RED;
    ctx.font = "bold 48px sans-serif";
    ctx.fillText("超级玛丽", SCREEN_WIDTH / 2, 160);
    ctx.fillStyle = COLORS.WHITE;
    ctx.font = "bold 36px sans-serif";
    ctx.fillText("Super Mario Bros", SCREEN_WIDTH / 2, 220);
    ctx.font = "20px sans-serif";
    ctx.fillText("按 ENTER / SPACE 开始游戏", SCREEN_WIDTH / 2, 370);
    ctx.fillStyle = COLORS.YELLOW;
    ctx.fillText("方向键移动 | 空格跳跃 | ESC退出", SCREEN_WIDTH / 2, 410);

    // 装饰性马里奥
    ctx.fillStyle = COLORS.RED;
    ctx.fillRect(SCREEN_WIDTH / 2 - 30, 270, 60, 80);
    ctx.fillStyle = COLORS.BLUE;
    ctx.fillRect(SCREEN_WIDTH / 2 - 20, 300, 40, 30);
    ctx.fillStyle = "#FFC896";
    ctx.fillRect(SCREEN_WIDTH / 2 - 10, 275, 20, 20);
    ctx.fillStyle = COLORS.BROWN;
    ctx.fillRect(SCREEN_WIDTH / 2 - 15, 270, 30, 10);
  }

  drawGameOver() {
    const { ctx } = this;
    ctx.fillStyle = COLORS.BLACK;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.RED;
    ctx.font = "bold 48px sans-serif";
    ctx.fillText("GAME OVER", SCREEN_WIDTH / 2, 220);
    ctx.fillStyle = COLORS.WHITE;
    ctx.font = "22px sans-serif";
    ctx.fillText(`最终得分: ${this.player.score}`, SCREEN_WIDTH / 2, 300);
    ctx.fillText("按 ENTER 返回菜单", SCREEN_WIDTH / 2, 400);
  }

  drawWin() {
    const { ctx } = this;
    ctx.fillStyle = COLORS.BLACK;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.GOLD;
    ctx.font = "bold 48px sans-serif";
    ctx.fillText("YOU WIN!", SCREEN_WIDTH / 2, 200);
    ctx.fillStyle = COLORS.WHITE;
    ctx.font = "22px sans-serif";
    ctx.fillText(`最终得分: ${this.player.score}`, SCREEN_WIDTH / 2, 280);
    ctx.fillText(`金币: ${this.player.coins}`, SCREEN_WIDTH / 2, 320);
    ctx.fillText("按 ENTER 返回菜单", SCREEN_WIDTH / 2, 400);
  }
}
