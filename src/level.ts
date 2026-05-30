/*
 * 关卡设计 — 仿 SMB 1-1
 * 200 列 × 17 行，每格 32px（TILE = 16×2）
 */

import { TILE } from "./settings";
import {
  Platform, QuestionBlock, Coin, Goomba, Koopa, Flag, Pipe, Castle, Bowser,
} from "./sprites";

/*
  行布局（每行高 32px）：
    0-5:  天空区
    6-7:  上层平台
    8-10: 中层
    11-12: 地面层
    13:   地面（4格高地面）
    14:   地面
    15:   地面
    16:   地面
  共 17 行 = 544px 高

  地面在 row 13-16（即 y=13*32=416 到 y=16*32=512，底部在 544）
  屏幕 600px，底部 56px 留空
  实际底部 = 544，屏幕 600，底部空白 56
*/

const ROWS = 17;
const COLS = 210;
export const GROUND_ROW = 13;

// G=地面 B=砖 ?=问号 C=金币 E=敌人 F=旗帜 P=水管上左 Q=水管上右 p=水管体左 q=水管体右 S=阶梯
// 阶梯用 S 表示单个阶梯块，需要手动排列

const levelMap: string[] = [];

function set(row: number, col: number, ch: string) {
  while (levelMap.length <= row) levelMap.push("".padEnd(COLS, "-"));
  const line = levelMap[row];
  levelMap[row] = line.substring(0, col) + ch + line.substring(col + 1);
}

// 地面 (row 13-16)
for (let c = 0; c < COLS; c++) {
  for (let r = GROUND_ROW; r < ROWS; r++) {
    set(r, c, "G");
  }
}

// 地面断层 1: 列 58-60（地面级跳台，加金币）
set(GROUND_ROW - 1, 58, "B"); set(GROUND_ROW - 1, 59, "B"); set(GROUND_ROW - 1, 60, "B");
set(9, 59, "C");
for (let c = 58; c <= 60; c++) {
  for (let r = GROUND_ROW; r < ROWS; r++) set(r, c, "-");
}
// 地面断层 2: 列 148-150（地面级跳台，加金币）
set(GROUND_ROW - 1, 148, "B"); set(GROUND_ROW - 1, 149, "B"); set(GROUND_ROW - 1, 150, "B");
set(9, 149, "C");
for (let c = 148; c <= 150; c++) {
  for (let r = GROUND_ROW; r < ROWS; r++) set(r, c, "-");
}

// === 更多金币散布 ===
const extraCoins: [number, number][] = [
  [9, 19], [9, 23], [8, 31], [6, 41], [9, 53],
  [8, 65], [7, 77], [9, 86], [7, 94], [9, 105],
  [7, 113], [8, 124], [6, 132], [9, 142],
  [8, 156], [7, 164], [9, 172], [6, 184],
];
for (const [r, c] of extraCoins) set(r, c, "C");

// === 砖块和问号区域 ===

// 区域1: 列 16 问号
set(9, 16, "?");
set(9, 20, "B"); set(9, 21, "?"); set(9, 22, "B"); set(9, 23, "?"); set(9, 24, "B");

// 区域2: 列 30-34 一排砖块 + 问号
set(8, 30, "B"); set(8, 31, "B"); set(8, 32, "?"); set(8, 33, "B"); set(8, 34, "B");

// 区域3: 列 40-44 高空砖块
set(5, 42, "?"); set(5, 43, "?"); set(5, 44, "?");

// 区域4: 列 50-55 大段砖块
set(8, 50, "B"); set(8, 51, "?"); set(8, 52, "B"); set(8, 53, "?"); set(8, 54, "B"); set(8, 55, "B");

// 区域5: 列 63-68 跨断层后的平台
set(8, 63, "B"); set(8, 64, "?"); set(8, 65, "B");
// 列 66-67 中层
set(9, 66, "B"); set(9, 67, "B"); set(9, 68, "?"); set(9, 69, "B");

// 区域6: 列 80-85
set(7, 80, "?"); set(7, 81, "B"); set(7, 82, "?"); set(7, 83, "B"); set(7, 84, "B");
set(8, 85, "?");

// 区域7: 列 95-105 复杂区域（上层 + 中层）
set(6, 95, "B"); set(6, 96, "B"); set(6, 97, "B");
set(9, 97, "?"); set(9, 98, "?"); set(9, 99, "?");
set(8, 101, "B"); set(8, 102, "?"); set(8, 103, "B"); set(8, 104, "B");

// 区域8: 列 120-130
set(8, 120, "B"); set(8, 121, "B"); set(8, 122, "?"); set(8, 123, "B");
set(6, 125, "?"); set(6, 126, "?"); set(6, 127, "B");

// 区域9: 列 135-145
set(7, 135, "?"); set(7, 136, "B"); set(7, 137, "?"); set(7, 138, "B");
set(9, 140, "B"); set(9, 141, "?"); set(9, 142, "B"); set(9, 143, "?"); set(9, 144, "B");

// 区域10: 列 155-170（断层后）
set(5, 155, "B"); set(5, 156, "?"); set(5, 157, "?");
set(8, 158, "B"); set(8, 159, "B"); set(8, 160, "?");
set(6, 165, "B"); set(6, 166, "B"); set(6, 167, "?"); set(6, 168, "B");

// 区域11: 列 180-190（终点前）
set(8, 180, "?"); set(8, 181, "B"); set(8, 182, "?"); set(8, 183, "B");
set(5, 185, "B"); set(5, 186, "?"); set(5, 187, "?");
// 区域12: 列 13-15 起始导引砖
set(9, 13, "?"); set(9, 14, "B");
// 区域13: 砖柱 (列 38-39, 行 8-10)
set(8, 38, "B"); set(9, 38, "B"); set(8, 39, "B"); set(9, 39, "B");
// 区域14: 列 88-90 中层平台
set(7, 88, "B"); set(7, 89, "?"); set(7, 90, "B");
// 区域15: 列 115 高空奖励
set(4, 115, "?"); set(4, 116, "?"); set(4, 117, "?");
// 区域16: 列 145 砖桥（跨断层）
set(9, 145, "B"); set(9, 146, "B"); set(9, 147, "B");

// === 金币 ===
const coinPositions: [number, number][] = [
  [9, 16], [9, 21], [9, 23],
  [8, 32],
  [5, 42], [5, 43], [5, 44],
  [8, 51], [8, 53],
  [8, 64], [9, 68],
  [7, 80], [7, 82],
  [9, 97], [9, 98], [9, 99], [8, 102],
  [8, 122], [6, 125], [6, 126],
  [7, 135], [7, 137], [9, 141], [9, 143],
  [5, 156], [5, 157], [8, 160],
  [6, 167],
  [8, 180], [8, 182], [5, 186], [5, 187],
];
for (const [r, c] of coinPositions) set(r, c, "C");

// === 敌人 ===
// 敌人位置：避免靠近砖块结构（留至少5格间距）
const enemyPositions: [number, number][] = [
  [GROUND_ROW - 1, 14],
  [GROUND_ROW - 1, 28],
  [GROUND_ROW - 1, 38],
  [GROUND_ROW - 1, 48],
  [GROUND_ROW - 1, 55],
  [GROUND_ROW - 1, 70],
  [GROUND_ROW - 1, 78],
  [GROUND_ROW - 1, 90],
  [GROUND_ROW - 1, 100],
  [GROUND_ROW - 1, 108],
  [GROUND_ROW - 1, 115],
  [GROUND_ROW - 1, 130],
  [GROUND_ROW - 1, 140],
  [GROUND_ROW - 1, 162],
  [GROUND_ROW - 1, 172],
  [GROUND_ROW - 1, 178],
  [GROUND_ROW - 1, 195],
];
for (const [r, c] of enemyPositions) set(r, c, "E");

// === 水管 ===
// 水管1: 列 25-26, 高3格（体2 + 顶1）
set(GROUND_ROW - 1, 25, "P"); set(GROUND_ROW - 1, 26, "Q");
set(GROUND_ROW, 25, "p");     set(GROUND_ROW, 26, "q");
// 水管2: 列 45-46, 高2格
set(GROUND_ROW - 1, 45, "P"); set(GROUND_ROW - 1, 46, "Q");
// 水管3: 列 88-89, 高3格
set(GROUND_ROW - 1, 88, "P"); set(GROUND_ROW - 1, 89, "Q");
set(GROUND_ROW, 88, "p");     set(GROUND_ROW, 89, "q");
// 水管4: 列 110-111, 高1格
set(GROUND_ROW - 1, 110, "P"); set(GROUND_ROW - 1, 111, "Q");
// 水管5: 列 175-176, 高3格
set(GROUND_ROW - 1, 175, "P"); set(GROUND_ROW - 1, 176, "Q");
set(GROUND_ROW, 175, "p");     set(GROUND_ROW, 176, "q");

// === 阶梯 ===
// 阶梯1: 列 54-57（4级）
set(GROUND_ROW - 1, 54, "S"); set(GROUND_ROW - 2, 55, "S"); set(GROUND_ROW - 3, 56, "S"); set(GROUND_ROW - 4, 57, "S");
// 阶梯2: 列 72-75（4级）
set(GROUND_ROW - 1, 72, "S"); set(GROUND_ROW - 2, 73, "S"); set(GROUND_ROW - 3, 74, "S"); set(GROUND_ROW - 4, 75, "S");
// 阶梯3: 列 115-118（下降）
set(GROUND_ROW - 4, 115, "S"); set(GROUND_ROW - 3, 116, "S"); set(GROUND_ROW - 2, 117, "S"); set(GROUND_ROW - 1, 118, "S");
// 阶梯4: 列 152-154（小阶梯，断层后）
set(GROUND_ROW - 1, 152, "S"); set(GROUND_ROW - 2, 153, "S"); set(GROUND_ROW - 3, 154, "S");

// === 终点旗帜 ===
// 隐藏砖块（碰到才出现，含1UP/金币）
set(9, 15, "H"); set(8, 37, "H"); set(10, 61, "H");
set(7, 83, "H"); set(9, 119, "H"); set(8, 141, "H");

// 乌龟兵 (散布)
set(GROUND_ROW - 1, 42, "T");
set(GROUND_ROW - 1, 92, "T");
set(GROUND_ROW - 1, 145, "T");

// 大乌龟 Bowser Boss (col 194)
set(GROUND_ROW - 1, 194, "K");

// 城堡即终点 (col 199-200，碰到城堡通关)
set(GROUND_ROW - 4, 199, "c"); set(GROUND_ROW - 4, 200, "c");
set(GROUND_ROW - 3, 199, "c"); set(GROUND_ROW - 3, 200, "c");
set(GROUND_ROW - 2, 199, "c"); set(GROUND_ROW - 2, 200, "c");
set(GROUND_ROW - 1, 199, "c"); set(GROUND_ROW - 1, 200, "c");
for (let c = 199; c < 203; c++) {
  for (let r = GROUND_ROW; r < ROWS; r++) set(r, c, "G");
}

// 确保每行都有足够长度
for (let r = 0; r < ROWS; r++) {
  while (levelMap.length <= r) levelMap.push("".padEnd(COLS, "-"));
}

// ========================

export interface LevelData {
  platforms: (Platform | Pipe)[];
  questionBlocks: QuestionBlock[];
  coins: Coin[];
  enemies: Goomba[];
  flag: Flag | null;
  bricks: Platform[];
  castle: Castle | null;
  boss: Bowser | null;
  koopas: Koopa[];
  width: number;
}

export function buildLevel(): LevelData {
  const platforms: (Platform | Pipe)[] = [];
  const questionBlocks: QuestionBlock[] = [];
  const coins: Coin[] = [];
  const enemies: Goomba[] = [];
  const bricks: Platform[] = [];
  let flag: Flag | null = null;
  let castle: Castle | null = null;
  let boss: Bowser | null = null;
  const koopas: Koopa[] = [];
  let castleX = 0, castleY = 0;

  for (let row = 0; row < levelMap.length; row++) {
    for (let col = 0; col < levelMap[row].length; col++) {
      const x = col * TILE;
      const y = row * TILE;
      const ch = levelMap[row][col];

      switch (ch) {
        case "G":
          platforms.push(new Platform(x, y, TILE, TILE));
          break;
        case "B":
          const b = new Platform(x, y, TILE, TILE);
          b.kind = "brick";
          bricks.push(b);
          platforms.push(b);
          break;
        case "?":
        case "H": {
          const qb = new QuestionBlock(x, y);
          if (ch === "H") qb.hidden = true; // 隐藏砖不可见
          questionBlocks.push(qb);
          platforms.push(new Platform(x, y, TILE, TILE));
          break;
        }
        case "C":
          coins.push(new Coin(x + 6, y + 6));
          break;
        case "E":
          enemies.push(new Goomba(x, y));
          break;
        case "K":
          boss = new Bowser(x, y - 24);
          break;
        case "T":
          koopas.push(new Koopa(x, y));
          break;
        case "c":
          if (castleX === 0) {
            castleX = x;
            castleY = (GROUND_ROW * TILE) - 176; // 城堡底对齐地面
          }
          break;
        case "F":
          flag = new Flag(x, y);
          break;
        case "S":
          const s = new Platform(x, y, TILE, TILE);
          s.kind = "stair";
          platforms.push(s);
          break;
        case "P":
        case "Q":
        case "p":
        case "q":
          platforms.push(new Pipe(x, y, TILE));
          break;
      }
    }
  }

  // 构建城堡
  if (castleX > 0) castle = new Castle(castleX, castleY);

  return { platforms, questionBlocks, coins, enemies, flag, bricks, castle, boss, koopas, width: COLS * TILE };
}
