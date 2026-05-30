/*
 * 精灵模块 — 像素点阵 + 帧动画
 * 所有精灵为 16×16 或 16×32 像素，在游戏中以 2.5x / 5x 缩放渲染
 */

import { drawSprite, solidMatrix, overlay, PALETTE } from "./renderer";
import { drawCached } from "./assets";

// ==================== 像素数据 ====================

/** 马里奥 小 16×16 (行走帧) */
export const MARIO_SMALL_1: number[][] = [
  [0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,4,4,4,3,3,4,3,0,0,0,0,0,0,0],
  [0,4,3,4,3,3,3,4,3,3,3,0,0,0,0,0],
  [0,4,3,4,4,3,3,3,4,3,3,3,0,0,0,0],
  [0,4,4,3,3,3,3,4,4,4,4,0,0,0,0,0],
  [0,0,0,3,3,3,3,3,3,3,0,0,0,0,0,0],
  [0,0,2,2,2,0,0,2,2,0,0,0,0,0,0,0],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0],
  [1,1,2,1,1,1,2,2,1,1,2,2,2,0,0,0],
  [1,1,1,2,1,1,1,2,1,1,1,2,2,2,0,0],
  [1,1,1,1,1,1,1,2,1,1,1,1,2,0,0,0],
  [0,0,1,1,1,1,1,2,2,2,2,2,0,0,0,0],
  [0,5,5,0,0,0,4,4,4,0,0,0,0,0,0,0],
  [5,5,5,5,0,4,4,4,4,4,0,0,0,0,0,0],
  [5,5,5,5,0,4,4,4,4,4,0,0,0,0,0,0],
];

/** 马里奥 小 行走帧 2 */
export const MARIO_SMALL_2: number[][] = [
  [0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,4,4,4,3,3,4,3,0,0,0,0,0,0,0],
  [0,4,3,4,3,3,3,4,3,3,3,0,0,0,0,0],
  [0,4,3,4,4,3,3,3,4,3,3,3,0,0,0,0],
  [0,4,4,3,3,3,3,4,4,4,4,0,0,0,0,0],
  [0,0,0,3,3,3,3,3,3,3,0,0,0,0,0,0],
  [0,2,2,2,0,2,2,0,0,2,2,2,0,0,0,0],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0],
  [1,1,2,1,1,1,2,2,1,1,2,2,2,0,0,0],
  [1,1,1,2,1,1,1,2,1,1,1,2,2,2,0,0],
  [1,1,1,1,1,1,1,2,1,1,1,1,2,0,0,0],
  [0,0,0,0,0,1,1,2,2,2,2,2,0,0,0,0],
  [0,4,4,0,0,1,1,4,4,0,0,0,0,0,0,0],
  [0,4,4,4,0,0,4,4,4,0,0,0,0,0,0,0],
  [0,4,4,4,0,0,4,4,4,0,0,0,0,0,0,0],
];

/** 马里奥 站立/跳跃 */
export const MARIO_SMALL_STAND: number[][] = [
  [0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,4,4,4,3,3,4,3,0,0,0,0,0,0,0],
  [0,4,3,4,3,3,3,4,3,3,3,0,0,0,0,0],
  [0,4,3,4,4,3,3,3,4,3,3,3,0,0,0,0],
  [0,4,4,3,3,3,3,4,4,4,4,0,0,0,0,0],
  [0,0,0,3,3,3,3,3,3,3,0,0,0,0,0,0],
  [0,0,2,2,2,2,2,0,0,0,0,0,0,0,0,0],
  [2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0],
  [1,1,2,1,1,1,2,2,1,1,2,2,2,0,0,0],
  [1,1,1,2,1,1,1,2,1,1,1,2,2,2,0,0],
  [1,1,1,1,1,1,1,2,1,1,1,1,2,0,0,0],
  [0,0,0,0,0,0,1,2,2,2,2,2,0,0,0,0],
  [0,4,4,0,0,0,4,4,4,4,0,0,0,0,0,0],
  [0,4,4,4,0,0,0,4,4,4,0,0,0,0,0,0],
  [0,4,4,4,0,0,0,4,4,4,0,0,0,0,0,0],
];

/** 马里奥 大 16×32 */
export const MARIO_BIG: number[][] = [
  [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,0,0,4,4,4,3,3,4,3,0,0,0,0,0],
  [0,0,0,4,3,4,3,3,3,4,3,3,3,0,0,0],
  [0,0,0,4,3,4,4,3,3,3,4,3,3,3,0,0],
  [0,0,0,4,4,3,3,3,3,4,4,4,4,0,0,0],
  [0,0,0,0,0,3,3,3,3,3,3,3,0,0,0,0],
  [0,0,2,2,2,0,2,2,2,2,2,0,0,0,0,0],
  [0,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0],
  [0,1,1,2,1,1,1,2,2,1,1,2,2,2,0,0],
  [0,1,1,1,2,1,1,1,2,1,1,1,2,2,2,0],
  [0,1,1,1,1,1,1,1,2,1,1,1,1,2,0,0],
  [0,0,0,0,1,1,1,1,2,2,2,2,2,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,3,3,3,3,3,3,3,3,3,3,0,0,0],
  [0,0,3,3,3,3,3,3,3,3,3,3,3,3,0,0],
  [0,2,2,2,2,0,0,0,0,2,2,2,2,0,0,0],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0],
  [1,1,2,2,1,1,1,2,2,1,1,1,2,2,0,0],
  [1,1,1,2,1,1,1,2,2,1,1,1,2,2,2,0],
  [1,1,1,2,1,1,1,2,2,1,1,1,2,2,2,0],
  [1,1,1,2,1,1,1,2,2,1,1,1,2,2,2,0],
  [1,1,1,1,1,1,1,2,2,1,1,1,1,2,0,0],
  [1,1,1,1,1,1,1,2,2,1,1,1,1,2,0,0],
  [1,1,1,1,1,1,1,2,2,1,1,1,1,2,0,0],
  [0,0,0,0,0,0,0,2,2,2,2,2,2,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,4,4,0,0,0,0,0,0,4,4,4,0,0,0,0],
  [4,4,4,4,0,0,0,0,4,4,4,4,4,0,0,0],
  [4,4,4,4,0,0,0,0,4,4,4,4,4,0,0,0],
  [4,4,4,4,0,0,0,0,4,4,4,4,4,0,0,0],
  [4,4,4,4,0,0,0,0,4,4,4,4,4,0,0,0],
];

/** 马里奥 跳跃帧 大 */
export const MARIO_BIG_JUMP: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,4,4,4,3,3,4,3,0,0,0,0,0,0],
  [0,0,4,3,4,3,3,3,4,3,3,3,0,0,0,0],
  [0,0,4,3,4,4,3,3,3,4,3,3,3,0,0,0],
  [0,0,4,4,3,3,3,3,4,4,4,4,0,0,0,0],
  [0,0,0,0,3,3,3,3,3,3,3,0,0,0,0,0],
  [0,0,2,2,2,2,2,2,2,2,2,2,2,0,0,0],
  [0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0],
  [0,1,1,2,1,1,1,2,2,1,1,1,2,2,0,0],
  [0,1,1,1,1,1,1,2,2,1,1,1,2,2,2,0],
  [0,0,0,1,1,1,1,2,2,1,1,1,2,2,2,0],
  [0,0,1,1,1,1,1,2,2,1,1,1,2,2,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,3,3,3,3,3,3,3,3,3,3,3,3,0,0],
  [0,3,3,3,3,3,3,3,3,3,3,3,3,3,3,0],
  [3,3,3,0,0,0,0,0,0,0,2,2,2,2,2,0],
  [0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2],
  [0,0,0,0,0,0,0,0,0,1,1,1,2,2,0,0],
  [0,0,0,0,0,0,0,0,0,1,1,1,2,2,2,0],
  [0,0,0,0,0,0,0,0,0,1,1,1,2,2,2,0],
  [0,0,0,0,0,0,0,0,0,1,1,1,2,2,0,0],
  [0,0,0,0,0,0,0,0,0,1,1,1,2,2,0,0],
  [0,0,0,0,0,0,0,0,0,1,1,1,2,2,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,4,4,0,0,0,0,0,0,4,4,4,0,0,0,0],
  [4,4,4,4,0,0,0,0,4,4,4,4,4,0,0,0],
  [4,4,4,4,0,0,0,0,4,4,4,4,4,0,0,0],
  [4,4,4,4,0,0,0,0,4,4,4,4,4,0,0,0],
  [4,4,4,4,0,0,0,0,4,4,4,4,4,0,0,0],
];

/** 砖块 16×16 */
export const BRICK: number[][] = [
  [10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10],
  [10,11,11,11,11,10,10,11,11,11,11,10,10,11,11,10],
  [10,11,11,11,11,10,10,11,11,11,11,10,10,11,11,10],
  [12,10,10,10,10,12,12,10,10,10,10,12,12,10,10,12],
  [12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12],
  [10,10,11,11,10,10,10,10,10,11,11,10,10,10,10,10],
  [10,10,11,11,10,10,10,10,10,11,11,10,10,10,10,10],
  [12,12,10,10,12,12,12,12,12,10,10,12,12,12,12,12],
  [12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12],
  [10,11,11,10,10,10,11,11,10,10,10,11,11,11,10,10],
  [10,11,11,10,10,10,11,11,10,10,10,11,11,11,10,10],
  [12,10,10,12,12,12,10,10,12,12,12,10,10,10,12,12],
  [12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12],
  [10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10],
  [10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10],
  [12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12],
];

/** 地面砖块 16×16 (带草) */
export const GROUND: number[][] = [
  [13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13],
  [14,13,13,14,13,13,14,13,13,14,13,13,14,13,13,14],
  [10,11,11,10,11,10,11,11,10,11,10,11,11,10,11,10],
  [10,11,10,11,10,11,11,10,10,11,10,11,10,11,11,10],
  [10,10,11,10,10,11,10,11,11,10,10,11,10,11,10,11],
  [10,11,10,11,10,11,10,11,10,11,10,11,10,11,10,11],
  [10,10,11,10,11,10,10,11,10,11,10,11,10,11,10,11],
  [10,11,10,11,10,11,10,11,10,11,10,11,10,11,10,11],
  [10,10,11,10,10,11,10,11,11,10,10,11,10,11,10,11],
  [10,11,10,11,10,11,10,11,10,11,10,11,10,11,10,11],
  [10,10,11,10,11,10,10,11,10,11,10,11,10,11,10,11],
  [10,11,10,11,10,11,10,11,10,11,10,11,10,11,10,11],
  [10,10,11,10,10,11,10,11,11,10,10,11,10,11,10,11],
  [10,11,10,11,10,11,10,11,10,11,10,11,10,11,10,11],
  [10,10,11,10,11,10,10,11,10,11,10,11,10,11,10,11],
  [10,11,10,11,10,11,10,11,10,11,10,11,10,11,10,11],
];

/** 问号砖 (亮) 16×16 */
export const QUESTION_LIT: number[][] = [
  [20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20],
  [20,20,20,21,21,21,21,21,21,21,21,21,21,20,20,20],
  [20,20,21,20,20,20,20,20,20,20,20,20,20,21,20,20],
  [20,20,21,20,20,20,6,6,0,0,20,20,20,21,20,20],
  [20,20,21,20,20,6,6,6,6,0,0,20,20,21,20,20],
  [20,20,21,20,6,6,21,6,6,6,0,20,20,21,20,20],
  [20,20,21,20,0,6,6,21,0,0,0,20,20,21,20,20],
  [20,20,21,20,0,0,0,20,20,0,6,20,20,21,20,20],
  [20,20,21,20,20,0,20,20,20,6,6,20,20,21,20,20],
  [20,20,21,20,20,20,20,20,20,0,0,20,20,21,20,20],
  [20,20,21,20,20,20,0,6,20,20,20,20,20,21,20,20],
  [20,20,21,20,20,20,0,6,20,20,20,20,20,21,20,20],
  [20,20,21,20,20,20,0,0,20,20,20,20,20,21,20,20],
  [20,20,21,20,20,20,20,20,20,20,20,20,20,21,20,20],
  [20,20,20,21,21,21,21,21,21,21,21,21,21,20,20,20],
  [20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20],
];

/** 问号砖 (暗) */
export const QUESTION_DARK: number[][] = [
  [21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21],
  [21,21,21,20,20,20,20,20,20,20,20,20,20,21,21,21],
  [21,21,20,21,21,21,21,21,21,21,21,21,21,20,21,21],
  [21,21,20,21,21,21,6,6,0,0,21,21,21,20,21,21],
  [21,21,20,21,21,6,6,6,6,0,0,21,21,20,21,21],
  [21,21,20,21,6,6,20,6,6,6,0,21,21,20,21,21],
  [21,21,20,21,0,6,6,20,0,0,0,21,21,20,21,21],
  [21,21,20,21,0,0,0,21,21,0,6,21,21,20,21,21],
  [21,21,20,21,21,0,21,21,21,6,6,21,21,20,21,21],
  [21,21,20,21,21,21,21,21,21,0,0,21,21,20,21,21],
  [21,21,20,21,21,21,0,6,21,21,21,21,21,20,21,21],
  [21,21,20,21,21,21,0,6,21,21,21,21,21,20,21,21],
  [21,21,20,21,21,21,0,0,21,21,21,21,21,20,21,21],
  [21,21,20,21,21,21,21,21,21,21,21,21,21,20,21,21],
  [21,21,21,20,20,20,20,20,20,20,20,20,20,21,21,21],
  [21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21],
];

/** 金币 16×16 */
export const COIN_1: number[][] = [
  [0,0,0,0,30,30,30,30,30,30,30,30,0,0,0,0],
  [0,0,30,30,30,31,31,31,31,31,30,30,30,30,0,0],
  [0,30,30,31,31,31,30,30,30,30,31,31,30,30,30,0],
  [0,30,31,31,30,30,30,30,30,30,30,31,31,31,30,0],
  [30,30,31,30,30,30,30,30,30,30,30,30,31,30,30,0],
  [30,31,31,30,30,31,30,30,30,30,30,30,31,31,30,0],
  [30,31,30,30,31,31,31,30,30,30,30,30,30,31,30,0],
  [30,31,30,30,30,31,31,30,30,30,30,30,30,31,30,0],
  [30,31,30,30,30,30,30,30,30,30,31,31,30,31,30,0],
  [30,31,31,30,30,30,30,30,30,31,30,30,31,31,30,0],
  [30,30,31,30,30,30,30,30,30,30,30,30,31,30,30,0],
  [0,30,31,31,30,30,30,30,30,30,31,31,31,30,0,0],
  [0,30,30,31,31,31,30,30,30,30,31,31,30,30,30,0],
  [0,0,30,30,30,31,31,31,31,31,30,30,30,30,0,0],
  [0,0,0,0,30,30,30,30,30,30,30,30,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

/** 金币 瘦帧（旋转效果） */
export const COIN_2: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,30,30,30,30,0,0,0,0,0,0],
  [0,0,0,0,30,30,31,31,31,31,30,30,0,0,0,0],
  [0,0,0,30,31,31,30,30,30,30,31,31,30,0,0,0],
  [0,0,30,31,30,30,30,30,30,30,30,31,31,30,0,0],
  [0,0,30,31,30,30,30,30,30,30,30,30,31,30,0,0],
  [0,0,30,31,30,30,30,30,30,30,30,30,31,30,0,0],
  [0,0,30,31,30,30,30,30,30,30,30,30,31,30,0,0],
  [0,0,30,31,30,30,30,30,30,30,30,30,31,30,0,0],
  [0,0,30,31,30,30,30,30,30,30,30,30,31,30,0,0],
  [0,0,30,31,30,30,30,30,30,30,30,31,31,30,0,0],
  [0,0,0,30,31,31,30,30,30,30,31,31,30,0,0,0],
  [0,0,0,0,30,30,31,31,31,31,30,30,0,0,0,0],
  [0,0,0,0,0,0,30,30,30,30,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

/** 栗子仔 16×16 */
export const GOOMBA_1: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,50,50,50,50,50,50,50,50,0,0,0,0],
  [0,0,0,50,50,50,50,50,50,50,50,50,50,0,0,0],
  [0,0,50,50,50,50,50,50,50,50,50,50,50,50,0,0],
  [0,0,50,6,50,50,50,51,50,50,6,50,50,50,0,0],
  [0,0,50,50,52,50,50,51,50,50,52,50,50,50,0,0],
  [0,0,50,50,6,50,50,51,50,50,6,50,50,50,0,0],
  [0,0,50,50,50,50,50,50,50,50,50,50,50,50,0,0],
  [0,50,50,50,50,50,50,50,50,50,50,50,50,50,0,0],
  [50,50,50,50,50,50,50,50,50,50,50,50,50,50,0,0],
  [50,50,50,50,50,50,50,50,50,50,50,50,50,0,0,0],
  [50,50,50,50,50,50,50,50,50,50,50,50,0,0,0,0],
  [50,6,50,6,50,6,50,6,50,6,50,6,0,0,0,0],
  [6,50,6,50,6,50,6,50,6,50,6,50,0,0,0,0],
  [50,6,50,6,50,6,50,6,50,6,50,6,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

/** 栗子仔 帧2 */
export const GOOMBA_2: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,50,50,50,50,50,50,50,50,0,0,0,0],
  [0,0,0,50,50,50,50,50,50,50,50,50,50,0,0,0],
  [0,0,50,50,50,50,50,50,50,50,50,50,50,50,0,0],
  [0,0,50,6,50,50,50,51,50,50,6,50,50,50,0,0],
  [0,0,50,50,52,50,50,51,50,50,52,50,50,50,0,0],
  [0,0,50,50,6,50,50,51,50,50,6,50,50,50,0,0],
  [0,0,50,50,50,50,50,50,50,50,50,50,50,50,0,0],
  [0,50,50,50,50,50,50,50,50,50,50,50,50,50,0,0],
  [50,50,50,50,50,50,50,50,50,50,50,50,50,50,0,0],
  [50,50,50,50,50,50,50,50,50,50,50,50,50,0,0,0],
  [50,50,50,50,50,50,50,50,50,50,50,50,0,0,0,0],
  [0,50,6,50,6,50,6,50,6,50,6,0,0,0,0,0],
  [0,6,50,6,50,6,50,6,50,6,50,0,0,0,0,0],
  [0,50,6,50,6,50,6,50,6,50,6,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

/** 蘑菇 16×16 */
export const MUSHROOM: number[][] = [
  [0,0,0,0,40,40,40,40,40,40,40,40,0,0,0,0],
  [0,0,40,40,40,41,41,41,41,41,40,40,40,0,0],
  [0,40,40,41,40,41,41,40,41,41,40,41,40,40,0],
  [0,40,41,41,41,40,40,41,41,40,40,41,41,40,0],
  [0,40,40,41,40,41,40,41,40,41,40,41,40,40,0],
  [0,40,41,41,41,41,42,41,41,42,41,41,41,40,0],
  [0,40,40,41,41,41,40,40,40,40,41,41,41,40,0],
  [0,0,40,40,40,40,40,40,40,40,40,40,40,0,0],
  [0,0,0,43,43,43,43,43,43,43,43,43,0,0,0],
  [0,0,0,43,43,43,43,43,43,43,43,43,0,0,0],
  [0,0,0,43,43,43,43,43,43,43,43,43,0,0,0],
  [0,0,0,43,43,43,43,43,43,43,43,43,0,0,0],
  [0,0,0,43,43,43,43,43,43,43,43,43,0,0,0],
  [0,0,0,43,43,43,43,43,43,43,43,43,0,0,0],
  [0,0,0,0,0,43,43,43,43,43,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

/** 旗杆顶球 8×8 */
export const POLE_BALL: number[][] = [
  [0,0,70,70,70,70,0,0],
  [0,70,71,71,71,71,70,0],
  [70,71,71,70,70,71,71,70],
  [70,71,70,71,71,70,71,70],
  [70,71,70,71,71,70,71,70],
  [70,71,71,70,70,71,71,70],
  [0,70,71,71,71,71,70,0],
  [0,0,70,70,70,70,0,0],
];

/** 火焰花 16x16 */
export const FIREFLOWER: number[][] = [
  [0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0],
  [0,0,0,1,1,1,1,0,0,0,1,1,1,1,0,0],
  [0,0,1,1,2,2,1,1,1,1,1,2,2,1,1,0],
  [0,1,1,2,2,3,2,1,1,2,2,3,2,2,1,1],
  [0,1,2,2,3,3,3,2,2,2,3,3,3,2,1,0],
  [1,1,2,3,3,3,3,3,3,3,3,3,3,2,1,1],
  [1,1,1,2,3,3,3,4,4,3,3,3,2,1,1,0],
  [1,1,1,1,2,3,4,4,4,4,3,2,1,1,1,0],
  [0,1,1,1,1,2,4,4,4,4,2,1,1,1,0,0],
  [0,0,1,1,1,1,2,2,2,2,1,1,1,1,0,0],
  [0,0,0,0,5,5,5,5,5,5,5,5,0,0,0,0],
  [0,0,0,5,5,5,5,5,5,5,5,5,5,0,0,0],
  [0,0,5,5,5,5,5,5,5,5,5,5,5,5,0,0],
  [0,5,5,5,5,5,5,5,5,5,5,5,5,5,5,0],
  [0,5,5,5,0,0,5,5,5,5,0,0,5,5,5,0],
  [0,0,5,0,0,0,0,5,5,0,0,0,0,5,0,0],
];
// 颜色：1=橙红 2=黄色 3=亮橙 4=白色 5=绿色

/** 星星 16x16 */
export const STAR: number[][] = [
  [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [0,0,0,1,1,1,2,2,2,2,1,1,1,0,0,0],
  [0,0,0,0,1,2,2,2,2,2,2,1,0,0,0,0],
  [0,0,1,1,1,2,2,2,2,2,2,1,1,1,0,0],
  [0,0,1,1,0,1,2,2,2,2,1,0,1,1,0,0],
  [0,0,1,0,0,0,1,1,1,1,0,0,0,1,0,0],
  [0,1,0,0,0,1,0,0,0,0,1,0,0,0,1,0],
  [1,0,0,0,1,0,0,0,0,0,0,1,0,0,0,1],
  [0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0],
  [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
];
// 1=金色 2=暗金色(眼睛)

/** 火球 8x8 */
export const FIREBALL: number[][] = [
  [0,1,1,1,1,0,0,0],
  [1,2,2,2,2,1,0,0],
  [1,2,3,3,2,2,1,0],
  [1,2,3,3,3,2,1,0],
  [0,1,2,3,3,2,1,0],
  [0,0,1,2,2,2,1,0],
  [0,0,0,1,1,1,0,0],
  [0,0,0,0,0,0,0,0],
];
// 1=红 2=橙 3=黄

import { COLORS, TILE, GRAVITY } from "./settings";

// 缓存引用（由 game.ts 在初始化时设置）
import type { Cache } from "./assets";
let _cache: Cache | null = null;
export function setSpriteCache(c: Cache | null) { _cache = c; }

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
  animFrame: number = 0;
  animTimer: number = 0;
  /** 用于旗杆滑下动画 */
  flagSliding: boolean = false;
  /** 二段跳计数 */
  jumpCount: number = 0;
  /** 火焰形态 */
  fireForm: boolean = false;
  /** 无敌星形态 */
  starForm: boolean = false;
  starTimer: number = 0;
  /** 火球冷却 */
  shootCooldown: number = 0;

  constructor(x: number, y: number) {
    super(x, y, 32, 32);
  }

  updateAnim(speed: number) {
    this.animTimer++;
    const rate = Math.max(2, Math.floor(12 / Math.max(1, Math.abs(speed))));
    if (this.animTimer >= rate) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number, _tick?: number) {
    const sx = this.x - cameraX;
    const sy = this.y;
    const c = _cache;
    if (c) {
      if (this.big) {
        const img = this.onGround && Math.abs(this.vx) > 0.5
          ? (this.animFrame % 2 === 0 ? c.mb0 : c.mb1) : c.mb0;
        // 大马里奥：宽度拉伸 1.5x，高度 2x，比例更协调
        const bw = img.width * 1.2;
        const bh = img.height;
        if (this.facingRight) {
          ctx.drawImage(img, sx, sy, bw, bh);
        } else {
          ctx.save();
          ctx.translate(sx + bw, sy);
          ctx.scale(-1, 1);
          ctx.drawImage(img, 0, 0, bw, bh);
          ctx.restore();
        }
      } else {
        let img = c.ms0;
        if (this.onGround && Math.abs(this.vx) > 0.5) {
          img = this.animFrame % 2 === 0 ? c.ms1 : c.ms2;
        } else if (!this.onGround) {
          img = c.ms1;
        }
        drawCached(ctx, img, sx, sy, !this.facingRight);
      }
    } else {
      if (this.big) {
        const data = this.onGround && Math.abs(this.vx) > 0.5
          ? (this.animFrame % 2 === 0 ? MARIO_BIG : MARIO_BIG_JUMP) : MARIO_BIG;
        // 大马里奥宽度拉伸 1.2x，比例更像正版
        const cols = data[0].length;
        const rows = data.length;
        const pw = 2.4; // 每像素宽度
        const ph = 2;   // 每像素高度
        if (this.facingRight) {
          for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++)
              if (data[r][c] !== 0) {
                ctx.fillStyle = (PALETTE as any)[data[r][c]] || "#000";
                ctx.fillRect(sx + c * pw, sy + r * ph, pw, ph);
              }
        } else {
          for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++)
              if (data[r][c] !== 0) {
                ctx.fillStyle = (PALETTE as any)[data[r][c]] || "#000";
                ctx.fillRect(sx + (cols - 1 - c) * pw, sy + r * ph, pw, ph);
              }
        }
      } else {
        const PS = 2;
        let data = MARIO_SMALL_STAND;
        if (this.onGround && Math.abs(this.vx) > 0.5) {
          data = this.animFrame % 2 === 0 ? MARIO_SMALL_1 : MARIO_SMALL_2;
        } else if (!this.onGround) { data = MARIO_SMALL_1; }
        drawSprite(ctx, data, sx, sy, PS, !this.facingRight);
      }
    }
  }
}

// ==================== 平台砖块 ====================

export class Platform extends Sprite {
  kind: "ground" | "brick" | "stair";
  alive: boolean = true;

  constructor(x: number, y: number, w: number, h: number, kind: "ground" | "brick" | "stair" = "brick") {
    super(x, y, w, h);
    this.kind = kind;
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number) {
    const sx = this.x - cameraX;
    const c = _cache;
    if (c) {
      const img = this.kind === "ground" ? c.ground : c.brick;
      const tw = this.kind === "ground" ? 40 : 40; // 16 * 2.5 = 40
      const count = Math.ceil(this.w / tw);
      for (let i = 0; i < count; i++) ctx.drawImage(img, sx + i * tw, this.y);
    } else {
      const PS = 2.5;
      const data = this.kind === "ground" ? GROUND : BRICK;
      const count = Math.ceil(this.w / (16 * PS));
      for (let i = 0; i < count; i++) drawSprite(ctx, data, sx + i * 16 * PS, this.y, PS);
    }
  }
}

// ==================== 问号砖 ====================

export class QuestionBlock extends Sprite {
  used: boolean = false;
  animTimer: number = 0;
  lit: boolean = true;
  coin: boolean = Math.random() < 0.5;

  constructor(x: number, y: number) {
    super(x, y, TILE, TILE);
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number, _tick?: number) {
    const sx = this.x - cameraX;
    if (this.used) {
      ctx.fillStyle = "#646464";
      ctx.fillRect(sx, this.y, TILE, TILE);
      ctx.strokeStyle = "#4a4a4a";
      ctx.strokeRect(sx, this.y, TILE, TILE);
    } else if (_cache) {
      drawCached(ctx, this.lit ? _cache.qLit : _cache.qDark, sx, this.y);
    } else {
      drawSprite(ctx, this.lit ? QUESTION_LIT : QUESTION_DARK, sx, this.y, 2.5);
    }
  }

  updateAnim() {
    if (this.used) return;
    this.animTimer++;
    if (this.animTimer >= 30) { this.animTimer = 0; this.lit = !this.lit; }
  }
}

// ==================== 金币 ====================

export class Coin extends Sprite {
  collected: boolean = false;
  animFrame: number = 0;
  animTimer: number = 0;

  constructor(x: number, y: number) {
    super(x, y, 20, 20);
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number, _tick?: number) {
    if (this.collected) return;
    const sx = this.x - cameraX;
    if (_cache) {
      drawCached(ctx, this.animFrame < 4 ? _cache.c1 : _cache.c2, sx, this.y);
    } else {
      drawSprite(ctx, this.animFrame < 4 ? COIN_1 : COIN_2, sx, this.y, 1.25);
    }
  }

  updateAnim() {
    this.animTimer++;
    if (this.animTimer >= 8) { this.animTimer = 0; this.animFrame = (this.animFrame + 1) % 8; }
  }
}

// ==================== 蘑菇 ====================

export class Mushroom extends Sprite {
  collected: boolean = false;

  constructor(x: number, y: number) {
    super(x, y, 30, 30);
    this.vx = 1.5;
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number) {
    if (this.collected) return;
    const sx = this.x - cameraX;
    if (_cache) {
      drawCached(ctx, _cache.mush, sx, this.y);
    } else {
      drawSprite(ctx, MUSHROOM, sx, this.y, 1.875);
    }
  }
}

// ==================== 栗子仔 ====================

// ==================== 火焰花 ====================

export class FireFlower extends Sprite {
  collected: boolean = false;
  constructor(x: number, y: number) { super(x, y, 30, 30); }
  draw(ctx: CanvasRenderingContext2D, cameraX: number) {
    if (this.collected) return;
    const sx = this.x - cameraX;
    drawSprite(ctx, FIREFLOWER, sx, this.y, 1.875);
  }
}

// ==================== 无敌星 ====================

export class Star extends Sprite {
  collected: boolean = false;
  bounced: boolean = false;
  constructor(x: number, y: number) { super(x, y, 30, 30); this.vx = 2; this.vy = -6; }
  draw(ctx: CanvasRenderingContext2D, cameraX: number) {
    if (this.collected) return;
    const sx = this.x - cameraX;
    drawSprite(ctx, STAR, sx, this.y, 1.875);
  }
}

// ==================== 火球 ====================

export class Fireball extends Sprite {
  alive: boolean = true;
  constructor(x: number, y: number, dir: number) {
    super(x, y, 14, 14);
    this.vx = dir * 6;
    this.vy = -2;
  }
  draw(ctx: CanvasRenderingContext2D, cameraX: number) {
    if (!this.alive) return;
    const sx = this.x - cameraX;
    ctx.fillStyle = "#FF4400";
    ctx.beginPath(); ctx.arc(sx + 7, this.y + 7, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#FFAA00";
    ctx.beginPath(); ctx.arc(sx + 5, this.y + 5, 3, 0, Math.PI * 2); ctx.fill();
  }
}

// ==================== 栗子仔

export class Goomba extends Sprite {
  alive: boolean = true;
  animFrame: number = 0;
  animTimer: number = 0;
  onGround: boolean = false;
  squishTimer: number = 0;
  /** 巡逻边界 */
  patrolLeft: number = 0;
  patrolRight: number = 99999;

  constructor(x: number, y: number, left?: number, right?: number) {
    super(x, y, 30, 30);
    this.vx = -1;
    if (left !== undefined) this.patrolLeft = left;
    if (right !== undefined) this.patrolRight = right;
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number, _tick?: number) {
    if (!this.alive) {
      if (this.squishTimer > 0) {
        const sx = this.x - cameraX;
        ctx.fillStyle = "#A82800";
        ctx.fillRect(sx + 2, this.y + 20, 26, 10);
      }
      return;
    }
    const sx = this.x - cameraX;
    if (_cache) {
      drawCached(ctx, this.animFrame % 2 === 0 ? _cache.g1 : _cache.g2, sx, this.y);
    } else {
      drawSprite(ctx, this.animFrame % 2 === 0 ? GOOMBA_1 : GOOMBA_2, sx, this.y, 1.875);
    }
  }

  updateAnim() {
    if (!this.alive) return;
    this.animTimer++;
    if (this.animTimer >= 15) { this.animTimer = 0; this.animFrame = (this.animFrame + 1) % 2; }
  }
}

// ==================== 旗帜 ====================

export class Flag extends Sprite {
  constructor(x: number, y: number) {
    super(x, y, 24, 200);
    // 向左偏移让实际旗杆在视觉中央
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number, _tick?: number) {
    const sx = this.x - cameraX;
    ctx.fillStyle = "#808080";
    ctx.fillRect(sx + 4, this.y, 2, this.h);
    // 顶球
    if (_cache) {
      drawCached(ctx, _cache.ball, sx - 3, this.y - 8);
    } else {
      drawSprite(ctx, POLE_BALL, sx - 3, this.y - 8, 2);
    }
    // 旗帜
    ctx.fillStyle = COLORS.GREEN;
    ctx.beginPath();
    ctx.moveTo(sx + 6, this.y + 5);
    ctx.lineTo(sx + 28, this.y + 18);
    ctx.lineTo(sx + 6, this.y + 31);
    ctx.closePath();
    ctx.fill();
  }
}

// ==================== 水管 ====================

export class Pipe extends Sprite {
  constructor(x: number, y: number, h: number) {
    super(x, y, 48, h);
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number) {
    const sx = this.x - cameraX;
    const PS = 3;
    // 水管身体
    const bodyH = this.h - 16;
    ctx.fillStyle = "#00A800";
    ctx.fillRect(sx, this.y + 16, 48, bodyH);
    // 暗边
    ctx.fillStyle = "#007800";
    ctx.fillRect(sx, this.y + 16, 8, bodyH);
    // 亮边
    ctx.fillStyle = "#00CC00";
    ctx.fillRect(sx + 36, this.y + 16, 12, bodyH);
    // 顶部
    ctx.fillStyle = "#00A800";
    ctx.fillRect(sx - 4, this.y, 56, 16);
    ctx.fillStyle = "#00CC00";
    ctx.fillRect(sx - 4, this.y, 56, 4);
    ctx.fillStyle = "#008000";
    ctx.fillRect(sx - 4, this.y + 12, 56, 4);
    // 高光
    ctx.fillStyle = "#66FF66";
    ctx.fillRect(sx + 30, this.y + 2, 18, 2);
  }
}

// ==================== 城堡 ====================

export class Castle {
  x: number; y: number;
  constructor(x: number, y: number) { this.x = x; this.y = y; }
  draw(ctx: CanvasRenderingContext2D, cameraX: number) {
    const sx = this.x - cameraX;
    const w = 96, h = 144;
    // 主体灰色
    ctx.fillStyle = "#888888";
    ctx.fillRect(sx, this.y + 32, w, h);
    // 垛口
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(sx + i * 32, this.y, 32, 40);
    }
    // 红色门
    ctx.fillStyle = "#880000";
    ctx.fillRect(sx + 32, this.y + h - 32, 32, 32);
    // 门框
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 3;
    ctx.strokeRect(sx + 30, this.y + h - 32, 36, 34);
    // 窗户
    ctx.fillStyle = "#444";
    ctx.fillRect(sx + 10, this.y + 60, 16, 16);
    ctx.fillRect(sx + 70, this.y + 60, 16, 16);
    // 高光
    ctx.fillStyle = "#AAAAAA";
    ctx.fillRect(sx + 2, this.y + 4, 8, 20);
    ctx.fillRect(sx + 34, this.y + 4, 8, 20);
    ctx.fillRect(sx + 66, this.y + 4, 8, 20);
  }
}

// ==================== 云朵（装饰） ====================

export class Cloud {
  x: number;
  y: number;
  speed: number;

  constructor(x: number, y: number, speed: number) {
    this.x = x;
    this.y = y;
    this.speed = speed;
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number) {
    const sx = this.x - cameraX * this.speed;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    // 简化云朵形状
    ctx.beginPath();
    ctx.ellipse(sx, this.y, 40, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(sx + 30, this.y - 8, 30, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(sx - 25, this.y + 2, 25, 15, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 小山 */
export function drawHill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, camX: number, speed: number) {
  const sx = x - camX * speed;
  ctx.fillStyle = "#78A878";
  ctx.beginPath();
  ctx.moveTo(sx - w / 2, y);
  ctx.quadraticCurveTo(sx, y - h, sx + w / 2, y);
  ctx.closePath();
  ctx.fill();
}

/** 灌木丛 */
export function drawBush(ctx: CanvasRenderingContext2D, x: number, y: number, camX: number, speed: number) {
  const sx = x - camX * speed;
  ctx.fillStyle = "#88C888";
  ctx.beginPath();
  ctx.ellipse(sx, y, 28, 16, 0, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(sx + 20, y, 24, 14, 0, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(sx - 18, y, 20, 12, 0, Math.PI, 0);
  ctx.fill();
}
