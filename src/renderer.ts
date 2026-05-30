/*
 * 像素画渲染引擎
 * 将 [colorIndex, pixelSize] 格式的像素数据绘制到 Canvas
 */

/** 全局调色板 */
export const PALETTE: Record<number, string> = {
  // 透明（不绘制）
  0: "transparent",
  // 马里奥
  1: "#E80000", // 红
  2: "#0058F8", // 蓝
  3: "#FCBCB0", // 肤色
  4: "#6B3D00", // 棕（帽子/头发）
  5: "#FFA044", // 深肤
  6: "#000000", // 黑
  // 砖块 / 地面
  10: "#C84C0C", // 砖红
  11: "#E09040", // 砖亮
  12: "#A83800", // 砖暗
  13: "#88CC00", // 草顶
  14: "#5C9400", // 草暗
  // 问号砖
  20: "#F8A800", // 金亮
  21: "#D08000", // 金暗
  // 金币
  30: "#F8D800", // 金币亮
  31: "#E0A800", // 金币暗
  // 蘑菇
  40: "#FF0000", // 蘑菇红
  41: "#FF9999", // 蘑菇亮
  42: "#FFFFFF", // 白点
  43: "#FFCC99", // 蘑菇茎
  // 栗子仔
  50: "#D84000", // 栗红
  51: "#F8A060", // 亮色
  52: "#E0E0E0", // 眼白
  // 水管
  60: "#00A800", // 管绿亮
  61: "#007800", // 管绿
  62: "#005800", // 管暗
  63: "#F8F8F8", // 高光
  // 旗帜
  70: "#FFFFFF", // 旗白
  71: "#00CC00", // 旗绿
  // 背景
  80: "#B8D8FF", // 云
  81: "#78A878", // 远山
  82: "#98C878", // 灌木
  83: "#68B868", // 草
  // UI
  90: "#FFD700", // 金文字
  91: "#FFFFFF", // 白文字
};

/** 绘制像素数据到 Canvas */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  data: number[][],
  x: number,
  y: number,
  pixelSize: number,
  flipX: boolean = false,
  alpha: number = 1
) {
  const rows = data.length;
  const cols = data[0]?.length || 0;
  ctx.globalAlpha = alpha;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const ci = data[row][col];
      if (ci === 0) continue;
      const color = PALETTE[ci];
      if (!color) continue;
      ctx.fillStyle = color;
      const drawCol = flipX ? cols - 1 - col : col;
      ctx.fillRect(
        x + drawCol * pixelSize,
        y + row * pixelSize,
        pixelSize,
        pixelSize
      );
    }
  }
  ctx.globalAlpha = 1;
}

/** 创建指定大小的颜色矩阵（纯色填充） */
export function solidMatrix(w: number, h: number, color: number): number[][] {
  const m: number[][] = [];
  for (let r = 0; r < h; r++) {
    const row: number[] = [];
    for (let c = 0; c < w; c++) row.push(color);
    m.push(row);
  }
  return m;
}

/** 在矩阵上叠加另一个矩阵（非0像素覆盖） */
export function overlay(base: number[][], top: number[][], dx: number, dy: number): number[][] {
  const result = base.map(r => [...r]);
  for (let r = 0; r < top.length; r++) {
    for (let c = 0; c < top[r].length; c++) {
      const br = r + dy;
      const bc = c + dx;
      if (br >= 0 && br < result.length && bc >= 0 && bc < result[0].length) {
        if (top[r][c] !== 0) result[br][bc] = top[r][c];
      }
    }
  }
  return result;
}
