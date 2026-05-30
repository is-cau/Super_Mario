/*
 * 超级玛丽 — 入口文件
 */

import { Game } from "./game";

const game = new Game();
game.bindInput();

let lastTime = 0;
function loop(time: number) {
  const dt = Math.min((time - lastTime) / 16.67, 3); // cap at 3x speed
  lastTime = time;
  game.update(dt);
  game.draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
