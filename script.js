// --------------------
// Global Değişkenler
// --------------------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const highScoreDisplay = document.getElementById('high-score-display');
const messageArea = document.getElementById('message-area');
const leaderboardList = document.getElementById('leaderboard-list'); 

firebase.auth().signInAnonymously()
    .then(() => { fetchLeaderboard(); })
    .catch((error) => console.error("Giriş Hatası:", error));

// --------------------
// PLAYER & SETTINGS
// --------------------
const playerSprite = new Image();
playerSprite.src = 'player_sprite.png';

const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 40;
const WIDTH = 600; 
const HEIGHT = 400; 
const JUMP_POWER = 3.8; 
const GRAVITY = 0.25; 
const PIPE_WIDTH = 50; 
const PIPE_GAP = 120; 
const PIPE_INTERVAL = 1800; 

let player = { x: 50, y: HEIGHT / 2, width: PLAYER_WIDTH, height: PLAYER_HEIGHT, velocity: 0 };
let currentPipeSpeed = 2.5; 
let isPlaying = false;
let score = 0;
let highScore = localStorage.getItem('cspeak_flappy_high_score') || 0;
let pipes = [];
let lastPipeTime = 0;
let animationFrameId; // iOS akıcılığı için setInterval yerine bu kullanılacak
let framesSinceStart = 0;
let currentUsername = null;

highScoreDisplay.textContent = `En Yüksek Skor: ${highScore}`;

// --------------------
// GAME MECHANICS
// --------------------
function createPipe() {
    const minHeight = 50;
    const maxHeight = HEIGHT - PIPE_GAP - 50;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    pipes.push({ x: WIDTH, topHeight, bottomY: topHeight + PIPE_GAP, passed: false });
}

// iOS ve Modern Tarayıcılar için Akıcı Döngü
function gameLoop() {
    if (!isPlaying) return;

    framesSinceStart++;
    if (framesSinceStart > 15) player.velocity += GRAVITY;
    player.y += player.velocity;

    pipes.forEach(pipe => {
        pipe.x -= currentPipeSpeed;
        if (!pipe.passed && pipe.x + PIPE_WIDTH < player.x) {
            score++;
            scoreDisplay.textContent = `Skor: ${score}`;
            pipe.passed = true;
            if (score % 3 === 0) currentPipeSpeed += 0.15;
        }
    });

    pipes = pipes.filter(pipe => pipe.x + PIPE_WIDTH > 0);
    const now = Date.now();
    if (now - lastPipeTime > PIPE_INTERVAL) {
        createPipe();
        lastPipeTime = now;
    }

    if (checkCollision()) { gameOver(); return; }

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    pipes.forEach(pipe => {
        ctx.fillStyle = '#ff8c00';
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, HEIGHT - pipe.bottomY);
    });
    ctx.drawImage(playerSprite, player.x, player.y, player.width, player.height);

    animationFrameId = requestAnimationFrame(gameLoop);
}

function checkCollision() {
    if (player.y + player.height > HEIGHT || player.y < 0) return true;
    for (const pipe of pipes) {
        if (player.x + 30 > pipe.x && player.x + 10 < pipe.x + PIPE_WIDTH) {
            if (player.y + 10 < pipe.topHeight || player.y + 30 > pipe.bottomY) return true;
        }
    }
    return false;
}

function startGame() {
    if (isPlaying) return;
    if (currentUsername === null) {
        let name = prompt("Lütfen Ad Soyad girin:", "");
        if (!name) return;
        currentUsername = name.trim();
    }
    isPlaying = true;
    score = 0;
    player.y = HEIGHT / 2;
    player.velocity = 0;
    pipes = [];
    currentPipeSpeed = 2.5;
    scoreDisplay.textContent = 'Skor: 0';
    messageArea.style.display = 'none';
    lastPipeTime = Date.now();
    framesSinceStart = 0;
    
    cancelAnimationFrame(animationFrameId);
    gameLoop();
}

function gameOver() {
    isPlaying = false;
    cancelAnimationFrame(animationFrameId);
    
    const user = firebase.auth().currentUser;
    if (score > 0 && currentUsername && user) {
        database.ref('scores/' + user.uid).set({
            name: currentUsername,
            score: score,
            timestamp: Date.now()
        }).then(() => fetchLeaderboard());
    }

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('cspeak_flappy_high_score', highScore);
        highScoreDisplay.textContent = `En Yüksek Skor: ${highScore}`;
    }
    
    messageArea.textContent = `Bitti! Skor: ${score}. Devam Etmek İçin Dokun!`;
    messageArea.style.display = 'block';
}

// --------------------
// 🔥 GLOBAL CONTROLS (Tüm Cihazlar İçin)
// --------------------
function handleAction(e) {
    if (e.target.id === 'leaderboard-list' || e.target.tagName === 'LI') return;
    
    if (!isPlaying) {
        startGame();
    } else {
        player.velocity = -JUMP_POWER;
    }
}

// Hem dokunma hem tıklama için tek kontrol
window.addEventListener('touchstart', (e) => {
    handleAction(e);
    if (isPlaying && e.cancelable) e.preventDefault();
}, { passive: false });

window.addEventListener('mousedown', (e) => {
    if (e.type === 'mousedown' && 'ontouchstart' in window) return; // Çift tetiklemeyi engelle
    handleAction(e);
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); handleAction(e); }
});

// --------------------
// SCOREBOARD & RESIZE
// --------------------
function fetchLeaderboard() {
    // BURASI GÜNCELLENDİ: limitToLast(5) -> limitToLast(10)
    database.ref('scores').orderByChild('score').limitToLast(10).once('value', (snapshot) => {
        const scores = [];
        snapshot.forEach(child => {
            scores.push(child.val());
        });
        // Büyükten küçüğe sırala ve listeyi oluştur
        scores.sort((a, b) => b.score - a.score);
        leaderboardList.innerHTML = '';
        scores.forEach((item, i) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${i + 1}. ${item.name}</span> <span>${item.score}</span>`;
            leaderboardList.appendChild(li);
        });
    });
}

function resizeCanvas() {
    const container = document.getElementById('game-container');
    const cw = container.clientWidth;
    if (cw < WIDTH) {
        canvas.style.width = cw + 'px';
        canvas.style.height = (cw / (WIDTH / HEIGHT)) + 'px';
    }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
messageArea.style.display = 'block';
