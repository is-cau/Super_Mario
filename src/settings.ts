/*
 * 超级玛丽 — 游戏配置
 */

export const SCREEN_WIDTH = 800;
export const SCREEN_HEIGHT = 600;
export const FPS = 60;

// 像素缩放（基础 16×16 精灵）
export const PIXEL = 2; // 每个像素点 2px，所以 16x16 精灵实际 32x32

// 物理参数
export const GRAVITY = 0.65;
export const PLAYER_ACC = 0.45;
export const PLAYER_FRICTION = -0.12;
export const PLAYER_JUMP = -12;
export const MAX_SPEED = 6;

// 颜色（保留向后兼容）
export const COLORS = {
  SKY_BLUE: "#5C94FC",
  GROUND: "#C84C0C",
  GRASS: "#88CC00",
  RED: "#FF0000",
  BLUE: "#0000FF",
  YELLOW: "#FFFF00",
  BROWN: "#8B4513",
  ORANGE: "#FFA500",
  GOLD: "#FFD700",
  GREEN: "#00FF00",
  WHITE: "#FFFFFF",
  BLACK: "#000000",
};

// 瓦片大小（像素系统：16 * PIXEL）
export const TILE = 16 * PIXEL; // = 32

// 游戏状态
export type GameState = "menu" | "playing" | "gameover" | "win";

// 音效开关
export const SFX_ENABLED = true;
// 音效类型
export type SfxType = "jump" | "coin" | "mushroom" | "stomp" | "hurt" | "win" | "powerup" | "gameover";
