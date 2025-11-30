const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const highScoreDisplay = document.getElementById('high-score-display');
const messageArea = document.getElementById('message-area');
// ... (const canvas, ctx, scoreDisplay gibi tanımlamaların altına)

// Karakter görselini yükle
const playerSprite = new Image();
playerSprite.src = 'player_sprite.png'; // Klasördeki görselinizin adı

// Karakterin genişlik ve yüksekliğini belirle (Görselin boyutlarına göre ayarlayın)
// Yüklediğiniz görsel 40x40 piksel civarı olabilir, buna göre ayarladım
const PLAYER_WIDTH = 40; 
const PLAYER_HEIGHT = 40;
// Oyun Ayarları
const WIDTH = 600;
const HEIGHT = 400;
const JUMP_POWER = 3.7;
const GRAVITY = 0.28;
const PIPE_WIDTH = 50;
const PIPE_GAP = 110;
const PIPE_INTERVAL = 1800; // Boru oluşturma aralığı (ms)
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

// Oyun Hızı Ayarları
let currentPipeSpeed = 2; // Başlangıç hızı (Daha önce 2'ydi, şimdi değişken oldu)
const SPEED_INCREASE_INTERVAL = 3; // Kaç puanda bir hızlanacağı (Örn: Her 3 puanda bir)
const SPEED_INCREMENT = 0.2; // Her hızlanmada hıza ne kadar ekleneceği

// Oyun Durumu
let isPlaying = false;
let score = 0;
let highScore = localStorage.getItem('cspeak_flappy_high_score') || 0;
let pipes = [];
let lastPipeTime = 0;
let gameInterval;
const GRAVITY_DELAY_FRAMES = 30;
let framesSinceStart = 0;

highScoreDisplay.textContent = `En Yüksek Skor: ${highScore}`;

// --- Çizim Fonksiyonları ---

function drawPlayer() {
    // Görseli çiz: (görsel, x, y, genişlik, yükseklik)
    ctx.drawImage(playerSprite, player.x, player.y, player.width, player.height);
}

function drawPipe(pipe) {
    ctx.fillStyle = '#ff8c00'; // Turuncu
    // Üst Boru
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
    // Alt Boru
    ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, HEIGHT - pipe.bottomY);
}

function clearCanvas() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
}

// --- Oyun Mekaniği ---

function createPipe() {
   let currentGap = PIPE_GAP;
if (score < EASY_PIPE_COUNT) {
currentGap = EASY_PIPE_GAP;
}
// Rastgele boşluk yüksekliği belirle
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
    // 1. Oyuncu Hareketini Güncelle
if (framesSinceStart > GRAVITY_DELAY_FRAMES) {    
player.velocity += GRAVITY; // Yerçekimi
}
    player.y += player.velocity;;

    // 2. Boru Hareketini ve Çizimini Güncelle
    pipes.forEach(pipe => {
        pipe.x -= currentPipeSpeed; // Boruyu sola hareket ettir
        drawPipe(pipe);

        // Boru geçti kontrolü ve puanlama
        if (!pipe.passed && pipe.x + PIPE_WIDTH < player.x) {
            score++;
            scoreDisplay.textContent = `Skor: ${score}`;
            pipe.passed = true;

    // YENİ HIZ KONTROL BLOĞU
    // Skor, hızlanma aralığının tam katı ise (Örn: 10, 20, 30...)
    if (score % SPEED_INCREASE_INTERVAL === 0) {
        currentPipeSpeed += SPEED_INCREMENT;
        console.log(`Oyun Hızlandı! Yeni Hız: ${currentPipeSpeed.toFixed(2)}`); 
        // Konsolda hızlandığını görebilirsiniz.
    }
}
    // Ekran dışına çıkan boruları sil
    pipes = pipes.filter(pipe => pipe.x + PIPE_WIDTH > 0);

    // Yeni Boru Oluşturma
    const now = Date.now();
    if (now - lastPipeTime > PIPE_INTERVAL) {
        createPipe();
        lastPipeTime = now;
    }

    // 3. Çarpışma Kontrolü
    if (checkCollision()) {
        gameOver();
        return;
    }
    
    // 4. Karakteri Çiz
    clearCanvas();
    pipes.forEach(drawPipe);
    drawPlayer()
    });
}

function checkCollision() {
    // 1. Zemin ve Tavan Çarpışması Kontrolü
    // Eğer top zeminin altına (HEIGHT) veya tavanın üstüne (0) çıkarsa çarpışma var demektir.
    if (player.y + player.height > HEIGHT ||  player.y < 0) {
        return true;
    }

    // 2. Boru Çarpışması Kontrolü
    for (const pipe of pipes) {
        // Önce X Ekseninde Çarpışma Kontrolü: Topun sağ kenarı borunun sol kenarından büyükse 
        // VE topun sol kenarı borunun sağ kenarından küçükse (yani yatayda üst üste geldilerse)
        if (player.x + player.width > pipe.x && player.x < pipe.x + PIPE_WIDTH) {
            
            // Şimdi Y Ekseninde Çarpışma Kontrolü:
            // Topun üst kenarı üst borunun altından küçükse (üst boruya çarptı)
            // VEYA topun alt kenarı alt borunun üstünden büyükse (alt boruya çarptı)
            if (player.y < pipe.topHeight || player.y + player.height > pipe.bottomY) {
                return true; // Çarpışma var!
            }
        }
    }

    // Hiçbir çarpışma yoksa
    return false;
}
// --- Oyun Kontrol Fonksiyonları ---

function jump() {
    if (isPlaying) {
        player.velocity = -JUMP_POWER; // Negatif hız = yukarı hareket
    }
}

function startGame() {
    if (isPlaying) return;

    // Durumu sıfırla
    isPlaying = true;
    score = 0;
    player.y = HEIGHT / 2;
    player.velocity = 0;
    pipes = [];
    scoreDisplay.textContent = `Skor: 0`;
    messageArea.style.display = 'none';
framesSinceStart = 0;

    // İlk boruyu oluştur
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
    messageArea.textContent = 'Oyun Bitti! Tekrar oynamak için tıkla.';
    messageArea.style.display = 'block';

    // Yüksek Skor Güncelleme
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('cspeak_flappy_high_score', highScore);
        highScoreDisplay.textContent = `En Yüksek Skor: ${highScore}`;
    }
}

// --- Olay Dinleyicileri ---

// Oyunu başlatmak için tıklama/dokunma
messageArea.addEventListener('click', startGame);
canvas.addEventListener('click', jump);
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault(); // Sayfanın kaymasını engelle
        jump();
    }
});

// Başlangıç mesajını göster
messageArea.style.display = 'block';
