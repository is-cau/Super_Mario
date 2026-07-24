import { isAudioEnabled, setAudioEnabled, startBgm } from "./audio";
import { Game } from "./game";

const game = new Game();
game.bindInput();

const canvas = document.querySelector<HTMLCanvasElement>("#gameCanvas")!;
const gameShell = document.querySelector<HTMLElement>("#gameShell")!;
const startButton = document.querySelector<HTMLButtonElement>("#startGame")!;
const pauseButton = document.querySelector<HTMLButtonElement>("#pauseToggle")!;
const soundButton = document.querySelector<HTMLButtonElement>("#soundToggle")!;
const fullscreenButton = document.querySelector<HTMLButtonElement>("#fullscreenToggle")!;
const bestScoreElement = document.querySelector<HTMLElement>("#bestScore")!;
const gameStatus = document.querySelector<HTMLElement>("#gameStatus")!;

const storageKey = "pixel-quest-best-score";
let bestScore = Number.parseInt(localStorage.getItem(storageKey) || "0", 10) || 0;
let previousState = "";
let previousPauseState = false;
let previousScore = -1;

const storedAudioPreference = localStorage.getItem("pixel-quest-audio");
setAudioEnabled(storedAudioPreference !== "off");

function sendKey(key: string, pressed: boolean): void {
  window.dispatchEvent(new KeyboardEvent(pressed ? "keydown" : "keyup", { key, bubbles: true }));
}

function updateChrome(force = false): void {
  const score = game.player?.score ?? 0;
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem(storageKey, String(bestScore));
  }

  if (!force && previousState === game.state && previousPauseState === game.paused && previousScore === score) return;
  previousState = game.state;
  previousPauseState = game.paused;
  previousScore = score;

  document.body.dataset.gameState = game.state;
  bestScoreElement.textContent = String(bestScore).padStart(6, "0");
  startButton.textContent = game.state === "menu" ? "开始游戏" : "再来一局";
  pauseButton.disabled = game.state !== "playing";
  pauseButton.setAttribute("aria-pressed", String(game.paused));
  pauseButton.setAttribute("aria-label", game.paused ? "继续游戏" : "暂停游戏");
  pauseButton.querySelector<HTMLElement>("[data-pause-icon]")!.textContent = game.paused ? "▶" : "Ⅱ";

  const stateLabels = {
    menu: "等待开始",
    playing: game.paused ? "游戏已暂停" : "游戏进行中",
    gameover: `游戏结束，得分 ${score}`,
    win: `通关成功，得分 ${score}`,
  };
  gameStatus.textContent = stateLabels[game.state];
}

function updateSoundButton(): void {
  const enabled = isAudioEnabled();
  soundButton.setAttribute("aria-pressed", String(enabled));
  soundButton.setAttribute("aria-label", enabled ? "关闭声音" : "打开声音");
  soundButton.querySelector<HTMLElement>("[data-sound-icon]")!.textContent = enabled ? "♪" : "×";
}

startButton.addEventListener("click", () => {
  game.start();
  canvas.focus();
  updateChrome(true);
});

pauseButton.addEventListener("click", () => {
  game.togglePause();
  canvas.focus();
  updateChrome(true);
});

soundButton.addEventListener("click", () => {
  const enabled = !isAudioEnabled();
  setAudioEnabled(enabled);
  localStorage.setItem("pixel-quest-audio", enabled ? "on" : "off");
  if (enabled && game.state === "playing" && !game.paused) startBgm();
  updateSoundButton();
});

fullscreenButton.addEventListener("click", async () => {
  if (document.fullscreenElement) await document.exitFullscreen();
  else await gameShell.requestFullscreen();
});

document.addEventListener("fullscreenchange", () => {
  const fullscreen = Boolean(document.fullscreenElement);
  fullscreenButton.setAttribute("aria-pressed", String(fullscreen));
  fullscreenButton.setAttribute("aria-label", fullscreen ? "退出全屏" : "进入全屏");
});

document.querySelectorAll<HTMLButtonElement>("[data-game-key]").forEach(button => {
  const key = button.dataset.gameKey!;
  const release = () => {
    sendKey(key, false);
    button.classList.remove("is-pressed");
  };

  button.addEventListener("pointerdown", event => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    button.classList.add("is-pressed");
    sendKey(key, true);
  });
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
  button.addEventListener("contextmenu", event => event.preventDefault());
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && game.state === "playing" && !game.paused) {
    game.togglePause();
    updateChrome(true);
  }
});

let lastTime = 0;
function loop(time: number): void {
  const dt = Math.min((time - lastTime) / 16.67, 3);
  lastTime = time;
  game.update(dt);
  game.draw();
  updateChrome();
  requestAnimationFrame(loop);
}

updateSoundButton();
updateChrome(true);
requestAnimationFrame(loop);
