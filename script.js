const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const highScoreDisplay = document.getElementById('high-score-display');
const messageArea = document.getElementById('message-area');
// ... (Place this below the canvas, ctx, scoreDisplay definitions)

// Load the player sprite image
const playerSprite = new Image();
playerSprite.src = 'player_sprite.png'; // image located in your directory

// Set the player's width and height (adjust according to sprite size)
// Assuming the sprite is around 40x40 pixels
const PLAYER_WIDTH = 40; 
const PLAYER_HEIGHT = 40;

// Game Settings
const WIDTH = 600;
const HEIGHT = 400;
const JUMP_POWER = 3.7;
const GRAVITY = 0.28;
const PIPE_WIDTH = 50;
const PIPE_GAP = 110;
const PIPE_INTERVAL = 1800; 
const EASY_PIPE_GAP = 150;
const EASY_PIPE_COUNT = 10;

// Player object
let player = {
    x: 50,
    y: HEIGHT / 2 - PLAYER_HEIGHT / 2,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    velocity: 0
};

// Game Speed Settings
let currentPipeSpeed = 2;
const SPEED_INCREASE_INTERVAL = 3;
const SPEED_INCREMENT = 0.2;

// Game State
let isPlaying = false;
let score = 0;
let highScore = localStorage.getItem('cspeak_flappy_high_score') || 0;
let pipes = [];
let lastPipeTime = 0;
let gameInterval;
const GRAVITY_DELAY_FRAMES = 30;
let framesSinceStart = 0;

highScoreDisplay.textContent = `En Yüksek Skor: ${highScore}`;

// --- Drawing Functions ---

function drawPlayer() {
    // Draw the sprite image
    ctx.drawImage(playerSprite, player.x, player.y, player.width, player.height);
}

function drawPipe(pipe) {
    ctx.fillStyle = '#ff8c00';
    // Top Pipe
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
    // Bottom Pipe
    ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, HEIGHT - pipe.bottomY);
}

function clearCanvas() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
}

// --- Game Mechanics ---

function createPipe() {
    let currentGap = PIPE_GAP;
    
    if (score < EASY_PIPE_COUNT) {
        currentGap = EASY_PIPE_GAP;
    }

    // Generate a random gap height
    const minHeight = 50;
    const maxHeight = HEIGHT - currentGap - 50;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    const bottomY = topHeight + currentGap;

    pipes.push({
        x: WIDTH,
        topHeight: topHeight,
        bottomY: bottomY,
        passed: false
    });
}

function updateGame(deltaTime) {
    if (!isPlaying) return;

    framesSinceStart++;

    // 1. Update Player Movement
    if (framesSinceStart > GRAVITY_DELAY_FRAMES) {    
        player.velocity += GRAVITY; // Gravity
    }
    player.y += player.velocity;

    // 2. Update and Draw Pipes
    pipes.forEach(pipe => {
        pipe.x -= currentPipeSpeed; // Move pipe left
        drawPipe(pipe);

        // Check if pipe was passed & update score
        if (!pipe.passed && pipe.x + PIPE_WIDTH < player.x) {
            score++;
            scoreDisplay.textContent = `Skor: ${score}`;
            pipe.passed = true;

            // NEW SPEED CONTROL BLOCK
            // If score is a multiple of the speed increase interval
            if (score % SPEED_INCREASE_INTERVAL === 0) {
                currentPipeSpeed += SPEED_INCREMENT;
                console.log(`Speed Increased! New Speed: ${currentPipeSpeed.toFixed(2)}`);
            }
        }
    });

    // Remove pipes that moved off-screen
    pipes = pipes.filter(pipe => pipe.x + PIPE_WIDTH > 0);

    // Create new pipe at interval
    const now = Date.now();
    if (now - lastPipeTime > PIPE_INTERVAL) {
        createPipe();
        lastPipeTime = now;
    }

    // 3. Collision Check
    if (checkCollision()) {
        gameOver();
        return;
    }

    // 4. Draw Player
    clearCanvas();
    pipes.forEach(drawPipe);
    drawPlayer();
}

function checkCollision() {
    // 1. Check collision with floor or ceiling
    if (player.y + player.height > HEIGHT || player.y < 0) {
        return true;
    }

    // 2. Check collision with pipes
    for (const pipe of pipes) {

        // Check X-axis overlap
        if (player.x + player.width > pipe.x && player.x < pipe.x + PIPE_WIDTH) {

            // Check Y-axis collision:
            // If player's top hits top pipe or player's bottom hits bottom pipe
            if (player.y < pipe.topHeight || player.y + player.height > pipe.bottomY) {
                return true; 
            }
        }
    }

    return false;
}

// --- Game Control Functions ---

function jump() {
    if (isPlaying) {
        player.velocity = -JUMP_POWER; // Negative velocity = upward movement
    }
}

function startGame() {
    if (isPlaying) return;

    // Reset game state
    isPlaying = true;
    score = 0;
    player.y = HEIGHT / 2;
    player.velocity = 0;
    pipes = [];
    scoreDisplay.textContent = `Skor: 0`;
    messageArea.style.display = 'none';
    framesSinceStart = 0;

    // Create the first pipe
    lastPipeTime = Date.now();
    createPipe();
    
    let lastTime = Date.now();
    gameInterval = setInterval(() => {
        const now = Date.now();
        const deltaTime = now - lastTime;
        updateGame(deltaTime);
        lastTime = now;
    }, 1000 / 60); // 60 FPS
}

function gameOver() {
    clearInterval(gameInterval);
    isPlaying = false;
    messageArea.textContent = 'Oyun Bitti! Tekrar oynamak için tıkla.';
    messageArea.style.display = 'block';

    // Update High Score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('cspeak_flappy_high_score', highScore);
        highScoreDisplay.textContent = `En Yüksek Skor: ${highScore}`;
    }
}

// --- Event Listeners ---

// Click/tap to start the game
messageArea.addEventListener('click', startGame);
canvas.addEventListener('click', jump);

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault(); // Prevent page scroll
        jump();
    }
});

// Show the start message
messageArea.style.display = 'block';
