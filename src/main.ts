/*
 * 超级玛丽 — 入口文件
 */

import { Game } from "./game";

const game = new Game();
game.bindInput();

function loop() {
  game.update();
  game.draw();
  requestAnimationFrame(loop);
}

loop();
