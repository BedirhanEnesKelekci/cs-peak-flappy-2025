const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const highScoreDisplay = document.getElementById('high-score-display');
const messageArea = document.getElementById('message-area');
// ... (const canvas, ctx, scoreDisplay gibi tanÄ±mlamalarÄ±n altÄ±na)

// Karakter gÃ¶rselini yÃ¼kle
const playerSprite = new Image();
playerSprite.src = 'player_sprite.png'; // KlasÃ¶rdeki gÃ¶rselinizin adÄ±

// Karakterin geniÅŸlik ve yÃ¼ksekliÄŸini belirle (GÃ¶rselin boyutlarÄ±na gÃ¶re ayarlayÄ±n)
// YÃ¼klediÄŸiniz gÃ¶rsel 40x40 piksel civarÄ± olabilir, buna gÃ¶re ayarladÄ±m
const PLAYER_WIDTH = 40; 
const PLAYER_HEIGHT = 40;
// Oyun AyarlarÄ±
const WIDTH = 600;
const HEIGHT = 400;
const JUMP_POWER = 3.7;
const GRAVITY = 0.28;
const PIPE_WIDTH = 50;
const PIPE_GAP = 110;
const PIPE_INTERVAL = 1800; // Boru oluÅŸturma aralÄ±ÄŸÄ± (ms)
const EASY_PIPE_GAP = 150;
const EASY_PIPE_COUNT = 10;
// Karakter (Oyuncu)
let player = {
    x: 50,
    y: HEIGHT / 2 - PLAYER_HEIGHT / 2,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    velocity: 0
};

// Oyun HÄ±zÄ± AyarlarÄ±
let currentPipeSpeed = 2; // BaÅŸlangÄ±Ã§ hÄ±zÄ± (Daha Ã¶nce 2'ydi, ÅŸimdi deÄŸiÅŸken oldu)
const SPEED_INCREASE_INTERVAL = 3; // KaÃ§ puanda bir hÄ±zlanacaÄŸÄ± (Ã–rn: Her 3 puanda bir)
const SPEED_INCREMENT = 0.2; // Her hÄ±zlanmada hÄ±za ne kadar ekleneceÄŸi

// Oyun Durumu
let isPlaying = false;
let score = 0;
let highScore = localStorage.getItem('cspeak_flappy_high_score') || 0;
let pipes = [];
let lastPipeTime = 0;
let gameInterval;
const GRAVITY_DELAY_FRAMES = 30;
let framesSinceStart = 0;

highScoreDisplay.textContent = `En YÃ¼ksek Skor: ${highScore}`;

// --- Ã‡izim FonksiyonlarÄ± ---

function drawPlayer() {
    // GÃ¶rseli Ã§iz: (gÃ¶rsel, x, y, geniÅŸlik, yÃ¼kseklik)
    ctx.drawImage(playerSprite, player.x, player.y, player.width, player.height);
}

function drawPipe(pipe) {
    ctx.fillStyle = '#ff8c00'; // Turuncu
    // Ãœst Boru
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
    // Alt Boru
    ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, HEIGHT - pipe.bottomY);
}

function clearCanvas() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
}

// --- Oyun MekaniÄŸi ---

function createPipe() {
   let currentGap = PIPE_GAP;
if (score < EASY_PIPE_COUNT) {
currentGap = EASY_PIPE_GAP;
}
// Rastgele boÅŸluk yÃ¼ksekliÄŸi belirle
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
    // 1. Oyuncu Hareketini GÃ¼ncelle
if (framesSinceStart > GRAVITY_DELAY_FRAMES) {    
player.velocity += GRAVITY; // YerÃ§ekimi
}
    player.y += player.velocity;;

    // 2. Boru Hareketini ve Ã‡izimini GÃ¼ncelle
    pipes.forEach(pipe => {
        pipe.x -= currentPipeSpeed; // Boruyu sola hareket ettir
        drawPipe(pipe);

        // Boru geÃ§ti kontrolÃ¼ ve puanlama
        if (!pipe.passed && pipe.x + PIPE_WIDTH < player.x) {
            score++;
            scoreDisplay.textContent = `Skor: ${score}`;
            pipe.passed = true;

    // YENÄ° HIZ KONTROL BLOÄU
    // Skor, hÄ±zlanma aralÄ±ÄŸÄ±nÄ±n tam katÄ± ise (Ã–rn: 10, 20, 30...)
    if (score % SPEED_INCREASE_INTERVAL === 0) {
        currentPipeSpeed += SPEED_INCREMENT;
        console.log(`Oyun HÄ±zlandÄ±! Yeni HÄ±z: ${currentPipeSpeed.toFixed(2)}`); 
        // Konsolda hÄ±zlandÄ±ÄŸÄ±nÄ± gÃ¶rebilirsiniz.
    }
}
    // Ekran dÄ±ÅŸÄ±na Ã§Ä±kan borularÄ± sil
    pipes = pipes.filter(pipe => pipe.x + PIPE_WIDTH > 0);

    // Yeni Boru OluÅŸturma
    const now = Date.now();
    if (now - lastPipeTime > PIPE_INTERVAL) {
        createPipe();
        lastPipeTime = now;
    }

    // 3. Ã‡arpÄ±ÅŸma KontrolÃ¼
    if (checkCollision()) {
        gameOver();
        return;
    }
    
    // 4. Karakteri Ã‡iz
    clearCanvas();
    pipes.forEach(drawPipe);
    drawPlayer()
    });
}

function checkCollision() {
    // 1. Zemin ve Tavan Ã‡arpÄ±ÅŸmasÄ± KontrolÃ¼
    // EÄŸer top zeminin altÄ±na (HEIGHT) veya tavanÄ±n Ã¼stÃ¼ne (0) Ã§Ä±karsa Ã§arpÄ±ÅŸma var demektir.
    if (player.y + player.height > HEIGHT ||  player.y < 0) {
        return true;
    }

    // 2. Boru Ã‡arpÄ±ÅŸmasÄ± KontrolÃ¼
    for (const pipe of pipes) {
        // Ã–nce X Ekseninde Ã‡arpÄ±ÅŸma KontrolÃ¼: Topun saÄŸ kenarÄ± borunun sol kenarÄ±ndan bÃ¼yÃ¼kse 
        // VE topun sol kenarÄ± borunun saÄŸ kenarÄ±ndan kÃ¼Ã§Ã¼kse (yani yatayda Ã¼st Ã¼ste geldilerse)
        if (player.x + player.width > pipe.x && player.x < pipe.x + PIPE_WIDTH) {
            
            // Åimdi Y Ekseninde Ã‡arpÄ±ÅŸma KontrolÃ¼:
            // Topun Ã¼st kenarÄ± Ã¼st borunun altÄ±ndan kÃ¼Ã§Ã¼kse (Ã¼st boruya Ã§arptÄ±)
            // VEYA topun alt kenarÄ± alt borunun Ã¼stÃ¼nden bÃ¼yÃ¼kse (alt boruya Ã§arptÄ±)
            if (player.y < pipe.topHeight || player.y + player.height > pipe.bottomY) {
                return true; // Ã‡arpÄ±ÅŸma var!
            }
        }
    }

    // HiÃ§bir Ã§arpÄ±ÅŸma yoksa
    return false;
}
// --- Oyun Kontrol FonksiyonlarÄ± ---

function jump() {
    if (isPlaying) {
        player.velocity = -JUMP_POWER; // Negatif hÄ±z = yukarÄ± hareket
    }
}

function startGame() {
    if (isPlaying) return;

    // Durumu sÄ±fÄ±rla
    isPlaying = true;
    score = 0;
    player.y = HEIGHT / 2;
    player.velocity = 0;
    pipes = [];
    scoreDisplay.textContent = `Skor: 0`;
    messageArea.style.display = 'none';
framesSinceStart = 0;

    // Ä°lk boruyu oluÅŸtur
    lastPipeTime = Date.now();
    createPipe();
    
    let lastTime = Date.now();
    gameInterval = setInterval(() => {
        const now = Date.now();
        const deltaTime = now - lastTime;
        updateGame(deltaTime);
        lastTime = now;
    }, 1000 / 60); // Saniyede 60 kare (FPS)
}

function gameOver() {
    clearInterval(gameInterval);
    isPlaying = false;
    messageArea.textContent = 'Oyun Bitti! Tekrar oynamak iÃ§in tÄ±kla.';
    messageArea.style.display = 'block';

    // YÃ¼ksek Skor GÃ¼ncelleme
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('cspeak_flappy_high_score', highScore);
        highScoreDisplay.textContent = `En YÃ¼ksek Skor: ${highScore}`;
    }
}

// --- Olay Dinleyicileri ---

// Oyunu baÅŸlatmak iÃ§in tÄ±klama/dokunma
messageArea.addEventListener('click', startGame);
canvas.addEventListener('click', jump);
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault(); // SayfanÄ±n kaymasÄ±nÄ± engelle
        jump();
    }
});

// BaÅŸlangÄ±Ã§ mesajÄ±nÄ± gÃ¶ster
messageArea.style.display = 'block';
