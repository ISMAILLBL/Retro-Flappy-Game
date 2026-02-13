const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("bestScore");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const startBtn = document.getElementById("startBtn");

const GAME = {
  width: canvas.width,
  height: canvas.height,
  gravity: 0.38,
  flapForce: -7.2,
  pipeSpeed: 2.6,
  pipeGap: 160,
  pipeWidth: 72,
  spawnEvery: 110,
};

const bird = { x: 120, y: GAME.height * 0.45, w: 34, h: 26, vy: 0, rot: 0 };

let frame = 0;
let score = 0;
let bestScore = Number(localStorage.getItem("retroFlappyBest") || 0);
let pipes = [];
let gameState = "start";

bestScoreEl.textContent = String(bestScore);

function resetGame() {
  bird.y = GAME.height * 0.45;
  bird.vy = 0;
  bird.rot = 0;
  score = 0;
  frame = 0;
  pipes = [];
  scoreEl.textContent = "0";
}

function startGame() {
  resetGame();
  gameState = "running";
  overlay.classList.remove("visible");
}

function gameOver() {
  gameState = "over";
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("retroFlappyBest", String(bestScore));
    bestScoreEl.textContent = String(bestScore);
  }
  overlayTitle.textContent = "GAME OVER";
  overlayText.textContent = `You scored ${score}. Press Space or Start to retry.`;
  startBtn.textContent = "RESTART";
  overlay.classList.add("visible");
}

function flap() {
  if (gameState === "start" || gameState === "over") startGame();
  if (gameState === "running") bird.vy = GAME.flapForce;
}

function spawnPipe() {
  const topMin = 70;
  const topMax = GAME.height - GAME.pipeGap - 140;
  const topHeight = Math.floor(Math.random() * (topMax - topMin + 1)) + topMin;
  pipes.push({ x: GAME.width + 8, top: topHeight, bottom: topHeight + GAME.pipeGap, passed: false });
}

function collide(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function update() {
  if (gameState !== "running") return;

  frame++;
  bird.vy += GAME.gravity;
  bird.y += bird.vy;
  bird.rot = Math.max(-0.5, Math.min(1.25, bird.vy / 8));

  if (frame % GAME.spawnEvery === 0) spawnPipe();

  for (let i = pipes.length - 1; i >= 0; i--) {
    const p = pipes[i];
    p.x -= GAME.pipeSpeed;

    if (!p.passed && p.x + GAME.pipeWidth < bird.x) {
      p.passed = true;
      score++;
      scoreEl.textContent = String(score);
    }

    const topRect = { x: p.x, y: 0, w: GAME.pipeWidth, h: p.top };
    const bottomRect = { x: p.x, y: p.bottom, w: GAME.pipeWidth, h: GAME.height - p.bottom };
    const birdRect = { x: bird.x, y: bird.y, w: bird.w, h: bird.h };

    if (collide(birdRect, topRect) || collide(birdRect, bottomRect)) {
      gameOver();
      return;
    }

    if (p.x + GAME.pipeWidth < -5) pipes.splice(i, 1);
  }

  if (bird.y <= 0 || bird.y + bird.h >= GAME.height) gameOver();
}

function drawBackground() {
  ctx.fillStyle = "#77d8ff";
  ctx.fillRect(0, 0, GAME.width, GAME.height);

  ctx.fillStyle = "#eaf7ff";
  for (let i = 0; i < 4; i++) {
    const cx = ((frame * 0.3 + i * 130) % (GAME.width + 100)) - 100;
    const cy = 80 + i * 40;
    ctx.fillRect(cx, cy, 34, 12);
    ctx.fillRect(cx + 10, cy - 8, 24, 12);
    ctx.fillRect(cx + 22, cy + 4, 20, 10);
  }

  ctx.fillStyle = "#d4b06a";
  ctx.fillRect(0, GAME.height - 74, GAME.width, 74);
  ctx.fillStyle = "#c9984b";
  for (let x = 0; x < GAME.width; x += 20) {
    ctx.fillRect((x + frame) % (GAME.width + 20) - 20, GAME.height - 64, 10, 6);
  }
}

function drawPipes() {
  for (const p of pipes) {
    ctx.fillStyle = "#2fcd72";
    ctx.fillRect(p.x, 0, GAME.pipeWidth, p.top);
    ctx.fillStyle = "#1f8f4f";
    ctx.fillRect(p.x + GAME.pipeWidth - 10, 0, 10, p.top);
    ctx.fillStyle = "#4ef58f";
    ctx.fillRect(p.x, 0, 8, p.top);

    const bh = GAME.height - p.bottom;
    ctx.fillStyle = "#2fcd72";
    ctx.fillRect(p.x, p.bottom, GAME.pipeWidth, bh);
    ctx.fillStyle = "#1f8f4f";
    ctx.fillRect(p.x + GAME.pipeWidth - 10, p.bottom, 10, bh);
    ctx.fillStyle = "#4ef58f";
    ctx.fillRect(p.x, p.bottom, 8, bh);

    ctx.fillStyle = "#28aa60";
    ctx.fillRect(p.x - 4, p.top - 12, GAME.pipeWidth + 8, 12);
    ctx.fillRect(p.x - 4, p.bottom, GAME.pipeWidth + 8, 12);
  }
}

function drawBird() {
  ctx.save();
  ctx.translate(bird.x + bird.w / 2, bird.y + bird.h / 2);
  ctx.rotate(bird.rot);

  ctx.fillStyle = "#ffd94e";
  ctx.fillRect(-bird.w / 2, -bird.h / 2, bird.w, bird.h);
  ctx.fillStyle = "#ffb13d";
  ctx.fillRect(-4, 2, 14, 8);
  ctx.fillStyle = "#fff";
  ctx.fillRect(6, -8, 8, 8);
  ctx.fillStyle = "#000";
  ctx.fillRect(10, -6, 4, 4);
  ctx.fillStyle = "#ff7d3a";
  ctx.fillRect(bird.w / 2 - 1, -2, 8, 6);

  ctx.restore();
}

function render() {
  drawBackground();
  drawPipes();
  drawBird();
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, GAME.width, GAME.height);
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    flap();
  }
});
canvas.addEventListener("pointerdown", flap);
startBtn.addEventListener("click", startGame);

overlayTitle.textContent = "PRESS SPACE TO START";
overlayText.textContent = "Dodge the pipes and beat your best score.";
startBtn.textContent = "START";
overlay.classList.add("visible");
loop();