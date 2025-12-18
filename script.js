// --------------------
// Global Değişkenler
// --------------------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const highScoreDisplay = document.getElementById('high-score-display');
const messageArea = document.getElementById('message-area');
const leaderboardList = document.getElementById('leaderboard-list'); 

// 🔥 ADIM 1: Firebase Anonim Giriş Başlatma
firebase.auth().signInAnonymously()
    .then(() => {
        console.log("Firebase Anahtarı Alındı (Anonim Giriş Başarılı).");
        fetchLeaderboard(); 
    })
    .catch((error) => {
        console.error("Giriş Hatası:", error);
    });

// --------------------
// PLAYER SPRITE
// --------------------
const playerSprite = new Image();
playerSprite.src = 'player_sprite.png';

const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 40;

// --------------------
// GAME SETTINGS (Sabitler)
// --------------------
const WIDTH = 600; 
const HEIGHT = 400; 
const JUMP_POWER = 3.7; 
const GRAVITY = 0.28; 
const PIPE_WIDTH = 50; 
const PIPE_GAP = 110; 
const PIPE_INTERVAL = 1800; 
const EASY_PIPE_GAP = 150;
const EASY_PIPE_COUNT = 10;
const HITBOX_PADDING_X = 5;
const HITBOX_PADDING_Y = 5;

// --------------------
// GAME STATE (Değişkenler)
// --------------------
let player = {
    x: 50,
    y: HEIGHT / 2 - PLAYER_HEIGHT / 2,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    velocity: 0
};

let currentPipeSpeed = 2; 
const SPEED_INCREASE_INTERVAL = 3; 
const SPEED_INCREMENT = 0.2; 
let isPlaying = false;
let score = 0;
let highScore = localStorage.getItem('cspeak_flappy_high_score') || 0;
let pipes = [];
let lastPipeTime = 0;
let gameInterval;
const GRAVITY_DELAY_FRAMES = 30;
let framesSinceStart = 0;
let currentUsername = null;

highScoreDisplay.textContent = `En Yüksek Skor: ${highScore}`;

// --------------------
// DRAWING FUNCTIONS
// --------------------
function drawPlayer() {
    ctx.drawImage(playerSprite, player.x, player.y, player.width, player.height);
}

function drawPipe(pipe) {
    ctx.fillStyle = '#ff8c00';
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
    ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, HEIGHT - pipe.bottomY);
}

function clearCanvas() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
}

// --------------------
// GAME MECHANICS
// --------------------
function createPipe() {
    let currentGap = score < EASY_PIPE_COUNT ? EASY_PIPE_GAP : PIPE_GAP;
    const minHeight = 50;
    const maxHeight = HEIGHT - currentGap - 50;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    const bottomY = topHeight + currentGap;

    pipes.push({ x: WIDTH, topHeight, bottomY, passed: false });
}

function updateGame() {
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
            scoreDisplay.textContent = `Skor: ${score}`;
            pipe.passed = true;

            if (score % SPEED_INCREASE_INTERVAL === 0) {
                currentPipeSpeed += SPEED_INCREMENT;
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

function checkCollision() {
    const hitboxX1 = player.x + HITBOX_PADDING_X;
    const hitboxY1 = player.y + HITBOX_PADDING_Y;
    const hitboxX2 = player.x + player.width - HITBOX_PADDING_X;
    const hitboxY2 = player.y + player.height - HITBOX_PADDING_Y;

    if (hitboxY2 > HEIGHT || hitboxY1 < 0) return true;

    for (const pipe of pipes) {
        if (hitboxX2 > pipe.x && hitboxX1 < pipe.x + PIPE_WIDTH) {
            if (hitboxY1 < pipe.topHeight || hitboxY2 > pipe.bottomY) return true;
        }
    }
    return false;
}

// --------------------
// GAME CONTROLS
// --------------------
function jump() {
    if (isPlaying) player.velocity = -JUMP_POWER;
}

function startGame() {
    if (isPlaying) return;

    if (currentUsername === null) {
        let name = prompt("Lütfen Adınızı ve Soyadınızı girin:", "Anonim");
        if (name === null || name.trim() === "") {
            messageArea.textContent = "Başlamak için isim girmelisiniz!";
            return;
        }
        currentUsername = name.trim();
    }

    isPlaying = true;
    currentPipeSpeed = 2;
    score = 0;
    player.y = HEIGHT / 2;
    player.velocity = 0;
    pipes = [];
    scoreDisplay.textContent = 'Skor: 0';
    messageArea.style.display = 'none';
    framesSinceStart = 0;
    lastPipeTime = Date.now();
    createPipe();

    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(updateGame, 1000 / 60);
}

function gameOver() {
    clearInterval(gameInterval);
    isPlaying = false;
    
    const user = firebase.auth().currentUser;

    if (score > 0 && currentUsername && user) {
        database.ref('scores/' + user.uid).set({ 
            name: currentUsername,
            score: score,
            timestamp: Date.now()
        }).then(() => {
            fetchLeaderboard(); 
        });
    }

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('cspeak_flappy_high_score', highScore);
        highScoreDisplay.textContent = `En Yüksek Skor: ${highScore}`;
    }
    
    messageArea.textContent = `Oyun Bitti, ${currentUsername}! Skor: ${score}. Tekrar oynamak için tıkla.`;
    messageArea.style.display = 'block';
}

// --------------------
// 🔥 GÜNCELLENMİŞ EVENT LISTENERS (Ekranın Her Yerine Dokunma)
// --------------------

// 1. Mouse Tıklaması (Tüm Sayfa)
document.addEventListener('mousedown', (e) => {
    // Eğer tıklanan yer "message-area" değilse zıpla
    if (e.target.id !== 'message-area') {
        if (isPlaying) {
            jump();
        } else if (messageArea.style.display === 'block' && currentUsername !== null) {
            // Oyun bittiyse ve ekranda mesaj varsa herhangi bir yere tıklayınca başlasın
            startGame();
        }
    }
});

// 2. Mobil Dokunma (Tüm Sayfa)
document.addEventListener('touchstart', (e) => {
    if (e.target.id !== 'message-area') {
        if (isPlaying) {
            jump();
            // Mobilde tıklarken sayfanın kaymasını engelle
            if (e.cancelable) e.preventDefault(); 
        } else if (messageArea.style.display === 'block' && currentUsername !== null) {
            startGame();
        }
    }
}, { passive: false });

// 3. Klavye Kontrolü
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!isPlaying) startGame(); else jump();
    }
});

// --------------------
// LEADERBOARD VE DİĞER FONKSİYONLAR
// --------------------
function fetchLeaderboard() {
    if (!leaderboardList) return;
    database.ref('scores').orderByChild('score').limitToLast(5).once('value', (snapshot) => {
        const scores = [];
        snapshot.forEach(childSnapshot => { scores.push(childSnapshot.val()); });
        scores.sort((a, b) => b.score - a.score);
        leaderboardList.innerHTML = ''; 
        scores.forEach((item, index) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<span>${index + 1}. ${item.name}</span><span>${item.score}</span>`;
            leaderboardList.appendChild(listItem);
        });
    }).catch(error => {
        console.error("Skor çekme hatası:", error);
        leaderboardList.innerHTML = '<li>Skorlar yüklenemedi.</li>';
    });
}

function resizeCanvas() {
    const container = document.getElementById('game-container');
    const containerWidth = container.clientWidth;
    if (containerWidth < WIDTH) {
        canvas.style.width = containerWidth + 'px';
        canvas.style.height = (containerWidth / (WIDTH / HEIGHT)) + 'px';
    } else {
        canvas.style.width = WIDTH + 'px';
        canvas.style.height = HEIGHT + 'px';
    }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
messageArea.style.display = 'block';
