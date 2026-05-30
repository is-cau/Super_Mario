/*
 * 游戏主类 — 集成像素渲染、音效、粒子、背景
 */

import {
  SCREEN_WIDTH, SCREEN_HEIGHT, GRAVITY, PLAYER_ACC, PLAYER_FRICTION,
  PLAYER_JUMP, MAX_SPEED, PIXEL, TILE, SFX_ENABLED, GameState,
} from "./settings";
import { Player, Platform, QuestionBlock, Coin, Mushroom, Mushroom1UP, Goomba, Koopa, Piranha, Flag, Castle, Bowser, BowserFire, FireFlower, Star as StarItem, Fireball, setSpriteCache } from "./sprites";
import { buildLevel, LevelData, GROUND_ROW } from "./level";
import { initCache } from "./assets";
import { initBackground, updateBackground, drawBackground } from "./background";
import { updateParticles, drawParticles, clearParticles, spawnBrickParticles, spawnCoinPop, spawnStompParticles, spawnFloatingText, spawnFirework } from "./particles";
import { playSfx, startBgm, stopBgm } from "./audio";

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  state: GameState = "menu";
  cameraX: number = 0;
  player!: Player;
  level!: LevelData;
  mushrooms: Mushroom[] = [];
  fireballs: Fireball[] = [];
  bossFires: BowserFire[] = [];
  stars: StarItem[] = [];
  pickupItems: (FireFlower | StarItem)[] = [];
  koopas: Koopa[] = [];
  oneupMushrooms: Mushroom1UP[] = [];
  piranhas: Piranha[] = [];
  keysDown: Set<string> = new Set();
  lastTapDir: "" | "left" | "right" = "";
  lastTapTime: number = 0;
  sprinting: boolean = false;
  animTick: number = 0;
  gameOverTimer: number = 0;
  winTimer: number = 0;
  flagReached: boolean = false;
  victoryDance: number = 0;   // 胜利跳舞动画帧
  paused: boolean = false;
  deathAnim: number = 0;    // 死亡弹跳动画帧计数
  deathVY: number = 0;      // 死亡弹跳速度
  timeLeft: number = 400;
  titleCard: number = 0;
  shellCombo: number = 0;   // 龟壳连击计数

  constructor() {
    this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    this.canvas.width = SCREEN_WIDTH;
    this.canvas.height = SCREEN_HEIGHT;
    this.ctx = this.canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    // 预渲染精灵缓存
    const cache = initCache();
    if (cache) setSpriteCache(cache);
    else console.warn("Sprite cache not supported, using fallback renderer");
  }

  resetLevel() {
    this.level = buildLevel();
    this.mushrooms = [];
    this.fireballs = [];
    this.bossFires = [];
    this.stars = [];
    this.pickupItems = [];
    this.oneupMushrooms = [];
    this.koopas = [...(this.level.koopas || [])];
    // 在水管处生成食人花
    this.piranhas = [];
    const pipeCols = [25, 45, 88, 110, 175]; // 水管所在列
    for (const col of pipeCols) {
      const px = col * TILE + 8;
      const py = (GROUND_ROW - 1) * TILE - 8;
      this.piranhas.push(new Piranha(px, py));
    }
    this.cameraX = 0;
    this.animTick = 0;
    this.gameOverTimer = 0;
    this.winTimer = 0;
    this.flagReached = false;
    this.victoryDance = 0;
    this.paused = false;
    this.deathAnim = 0;
    this.deathVY = 0;
    this.timeLeft = 400;
    this.titleCard = 120;
    this.shellCombo = 0;
    this.player = new Player(80, (13 - 2) * TILE);
    clearParticles();
    initBackground(0);
  }

  bindInput() {
    window.addEventListener("keydown", e => {
      this.keysDown.add(e.key);
      // 双击方向键检测 — 开启冲刺
      const now = performance.now();
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        if (this.lastTapDir === "left" && now - this.lastTapTime < 300) {
          this.sprinting = true;
        } else { this.sprinting = false; }
        this.lastTapDir = "left"; this.lastTapTime = now;
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        if (this.lastTapDir === "right" && now - this.lastTapTime < 300) {
          this.sprinting = true;
        } else { this.sprinting = false; }
        this.lastTapDir = "right"; this.lastTapTime = now;
      }
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        this.lastTapTime = 0; this.sprinting = false; // 跳跃取消冲刺标记
      }

      if (e.key === "Escape") {
        if (this.state === "playing") this.paused = !this.paused;
      }

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (this.state === "menu") { this.state = "playing"; this.resetLevel(); startBgm(); return; }
        if (this.state === "playing" && !this.paused) {
          if (this.player.onGround) { this.player.vy = PLAYER_JUMP; this.player.jumpCount = 0; playSfx("jump"); }
          else if (this.player.jumpCount < 1) { this.player.vy = PLAYER_JUMP * 0.85; this.player.jumpCount++; playSfx("jump"); }
        }
        if (this.state === "gameover" || this.state === "win") { this.state = "menu"; stopBgm(); }
      }
      // 火球发射
      if ((e.key === "j" || e.key === "J") && this.state === "playing" && this.player.fireForm && this.player.shootCooldown <= 0) {
        const dir = this.player.facingRight ? 1 : -1;
        this.fireballs.push(new Fireball(this.player.centerX, this.player.centerY, dir));
        this.player.shootCooldown = 15;
        playSfx("coin");
      }
    });
    window.addEventListener("keyup", e => this.keysDown.delete(e.key));
  }

  // ================== 物理更新 ==================

  update(dt: number = 1) {
    this.animTick++;
    if (this.state !== "playing") {
      if (this.state === "gameover") this.gameOverTimer++;
      if (this.state === "win") this.winTimer++;
      return;
    }
    if (this.titleCard > 0) return; // 标题卡冻结游戏

    const { player, level } = this;

    // 暂停
    if (this.paused) {
      this.keysDown.clear();
      return;
    }

    // 死亡弹跳动画
    if (this.deathAnim > 0) {
      this.deathAnim--;
      this.deathVY -= 0.3;
      player.y -= this.deathVY * dt;
      if (this.deathAnim <= 0) {
        player.lives--;
        if (player.lives <= 0) { this.state = "gameover"; playSfx("gameover"); }
        else {
          player.x = Math.max(80, this.cameraX + SCREEN_WIDTH / 3);
          player.y = (13 - 2) * TILE; player.vx = 0; player.vy = 0;
          player.big = false; player.fireForm = false; player.starForm = false;
          player.h = 32; player.w = 16 * PIXEL;
          player.invincible = true; player.invincibleTimer = 180;
        }
      }
      updateParticles();
      return;
    }

    // 倒计时
    if (this.animTick % 60 === 0 && this.timeLeft > 0) {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.deathAnim = 30; this.deathVY = -8; playSfx("hurt");
        return;
      }
    }

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
    player.vx += player.ax * dt;
    player.vy += player.ay * dt;
    if (Math.abs(player.vx) < 0.1) player.vx = 0;
    const speedLimit = this.sprinting ? MAX_SPEED * 1.6 : MAX_SPEED;
    player.vx = Math.max(-speedLimit, Math.min(player.vx, speedLimit));
    // 停止按方向键时取消冲刺
    if (!this.keysDown.has("ArrowLeft") && !this.keysDown.has("a") && !this.keysDown.has("A") &&
        !this.keysDown.has("ArrowRight") && !this.keysDown.has("d") && !this.keysDown.has("D")) {
      this.sprinting = false;
    }
    player.x += player.vx * dt;
    player.y += player.vy * dt;

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

    // 掉落 — 死亡弹跳动画
    if (player.top > SCREEN_HEIGHT + 50) {
      if (player.lives <= 1) { this.state = "gameover"; playSfx("gameover"); return; }
      player.y = SCREEN_HEIGHT - 100;
      this.deathAnim = 30; this.deathVY = -8;
      playSfx("hurt");
      return;
    }

    // 无敌
    if (player.invincible) { player.invincibleTimer--; if (player.invincibleTimer <= 0) player.invincible = false; }
    // 无敌星计时
    if (player.starForm) { player.starTimer--; if (player.starTimer <= 0) player.starForm = false; }
    // 火球冷却
    if (player.shootCooldown > 0) player.shootCooldown--;

    // 敌人
    for (const enemy of level.enemies) {
      if (!enemy.alive) { if (enemy.squishTimer > 0) enemy.squishTimer--; continue; }
      enemy.vy += GRAVITY * dt;
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
      enemy.onGround = false;
      let hitWall = false;
      for (const plat of level.platforms) {
        if (enemy.collides(plat)) {
          if (enemy.vy > 0) { enemy.y = plat.top - enemy.h; enemy.vy = 0; enemy.onGround = true; }
          else {
            // 不是从上方落下的碰撞 = 撞墙 → 回头
            enemy.vx = -enemy.vx;
            enemy.x += enemy.vx * 2; // 推开防止卡住
            hitWall = true;
          }
        }
      }
      // 悬崖边缘检测
      if (enemy.onGround && !hitWall) {
        const aheadX = enemy.vx > 0 ? enemy.right + 4 : enemy.left - 4;
        const belowY = enemy.bottom + 4;
        let hasGround = false;
        for (const plat of level.platforms) {
          if (aheadX >= plat.left && aheadX <= plat.right && Math.abs(belowY - plat.top) < 10) {
            hasGround = true; break;
          }
        }
        if (!hasGround) enemy.vx = -enemy.vx;
      }
      if (enemy.x < 16) { enemy.vx = Math.abs(enemy.vx); enemy.x = 16; }
    }

    // 乌龟更新
    for (const k of this.koopas) {
      if (!k.alive && k.inShell && !k.shellMoving) continue;
      k.updateAnim();
      k.vy += GRAVITY * dt;
      k.x += k.vx * dt;
      k.y += k.vy * dt;
      for (const plat of level.platforms) {
        if (k.collides(plat)) {
          if (k.vy > 0) { k.y = plat.top - k.h; k.vy = 0; k.onGround = true; }
          if (Math.abs(k.right - plat.left) < 4 || Math.abs(k.left - plat.right) < 4) {
            if (k.inShell && k.shellMoving) k.vx = -k.vx;
            else k.vx = k.inShell ? 0 : -k.vx;
          }
        }
      }
      if (k.x < 16) { k.vx = Math.abs(k.vx); k.x = 16; }
      // 龟壳撞敌人（连击加分）
      if (k.inShell && k.shellMoving && Math.abs(k.vx) > 2) {
        for (const e of level.enemies) {
          if (!e.alive) continue;
          if (k.collides(e)) { e.alive = false; e.squishTimer = 20; this.shellCombo++; player.score += 100 * Math.pow(2, this.shellCombo); spawnFloatingText(e.x, e.y, `+${100 * Math.pow(2, this.shellCombo)}`, "#FFF"); playSfx("stomp"); }
        }
        for (const k2 of this.koopas) {
          if (k2 === k || !k2.alive) continue;
          if (k.collides(k2)) { k2.alive = false; k2.inShell = false; this.shellCombo++; player.score += 100 * Math.pow(2, this.shellCombo); playSfx("stomp"); }
        }
      }
    }

    // 食人花伸缩
    for (const p of this.piranhas) {
      if (!p.alive) continue;
      p.timer++;
      if (p.up && p.timer > 60) { p.up = false; p.timer = 0; }
      else if (!p.up && p.timer > 90) { p.up = true; p.timer = 0; }
      if (Math.abs(player.centerX - p.centerX) < 200) {
        p.y = p.up ? p.baseY - Math.min(p.timer * 2, 48) : p.baseY;
      } else {
        p.y = p.baseY + 48;
      }
    }
    // 食人花碰撞
    for (const p of this.piranhas) {
      if (!p.alive || p.y > p.baseY + 10) continue;
      if (player.collides(p) && !player.invincible) {
        if (player.starForm) { p.alive = false; player.score += 400; playSfx("stomp"); continue; }
        if (player.big) { this.shrinkPlayer(); player.invincible = true; player.invincibleTimer = 90; }
        else { if (player.lives <= 1) { this.state = "gameover"; return; } this.deathAnim = 30; this.deathVY = -8; }
        playSfx("hurt");
      }
      for (const fb of this.fireballs) {
        if (fb.alive && p.alive && fb.collides(p)) { fb.alive = false; p.alive = false; player.score += 400; playSfx("stomp"); }
      }
    }

    // 1UP 蘑菇
    for (const m1 of this.oneupMushrooms) {
      if (m1.collected) continue;
      m1.vy += GRAVITY * 0.5 * dt;
      m1.x += m1.vx * dt;
      m1.y += m1.vy * dt;
      for (const plat of level.platforms) {
        if (m1.collides(plat) && m1.vy > 0) { m1.y = plat.top - m1.h; m1.vy = 0; }
        if (Math.abs(m1.right - plat.left) < 4 || Math.abs(m1.left - plat.right) < 4) m1.vx = -m1.vx;
      }
    }

    // 蘑菇
    for (const mush of this.mushrooms) {
      if (mush.collected) continue;
      mush.vy += GRAVITY * 0.5 * dt;
      mush.x += mush.vx * dt;
      mush.y += mush.vy * dt;
      for (const plat of level.platforms) {
        if (mush.collides(plat)) {
          if (mush.vy > 0) { mush.y = plat.top - mush.h; mush.vy = 0; }
          if (Math.abs(mush.right - plat.left) < 4) mush.vx = -mush.vx;
          if (Math.abs(mush.left - plat.right) < 4) mush.vx = mush.vx;
        }
      }
      if (mush.top > SCREEN_HEIGHT) mush.collected = true;
    }

    // 火球更新
    for (const fb of this.fireballs) {
      if (!fb.alive) continue;
      fb.vy += GRAVITY * 0.3 * dt;
      fb.x += fb.vx * dt;
      fb.y += fb.vy * dt;
      // 火球碰撞平台 → 反弹
      for (const plat of level.platforms) {
        if (fb.collides(plat)) {
          if (fb.vy > 0) { fb.y = plat.top - fb.h; fb.vy = -6; }  // 落地反弹
          else if (fb.vy < 0) { fb.y = plat.bottom; fb.vy = 0; }    // 碰顶
          // 碰墙反弹
          if (Math.abs(fb.right - plat.left) < 6 || Math.abs(fb.left - plat.right) < 6) {
            fb.vx = -fb.vx;
          }
        }
      }
      if (fb.x < this.cameraX - 50 || fb.x > this.cameraX + SCREEN_WIDTH + 50 || fb.y > SCREEN_HEIGHT) fb.alive = false;
      // 火球 vs 敌人
      for (const enemy of level.enemies) {
        if (!enemy.alive) continue;
        if (fb.collides(enemy)) { fb.alive = false; enemy.alive = false; enemy.squishTimer = 20; playSfx("stomp"); }
      }
    }
    // Boss 更新
    const boss = level.boss;
    if (boss && (boss.alive || boss.y < SCREEN_HEIGHT + 100) && player.x > boss.x - 400) {
      // 死亡掉下动画
      if (!boss.alive) { boss.y += 4; if (boss.y > SCREEN_HEIGHT + 200) { boss.y = -999; } }
      else {
      boss.updateAnim();
      // Boss 移动
      boss.vy += GRAVITY * dt;
      boss.x += boss.vx * dt;
      boss.y += boss.vy * dt;
      for (const plat of level.platforms) {
        if (boss.collides(plat)) {
          if (boss.vy > 0) { boss.y = plat.top - boss.h; boss.vy = 0; boss.onGround = true; }
          if (Math.abs(boss.left - plat.right) < 4 || Math.abs(boss.right - plat.left) < 4) boss.vx = -boss.vx;
        }
      }
      // Boss 发射火球
      if (boss.shootCooldown <= 0 && boss.x < player.x + 400) {
        this.bossFires.push(new BowserFire(boss.centerX, boss.bottom));
        boss.shootCooldown = 90 + Math.random() * 60;
      }
      // Boss fireballs
      for (const bf of this.bossFires) {
        if (!bf.alive) continue;
        bf.vy += 0.1 * dt;
        bf.x += bf.vx * dt;
        bf.y += bf.vy * dt;
        for (const plat of level.platforms) {
          if (bf.collides(plat) && bf.vy > 0) { bf.y = plat.top - bf.h; bf.vy = -3; }
        }
        if (bf.y > SCREEN_HEIGHT + 50) bf.alive = false;
        // Boss 火球打玩家
        if (bf.collides(player) && !player.invincible) {
          bf.alive = false;
          if (player.big) { this.shrinkPlayer(); player.invincible = true; player.invincibleTimer = 90; }
          else {
            if (player.lives <= 1) { this.state = "gameover"; playSfx("gameover"); return; }
            this.deathAnim = 30; this.deathVY = -8;
          }
          playSfx("hurt");
        }
      }
      // 踩 Boss（只伤1HP，不杀）
      if (boss.invincibleTimer <= 0 && player.collides(boss)) {
        const fromAbove = player.bottom - boss.top < 50 && Math.abs(player.centerX - boss.centerX) < 35;
        if (fromAbove) {
          boss.hp--;
          boss.invincibleTimer = 40;
          player.vy = -8;
          playSfx("stomp");
          spawnFloatingText(boss.x + 20, boss.y, boss.hp > 0 ? "-1" : "KO!", "#FF0");
          if (boss.hp <= 0) {
            boss.alive = false;
            player.score += 5000;
            spawnFirework(boss.centerX, boss.y);
          }
        } else if (!player.invincible) {
          if (player.big) { this.shrinkPlayer(); player.invincible = true; player.invincibleTimer = 90; }
          else {
            if (player.lives <= 1) { this.state = "gameover"; playSfx("gameover"); return; }
            this.deathAnim = 30; this.deathVY = -8;
          }
          playSfx("hurt");
        }
      }
      // 火球打 Boss
      for (const fb of this.fireballs) {
        if (!fb.alive || !boss.alive) continue;
        if (fb.collides(boss) && boss.invincibleTimer <= 0) {
          fb.alive = false;
          boss.hp--;
          boss.invincibleTimer = 30;
          playSfx("stomp");
          spawnFloatingText(boss.x + 20, boss.y, boss.hp > 0 ? "-1" : "KO!", "#FF0");
          if (boss.hp <= 0) {
            boss.alive = false;
            player.score += 5000;
            spawnFirework(boss.centerX, boss.y);
          }
        }
      }
      } // close boss alive else
      // 龟壳撞击 Boss
      for (const k of this.koopas) {
        if (!boss.alive || boss.invincibleTimer > 0) break;
        if (k.inShell && k.shellMoving && Math.abs(k.vx) > 2 && k.collides(boss)) {
          boss.hp--;
          boss.invincibleTimer = 30;
          k.vx = -k.vx;
          playSfx("stomp");
          if (boss.hp <= 0) {
            boss.alive = false;
            player.score += 5000;
            spawnFirework(boss.centerX, boss.y);
          }
        }
      }
    }

    // 无敌星更新
    for (const st of this.stars) {
      if (st.collected) continue;
      st.vy += GRAVITY * dt;
      st.x += st.vx * dt;
      st.y += st.vy * dt;
      for (const plat of level.platforms) {
        if (st.collides(plat)) {
          if (st.vy > 0) { st.y = plat.top - st.h; st.vy = -8; } else { st.vy = Math.abs(st.vy); }
          if (Math.abs(st.right - plat.left) < 4 || Math.abs(st.left - plat.right) < 4) st.vx = -st.vx;
        }
      }
      if (st.top > SCREEN_HEIGHT) st.collected = true;
    }
    // 火焰花/星星道具更新
    for (const item of this.pickupItems) {
      if (item.collected) continue;
      (item as any).vy = ((item as any).vy || 0) + GRAVITY * 0.5 * dt;
      item.x += (item.vx || 0) * dt;
      item.y += (item.vy || 0) * dt;
      for (const plat of level.platforms) {
        if (item.collides(plat)) {
          if ((item.vy || 0) > 0) { item.y = plat.top - item.h; item.vy = 0; }
        }
      }
      if (item.top > SCREEN_HEIGHT) item.collected = true;
    }

    // 金币
    for (const coin of level.coins) {
      if (!coin.collected && player.collides(coin)) {
        coin.collected = true;
        player.coins++;
        player.score += 200;
        // 100 金币 = 1UP
        if (player.coins % 100 === 0) {
          player.lives++;
          spawnFloatingText(coin.x, coin.y, "1UP!", "#00FF00");
          playSfx("powerup");
        }
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
        else { player.fireForm = true; playSfx("powerup"); }
        spawnFloatingText(mush.x, mush.y, "巨大化", "#00FF00");
      }
    }
    // 无敌星收集
    for (const st of this.stars) {
      if (!st.collected && player.collides(st)) {
        st.collected = true;
        player.score += 1000;
        player.starForm = true; player.starTimer = 600;
        playSfx("powerup");
        spawnFloatingText(st.x, st.y, "☆无敌☆", "#FFD700");
      }
    }
    // 火焰花收集
    for (const item of this.pickupItems) {
      if (!item.collected && player.collides(item)) {
        item.collected = true;
        if (player.fireForm) { player.score += 500; spawnFloatingText(item.x, item.y, "+500", "#FF8800"); }
        else { player.score += 1000; player.fireForm = true; if (!player.big) this.growPlayer(); spawnFloatingText(item.x, item.y, "火焰花", "#FF8800"); playSfx("powerup"); }
      }
    }

    // 敌人碰撞
    if (!player.invincible) {
      for (const enemy of level.enemies) {
        if (!enemy.alive) continue;
        if (player.collides(enemy)) {
          if (player.starForm) { enemy.alive = false; enemy.squishTimer = 20; player.score += 500; playSfx("stomp"); continue; }
          // 放宽踩怪判定：上方 + 横向重叠 25px + 纵向 40px
          const fromAbove = player.bottom - enemy.top < 40 && Math.abs(player.centerX - enemy.centerX) < 25;
          if (fromAbove) {
            // 一次性踩死范围内所有敌人
            for (const e2 of level.enemies) {
              if (!e2.alive) continue;
              if (Math.abs(e2.centerX - enemy.centerX) < 50 && player.bottom - e2.top < 50) {
                e2.alive = false;
                e2.squishTimer = 30;
                player.score += 500;
                spawnStompParticles(e2.x, e2.bottom);
                spawnFloatingText(e2.x, e2.y, "+500", "#FFFFFF");
              }
            }
            player.vy = -7;
            playSfx("stomp");
          } else {
            if (player.big) { this.shrinkPlayer(); player.invincible = true; player.invincibleTimer = 90; playSfx("hurt"); }
            else {
              if (player.lives <= 1) { this.state = "gameover"; playSfx("gameover"); return; }
              this.deathAnim = 30; this.deathVY = -8;
              playSfx("hurt");
            }
          }
        }
      }
    }
    // 乌龟碰撞
    for (const k of this.koopas) {
      const touching = player.collides(k);
      if (!touching) continue;
      if (player.starForm && k.alive) { k.alive = false; k.inShell = false; player.score += 300; playSfx("stomp"); continue; }
      if (player.invincible) continue;
      const fa = player.bottom - k.top < 40 && Math.abs(player.centerX - k.centerX) < 25;
      if (fa && k.alive && !k.inShell) {
        // 踩活乌龟 → 变壳
        k.alive = false; k.inShell = true; k.vx = 0; k.h = 16; k.y += 14;
        player.vy = -7; player.score += 300; playSfx("stomp");
      } else if (fa && k.inShell && !k.shellMoving) {
        // 踢静止壳
        k.shellMoving = true; k.vx = player.facingRight ? 8 : -8; player.vy = -6;
        player.score += 100; playSfx("stomp");
      } else if (fa && k.inShell && k.shellMoving) {
        // 踩滑动壳 → 停住
        k.shellMoving = false; k.vx = 0; player.vy = -6;
      } else if (k.inShell && k.shellMoving) {
        // 被滑壳撞伤
        if (player.big) { this.shrinkPlayer(); player.invincible = true; player.invincibleTimer = 90; }
        else { if (player.lives <= 1) { this.state = "gameover"; return; } this.deathAnim = 30; this.deathVY = -8; }
        playSfx("hurt");
      } else if (!k.inShell && !fa) {
        // 侧面碰活乌龟受伤
        if (player.big) { this.shrinkPlayer(); player.invincible = true; player.invincibleTimer = 90; playSfx("hurt"); }
        else { if (player.lives <= 1) { this.state = "gameover"; return; } this.deathAnim = 30; this.deathVY = -8; playSfx("hurt"); }
      }
    }
    // 1UP 蘑菇
    for (const m1 of this.oneupMushrooms) {
      if (!m1.collected && player.collides(m1)) {
        m1.collected = true; player.lives++; player.score += 1000; playSfx("powerup");
        spawnFloatingText(m1.x, m1.y, "1UP!", "#00FF00");
      }
    }

    // 问号砖（从下方）
    for (const qb of level.questionBlocks) {
      if (!qb.used && player.vy < 0 && Math.abs(player.top - qb.bottom) < 12 && Math.abs(player.centerX - qb.centerX) < 20) {
        qb.used = true;
        player.vy = 0;
        const r = Math.random();
        if (r < 0.3) {
          player.coins++; player.score += 200; playSfx("coin");
          spawnCoinPop(qb.x, qb.y + 10);
          spawnFloatingText(qb.x, qb.y, "+200", "#FFD700");
        } else if (r < 0.6) {
          player.score += 100; playSfx("mushroom");
          if (this.mushrooms.length < 4) this.mushrooms.push(new Mushroom(qb.left, qb.top - 32));
          spawnFloatingText(qb.x, qb.y, "蘑菇", "#00FF00");
        } else if (r < 0.85) {
          player.score += 100;
          if (this.pickupItems.length < 3) {
            const ff = new FireFlower(qb.left, qb.top - 32);
            (ff as any).vy = -4; this.pickupItems.push(ff);
          }
          spawnFloatingText(qb.x, qb.y, "火焰花", "#FF8800");
        } else {
          player.score += 200;
          if (this.stars.length < 2) this.stars.push(new StarItem(qb.left, qb.top - 32));
          spawnFloatingText(qb.x, qb.y, "☆", "#FFD700");
        }
      }
    }

    // 砖块破坏（大马力欧从下方顶）
    for (let i = level.bricks.length - 1; i >= 0; i--) {
      const brick = level.bricks[i];
      if (!brick.alive) continue;
      if (player.big && player.vy < 0 && Math.abs(player.top - brick.bottom) < 12 && Math.abs(player.centerX - brick.centerX) < 20) {
        brick.alive = false;
        player.vy = 0;
        player.score += 50;
        spawnBrickParticles(brick.x, brick.y);
        playSfx("stomp");
        // 从 platforms 移除
        const pidx = level.platforms.indexOf(brick);
        if (pidx >= 0) level.platforms.splice(pidx, 1);
        level.bricks.splice(i, 1);
      }
    }

    // 碰城堡 → 胜利跳舞
    if (!this.flagReached && level.castle && player.collides(level.castle)) {
      this.flagReached = true;
      this.victoryDance = 180; // 3秒跳舞
      player.vx = 0;
      player.x = level.castle.x - player.w - 10;
      player.facingRight = false;
      const timeBonus = Math.max(0, 300 - this.animTick) * 10;
      player.score += 3000 + player.coins * 100 + timeBonus;
      playSfx("win");
    }

    // 胜利跳舞动画
    if (this.flagReached && this.victoryDance > 0) {
      this.victoryDance--;
      player.x = (level.castle?.x ?? 6400) - player.w - 10;
      player.facingRight = false;
      // 蹦跳
      if (this.victoryDance % 20 < 10) {
        player.y = (level.castle?.y ?? 0) + 96 + 32 - player.h - (this.victoryDance % 20 < 5 ? 20 : 0);
      }
      // 每30帧放烟花
      if (this.victoryDance % 30 === 0 && level.castle) {
        spawnFirework(level.castle.x + 48, SCREEN_HEIGHT - 200 - Math.random() * 100);
        spawnFloatingText(level.castle.x + 20, SCREEN_HEIGHT - 300 + Math.random() * 50, "🎉", "#FFD700");
      }
      if (this.victoryDance <= 0) {
        this.state = "win";
        spawnFloatingText((level.castle?.x ?? 6400) + 48, SCREEN_HEIGHT - 250,
          `+${3000 + player.coins * 100}`, "#FFD700");
      }
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
      this.player.w = 20 * PIXEL;
    }
  }
  shrinkPlayer() {
    if (this.player.fireForm) { this.player.fireForm = false; return; }
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

      // 标题卡
      if (this.titleCard > 0) {
        this.titleCard--;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, SCREEN_HEIGHT / 2 - 40, SCREEN_WIDTH, 80);
        ctx.textAlign = "center";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 28px 'Courier New', monospace";
        ctx.fillText("WORLD  1-1", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 5);
        ctx.font = "16px 'Courier New', monospace";
        ctx.fillText(`❤ x${player.lives}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 30);
        this.drawHUD();
        return; // Title card freezes game
      }

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
      if (level.castle) level.castle.draw(ctx, cameraX);
      // Boss
      if (level.boss && level.boss.alive) level.boss.draw(ctx, cameraX, this.animTick);
      if (level.boss && !level.boss.alive && level.boss.y < SCREEN_HEIGHT) level.boss.draw(ctx, cameraX, this.animTick);
      for (const bf of this.bossFires) bf.draw(ctx, cameraX);

      // 火球 星星 道具
      for (const fb of this.fireballs) fb.draw(ctx, cameraX);
      for (const st of this.stars) st.draw(ctx, cameraX);
      for (const p of this.pickupItems) p.draw(ctx, cameraX);
      for (const k of this.koopas) if (k.alive || k.inShell) k.draw(ctx, cameraX, this.animTick);
      for (const m1 of this.oneupMushrooms) m1.draw(ctx, cameraX);
      for (const p of this.piranhas) if (p.alive) p.draw(ctx, cameraX);
      // 粒子
      drawParticles(ctx, cameraX);

      // 玩家
      if (!player.invincible || player.invincibleTimer % 6 < 3) {
        player.draw(ctx, cameraX, this.animTick);
      }

      // HUD
      this.drawHUD();

      // 暂停遮罩
      if (this.paused) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 40px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.fillText("暂 停", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
        ctx.font = "16px 'Courier New', monospace";
        ctx.fillStyle = "#AAA";
        ctx.fillText("按 ESC 继续", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 40);
      }

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
    ctx.fillText(`马力欧`, 12, 20);
    const score = String(this.player.score).padStart(6, "0");
    ctx.fillText(score, 80, 20);
    const coinsTo1UP = 100 - (this.player.coins % 100);
    ctx.fillText(`🪙 x${this.player.coins.toString().padStart(2, "0")}→1UP:${coinsTo1UP}`, SCREEN_WIDTH / 2 - 60, 20);
    if (this.timeLeft <= 100 && this.animTick % 30 < 15) {
      ctx.fillStyle = "#FF0000"; ctx.font = "bold 16px 'Courier New', monospace";
      ctx.textAlign = "right";
      ctx.fillText("HURRY!", SCREEN_WIDTH / 2 + 150, 20);
      ctx.textAlign = "left";
    } else {
      ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 14px 'Courier New', monospace";
    }
    ctx.fillText(`⏱ ${this.timeLeft}`, SCREEN_WIDTH / 2 + 60, 20);
    ctx.fillText(`1-1`, SCREEN_WIDTH / 2 + 156, 20);
    // 状态提示 — 右对齐显示
    ctx.textAlign = "right";
    let statusX = SCREEN_WIDTH - 12;
    if (this.player.starForm) {
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 18px 'Courier New', monospace";
      ctx.fillText(`⭐${Math.ceil(this.player.starTimer / 60)}`, statusX, 20);
      statusX -= 50;
    }
    if (this.player.fireForm) {
      ctx.font = "14px 'Courier New', monospace";
      ctx.fillStyle = "#FFF";
      ctx.fillText("🔥", statusX, 20);
      statusX -= 20;
    }
    ctx.font = "bold 14px 'Courier New', monospace";
    ctx.fillStyle = "#FFF";
    ctx.fillText(`生命: ${this.player.lives}`, statusX, 20);
    if (this.sprinting) { ctx.textAlign = "left"; ctx.fillStyle = "#FF0"; ctx.fillText("💨 冲刺", 100, 52); }
  }

  drawMenu() {
    const { ctx } = this;
    ctx.textAlign = "center";
    ctx.fillStyle = "#E80000";
    ctx.font = "bold 40px 'Courier New', monospace";
    ctx.fillText("超级马力欧", SCREEN_WIDTH / 2 + 1, 201);
    ctx.fillStyle = "#FF8C00";
    ctx.font = "bold 40px 'Courier New', monospace";
    ctx.fillText("超级马力欧", SCREEN_WIDTH / 2, 200);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "20px 'Courier New', monospace";
    ctx.fillText("兄弟", SCREEN_WIDTH / 2, 235);
    ctx.font = "14px 'Courier New', monospace";
    ctx.fillText("© 1985 Nintendo — HTML5 复刻", SCREEN_WIDTH / 2, 280);
    ctx.font = "18px 'Courier New', monospace";
    const blink = Math.sin(this.animTick * 0.1) > 0;
    if (blink) ctx.fillText("按 ENTER 开始游戏", SCREEN_WIDTH / 2, 370);
    ctx.font = "13px sans-serif";
    ctx.fillStyle = "#AAAAAA";
    ctx.fillText("←→ 移动  空格/↑ 跳跃  J 火球", SCREEN_WIDTH / 2, 420);
    ctx.fillText("双击 ←→ 冲刺加速", SCREEN_WIDTH / 2, 443);
    // 画小马里奥
    const mario = new Player(SCREEN_WIDTH / 2 - 16, 310);
    mario.draw(ctx, 0, this.animTick);
  }

  drawGameOver() {
    const { ctx } = this;
    // 暖色渐变背景
    const grad = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
    grad.addColorStop(0, "#1a0533");
    grad.addColorStop(0.6, "#2d1b69");
    grad.addColorStop(1, "#4a2080");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 星星点缀
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    for (let i = 0; i < 30; i++) {
      const sx = (i * 137 + 50) % SCREEN_WIDTH;
      const sy = (i * 89 + 30) % 300;
      ctx.fillRect(sx, sy, 2, 2);
    }

    // 标题框
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(SCREEN_WIDTH / 2 - 180, 140, 360, 100);
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2;
    ctx.strokeRect(SCREEN_WIDTH / 2 - 180, 140, 360, 100);

    ctx.textAlign = "center";
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 36px 'Courier New', monospace";
    ctx.fillText("游 戏 结 束", SCREEN_WIDTH / 2, 200);

    // 信息区
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "20px 'Courier New', monospace";
    ctx.fillText(`得分: ${this.player.score}`, SCREEN_WIDTH / 2, 290);
    ctx.fillText(`🪙 金币: ${this.player.coins}`, SCREEN_WIDTH / 2, 320);

    // 画大马里奥倒下
    const mario = new Player(SCREEN_WIDTH / 2 - 16, 350);
    mario.draw(ctx, 0, this.animTick);

    // 闪烁提示
    ctx.font = "16px 'Courier New', monospace";
    ctx.fillStyle = "#AAAAAA";
    const blink = Math.sin(this.animTick * 0.08) > 0;
    if (blink) ctx.fillText("按 ENTER 重新开始", SCREEN_WIDTH / 2, 460);
  }

  drawWin() {
    const { ctx } = this;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, 100, SCREEN_WIDTH, 220);
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 28px 'Courier New', monospace";
    ctx.fillText("谢谢你 马力欧!", SCREEN_WIDTH / 2, 180);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "18px 'Courier New', monospace";
    ctx.fillText(`最终得分: ${this.player.score}`, SCREEN_WIDTH / 2, 220);
    ctx.fillText(`金币: ${this.player.coins}`, SCREEN_WIDTH / 2, 250);
    const blink = Math.sin(this.animTick * 0.1) > 0;
    if (blink) ctx.fillText("按 ENTER 继续", SCREEN_WIDTH / 2, 300);
  }
}
