/*
 * 关卡设计 — 瓦片地图生成
 */

import { TILE_SIZE } from "./settings";
import {
  Platform,
  QuestionBlock,
  Coin,
  Goomba,
  Flag,
} from "./sprites";

// 20列 x 15行
// G=地面 B=砖块 ?=问号砖 -=空 C=金币 E=敌人 F=旗帜
const LEVEL_1 = [
  "--------------------",
  "--------------------",
  "--------------------",
  "--------------------",
  "--------------------",
  "--------------------",
  "--------------------",
  "------?---?---?----",
  "--------BB---------",
  "----?----------?---",
  "--------------------",
  "-----BBB-----BBB---",
  "---E-------------E-",
  "-CC--CC----------F-",
  "GGGGGGGGGGGGGGGGGGG",
];

export interface LevelData {
  platforms: Platform[];
  questionBlocks: QuestionBlock[];
  coins: Coin[];
  enemies: Goomba[];
  flag: Flag | null;
}

export function buildLevel(levelData: string[] = LEVEL_1): LevelData {
  const platforms: Platform[] = [];
  const questionBlocks: QuestionBlock[] = [];
  const coins: Coin[] = [];
  const enemies: Goomba[] = [];
  let flag: Flag | null = null;

  for (let row = 0; row < levelData.length; row++) {
    for (let col = 0; col < levelData[row].length; col++) {
      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;
      const ch = levelData[row][col];

      switch (ch) {
        case "G":
          platforms.push(new Platform(x, y, TILE_SIZE, TILE_SIZE, "#8B4513"));
          break;
        case "B":
          platforms.push(new Platform(x, y, TILE_SIZE, TILE_SIZE, "#C89632"));
          break;
        case "?":
          questionBlocks.push(new QuestionBlock(x, y));
          break;
        case "C":
          coins.push(new Coin(x + 10, y + 10));
          break;
        case "E":
          enemies.push(new Goomba(x, y));
          break;
        case "F":
          flag = new Flag(x, y);
          break;
      }
    }
  }

  return { platforms, questionBlocks, coins, enemies, flag };
}
