/*
 * 超级玛丽 — 游戏配置
 */

export const SCREEN_WIDTH = 800;
export const SCREEN_HEIGHT = 600;
export const FPS = 60;

// 物理参数
export const GRAVITY = 0.8;
export const PLAYER_ACC = 0.5;
export const PLAYER_FRICTION = -0.12;
export const PLAYER_JUMP = -15;
export const MAX_SPEED = 8;

// 颜色
export const COLORS = {
  SKY_BLUE: "#6B8CFF",
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

// 瓦片大小
export const TILE_SIZE = 40;

// 游戏状态
export type GameState = "menu" | "playing" | "gameover" | "win";
