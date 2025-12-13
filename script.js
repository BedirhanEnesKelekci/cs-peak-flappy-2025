// Global Değişkenler
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const highScoreDisplay = document.getElementById('high-score-display');
const messageArea = document.getElementById('message-area');
// 🔥 LEADERBOARD HTML ELEMANI
const leaderboardList = document.getElementById('leaderboard-list'); 

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

const WIDTH = 600; 
const HEIGHT = 400; 
const JUMP_POWER = 3.7; 
const GRAVITY = 0.28; 
const PIPE_WIDTH = 50; 
const PIPE_GAP = 110; 
const PIPE_INTERVAL = 1800; 

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

let currentPipeSpeed = 2; 
const SPEED_INCREASE_INTERVAL = 3; 
const SPEED_INCREMENT = 0.2; 

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

// 🔥 KULLANICI ADI DEĞİŞKENİ
let currentUsername = null;

highScoreDisplay.textContent = `En Yüksek Skor: ${highScore}`;

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
            scoreDisplay.textContent = `Skor: ${score}`;
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

    // 🔥 İSİM KONTROLÜ
    if (currentUsername === null) {
        let name = prompt("Lütfen Adınızı ve Soyadınızı girin (Sıralama için gereklidir):", "Anonim");
        
        if (name === null || name.trim() === "") {
            messageArea.textContent = "Başlamak için Ad/Soyad girmeniz gerekiyor!";
            return;
        }
        currentUsername = name.trim();
        messageArea.textContent = `${currentUsername}, oyunu başlatmak için tıkla!`;
    }

    // Oyun Başlatma
    isPlaying = true;
    currentPipeSpeed = 2; // Hızı sıfırla
    score = 0;
    player.y = HEIGHT / 2;
    player.velocity = 0;
    pipes = [];
    scoreDisplay.textContent = 'Skor: 0';
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
    
    // 🔥 1. FIREBASE SKOR GÖNDERME
    if (score > 0 && currentUsername) {
        // global 'database' değişkenini (index.html'den) kullanıyoruz
        database.ref('scores').push({ 
            name: currentUsername,
            score: score,
            timestamp: Date.now()
        });
    }

    // 2. Yüksek skor yerel kaydı
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('cspeak_flappy_high_score', highScore);
        highScoreDisplay.textContent = `En Yüksek Skor: ${highScore}`;
    }
    
    // 3. Mesajı güncelle
    messageArea.textContent = `Oyun Bitti, ${currentUsername}! Skorunuz: ${score}. Tekrar oynamak için tıkla.`;
    messageArea.style.display = 'block';

    // 4. Leaderboard'u Güncelle
    fetchLeaderboard(); 
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

// --------------------
// 🔥 FIREBASE LEADERBOARD FONKSİYONLARI
// --------------------

function fetchLeaderboard() {
    // Leaderboard listesini temizle
    leaderboardList.innerHTML = '';
    
    // Veritabanından en iyi 5 skoru çek
    database.ref('scores')
        .orderByChild('score') 
        .limitToLast(5)      // Sadece en iyi 5 skoru çek
        .once('value', (snapshot) => {
            const scores = [];
            snapshot.forEach(childSnapshot => {
                scores.push(childSnapshot.val());
            });

            // Yüksekten düşüğe sırala
            scores.reverse(); 

            // Listeyi HTML'e yaz
            scores.forEach((item, index) => {
                const listItem = document.createElement('li');
                // Formatı: (Sıra No). İsim Soyisim - Skor
                listItem.innerHTML = `
                    <span>${index + 1}. ${item.name}</span>
                    <span>${item.score}</span>
                `;
                leaderboardList.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error("Firebase'den skorlar çekilemedi:", error);
            leaderboardList.innerHTML = '<li>Skorlar yüklenemedi. Firebase bağlantınızı ve kurallarınızı kontrol edin.</li>';
        });
}

// Show start message on load
messageArea.style.display = 'block';

// 🔥 Sayfa ilk açıldığında Leaderboard'u çek
fetchLeaderboard();
