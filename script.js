const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const highScoreDisplay = document.getElementById('high-score-display');
const messageArea = document.getElementById('message-area');

// --------------------
// PLAYER SPRITE
// --------------------

// Create image object for the player character
const playerSprite = new Image();

// Path to the player sprite image file
playerSprite.src = 'player_sprite.png';

// Player sprite dimensions inside the game
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 40;

// --------------------
// GAME SETTINGS
// --------------------

const WIDTH = 600;               // Game canvas width
const HEIGHT = 400;              // Game canvas height
const JUMP_POWER = 3.7;          // Jump strength
const GRAVITY = 0.28;            // Gravity force
const PIPE_WIDTH = 50;           // Pipe width
const PIPE_GAP = 110;            // Gap between top and bottom pipes
const PIPE_INTERVAL = 1800;      // Time between pipe generation (ms)

// Easier settings for the beginning of the game
const EASY_PIPE_GAP = 150;
const EASY_PIPE_COUNT = 10;

// Hitbox padding to make collisions more forgiving
const HITBOX_PADDING_X = 5;
const HITBOX_PADDING_Y = 5;

// --------------------
// PLAYER OBJECT
// --------------------

let player = {
    x: 50,
    y: HEIGHT / 2 - PLAYER_HEIGHT / 2,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    velocity: 0
};

// --------------------
// GAME SPEED SETTINGS
// --------------------

let currentPipeSpeed = 2;               // Initial pipe speed
const SPEED_INCREASE_INTERVAL = 3;      // Score interval for speed increase
const SPEED_INCREMENT = 0.2;            // Speed increase amount

// --------------------
// GAME STATE
// --------------------

let isPlaying = false;
let score = 0;
let highScore = localStorage.getItem('cspeak_flappy_high_score') || 0;
let pipes = [];
let lastPipeTime = 0;
let gameInterval;

// Delay gravity at the start of the game
const GRAVITY_DELAY_FRAMES = 30;
let framesSinceStart = 0;

highScoreDisplay.textContent = `High Score: ${highScore}`;

// --------------------
// DRAWING FUNCTIONS
// --------------------

// Draw the player sprite on the canvas
function drawPlayer() {
    ctx.drawImage(playerSprite, player.x, player.y, player.width, player.height);
}

// Draw a pipe pair (top and bottom)
function drawPipe(pipe) {
    ctx.fillStyle = '#ff8c00';
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
    ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, HEIGHT - pipe.bottomY);
}

// Clear the game canvas
function clearCanvas() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
}

// --------------------
// GAME MECHANICS
// --------------------

// Create a new pipe pair
function createPipe() {
    let currentGap = PIPE_GAP;

    if (score < EASY_PIPE_COUNT) {
        currentGap = EASY_PIPE_GAP;
    }

    const minHeight = 50;
    const maxHeight = HEIGHT - currentGap - 50;
    const topHeight =
        Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    const bottomY = topHeight + currentGap;

    pipes.push({
        x: WIDTH,
        topHeight,
        bottomY,
        passed: false
    });
}

// Update the game state every frame
function updateGame(deltaTime) {
    if (!isPlaying) return;

    framesSinceStart++;

    if (framesSinceStart > GRAVITY_DELAY_FRAMES) {
        player.velocity += GRAVITY;
    }

    player.y += player.velocity;

    pipes.forEach(pipe => {
        pipe.x -= currentPipeSpeed;

        if (!pipe.passed && pipe.x + PIPE_WIDTH < player.x) {
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
            pipe.passed = true;

            if (score % SPEED_INCREASE_INTERVAL === 0) {
                currentPipeSpeed += SPEED_INCREMENT;
                console.log(
                    `Game speed increased. New speed: ${currentPipeSpeed.toFixed(2)}`
                );
            }
        }
    });

    pipes = pipes.filter(pipe => pipe.x + PIPE_WIDTH > 0);

    const now = Date.now();
    if (now - lastPipeTime > PIPE_INTERVAL) {
        createPipe();
        lastPipeTime = now;
    }

    if (checkCollision()) {
        gameOver();
        return;
    }

    clearCanvas();
    pipes.forEach(drawPipe);
    drawPlayer();
}

// --------------------
// COLLISION DETECTION
// --------------------

function checkCollision() {
    const hitboxX1 = player.x + HITBOX_PADDING_X;
    const hitboxY1 = player.y + HITBOX_PADDING_Y;
    const hitboxX2 = player.x + player.width - HITBOX_PADDING_X;
    const hitboxY2 = player.y + player.height - HITBOX_PADDING_Y;

    // Check collision with ground or ceiling
    if (hitboxY2 > HEIGHT || hitboxY1 < 0) {
        return true;
    }

    // Check collision with pipes
    for (const pipe of pipes) {
        if (hitboxX2 > pipe.x && hitboxX1 < pipe.x + PIPE_WIDTH) {
            if (hitboxY1 < pipe.topHeight || hitboxY2 > pipe.bottomY) {
                return true;
            }
        }
    }

    return false;
}

// --------------------
// GAME CONTROLS
// --------------------

// Make the player jump
function jump() {
    if (isPlaying) {
        player.velocity = -JUMP_POWER;
    }
}

// Start or restart the game
function startGame() {
    if (isPlaying) return;

    isPlaying = true;
    score = 0;
    player.y = HEIGHT / 2;
    player.velocity = 0;
    pipes = [];
    scoreDisplay.textContent = 'Score: 0';
    messageArea.style.display = 'none';
    framesSinceStart = 0;

    lastPipeTime = Date.now();
    createPipe();

    let lastTime = Date.now();
    gameInterval = setInterval(() => {
        const now = Date.now();
        updateGame(now - lastTime);
        lastTime = now;
    }, 1000 / 60);
}

// Handle game over state
function gameOver() {
    clearInterval(gameInterval);
    isPlaying = false;
    messageArea.textContent = 'Game Over! Click to play again.';
    messageArea.style.display = 'block';

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('cspeak_flappy_high_score', highScore);
        highScoreDisplay.textContent = `High Score: ${highScore}`;
    }
}

// --------------------
// EVENT LISTENERS
// --------------------

messageArea.addEventListener('click', startGame);
canvas.addEventListener('click', jump);

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
    }
});

// Show start message on load
messageArea.style.display = 'block';
