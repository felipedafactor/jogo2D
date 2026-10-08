const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const livesElement = document.getElementById("lives");

const gameMessage = document.getElementById("gameMessage");
const messageTitle = document.getElementById("messageTitle");
const messageText = document.getElementById("messageText");
const restartButton = document.getElementById("restartButton");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// ==============================
// CONFIGURAÇÕES
// ==============================

const gravity = 0.65;
const playerSpeed = 5;
const jumpForce = -13;

let score = 0;
let lives = 3;

let gameRunning = true;
let levelCompleted = false;

const keys = {};

// ==============================
// JOGADOR
// ==============================

const player = {
    x: 80,
    y: 350,

    width: 38,
    height: 48,

    velocityX: 0,
    velocityY: 0,

    color: "#38bdf8",

    onGround: false,

    invincible: 0
};

// ==============================
// PLATAFORMAS
// ==============================

const platforms = [
    {
        x: 0,
        y: 500,
        width: 960,
        height: 40
    },

    {
        x: 130,
        y: 410,
        width: 160,
        height: 25
    },

    {
        x: 360,
        y: 350,
        width: 150,
        height: 25
    },

    {
        x: 590,
        y: 410,
        width: 140,
        height: 25
    },

    {
        x: 760,
        y: 320,
        width: 140,
        height: 25
    }
];

// ==============================
// MOEDAS
// ==============================

let coins = [
    {
        x: 200,
        y: 370,
        radius: 10,
        collected: false
    },

    {
        x: 430,
        y: 310,
        radius: 10,
        collected: false
    },

    {
        x: 660,
        y: 370,
        radius: 10,
        collected: false
    },

    {
        x: 830,
        y: 280,
        radius: 10,
        collected: false
    }
];

// ==============================
// INIMIGOS
// ==============================

let enemies = [
    {
        x: 300,
        y: 455,

        width: 35,
        height: 45,

        velocityX: 2,

        minX: 250,
        maxX: 470,

        color: "#ef4444"
    },

    {
        x: 610,
        y: 365,

        width: 35,
        height: 45,

        velocityX: 1.7,

        minX: 590,
        maxX: 700,

        color: "#f97316"
    }
];

// ==============================
// PORTAL FINAL
// ==============================

const portal = {
    x: 875,
    y: 255,

    width: 35,
    height: 65,

    active: false
};

// ==============================
// CONTROLES
// ==============================

window.addEventListener("keydown", (event) => {

    keys[event.code] = true;

    if (
        event.code === "Space" ||
        event.code === "ArrowUp" ||
        event.code === "KeyW"
    ) {
        event.preventDefault();

        jump();
    }

});

window.addEventListener("keyup", (event) => {
    keys[event.code] = false;
});

// ==============================
// PULO
// ==============================

function jump() {

    if (!gameRunning) return;

    if (player.onGround) {

        player.velocityY = jumpForce;

        player.onGround = false;
    }
}

// ==============================
// COLISÃO
// ==============================

function collision(a, b) {

    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

// ==============================
// ATUALIZAR JOGADOR
// ==============================

function updatePlayer() {

    player.velocityX = 0;

    if (keys["ArrowLeft"] || keys["KeyA"]) {
        player.velocityX = -playerSpeed;
    }

    if (keys["ArrowRight"] || keys["KeyD"]) {
        player.velocityX = playerSpeed;
    }

    player.velocityY += gravity;

    player.x += player.velocityX;

    player.y += player.velocityY;

    // Limites laterais

    if (player.x < 0) {
        player.x = 0;
    }

    if (player.x + player.width > WIDTH) {
        player.x = WIDTH - player.width;
    }

    // Colisão com plataformas

    player.onGround = false;

    for (const platform of platforms) {

        if (
            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y + player.height >= platform.y &&
            player.y + player.height <= platform.y + platform.height &&
            player.velocityY >= 0
        ) {

            player.y = platform.y - player.height;

            player.velocityY = 0;

            player.onGround = true;
        }
    }

    // Caiu no abismo

    if (player.y > HEIGHT + 100) {

        loseLife();
    }

    if (player.invincible > 0) {
        player.invincible--;
    }
}

// ==============================
// ATUALIZAR INIMIGOS
// ==============================

function updateEnemies() {

    for (const enemy of enemies) {

        enemy.x += enemy.velocityX;

        if (
            enemy.x <= enemy.minX ||
            enemy.x + enemy.width >= enemy.maxX
        ) {
            enemy.velocityX *= -1;
        }

        if (
            collision(player, enemy) &&
            player.invincible <= 0
        ) {

            loseLife();
        }
    }
}

// ==============================
// COLETAR MOEDAS
// ==============================

function updateCoins() {

    for (const coin of coins) {

        if (coin.collected) continue;

        const coinBox = {
            x: coin.x - coin.radius,
            y: coin.y - coin.radius,

            width: coin.radius * 2,
            height: coin.radius * 2
        };

        if (collision(player, coinBox)) {

            coin.collected = true;

            score += 100;

            updateHUD();
        }
    }
}

// ==============================
// PORTAL
// ==============================

function updatePortal() {

    const allCoinsCollected =
        coins.every(coin => coin.collected);

    portal.active = allCoinsCollected;

    if (
        portal.active &&
        collision(player, portal)
    ) {

        completeLevel();
    }
}

// ==============================
// PERDER VIDA
// ==============================

function loseLife() {

    if (!gameRunning) return;

    lives--;

    updateHUD();

    player.invincible = 120;

    player.x = 80;
    player.y = 350;

    player.velocityX = 0;
    player.velocityY = 0;

    if (lives <= 0) {

        gameOver();
    }
}

// ==============================
// GAME OVER
// ==============================

function gameOver() {

    gameRunning = false;

    messageTitle.textContent = "💀 Game Over";

    messageText.textContent =
        `Sua pontuação foi ${score} pontos.`;

    restartButton.textContent = "Jogar novamente";

    gameMessage.classList.remove("hidden");
}

// ==============================
// FINAL DA FASE
// ==============================

function completeLevel() {

    gameRunning = false;
    levelCompleted = true;

    score += 500;

    updateHUD();

    messageTitle.textContent = "🏆 Vitória!";

    messageText.textContent =
        `Você terminou a fase com ${score} pontos!`;

    restartButton.textContent = "Jogar novamente";

    gameMessage.classList.remove("hidden");
}

// ==============================
// HUD
// ==============================

function updateHUD() {

    scoreElement.textContent = score;
    livesElement.textContent = lives;
}

// ==============================
// REINICIAR
// ==============================

function restartGame() {

    score = 0;
    lives = 3;

    gameRunning = true;
    levelCompleted = false;

    player.x = 80;
    player.y = 350;

    player.velocityX = 0;
    player.velocityY = 0;

    player.invincible = 0;

    coins.forEach(coin => {
        coin.collected = false;
    });

    enemies[0].x = 300;
    enemies[1].x = 610;

    portal.active = false;

    gameMessage.classList.add("hidden");

    updateHUD();
}

restartButton.addEventListener("click", restartGame);

// ==============================
// DESENHAR FUNDO
// ==============================

function drawBackground() {

    const gradient = ctx.createLinearGradient(
        0,
        0,
        0,
        HEIGHT
    );

    gradient.addColorStop(0, "#172554");
    gradient.addColorStop(0.55, "#2563eb");
    gradient.addColorStop(1, "#0f172a");

    ctx.fillStyle = gradient;

    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Lua

    ctx.fillStyle = "#fef3c7";

    ctx.beginPath();

    ctx.arc(
        820,
        90,
        45,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Estrelas

    ctx.fillStyle = "#ffffff";

    const stars = [
        [80, 80],
        [170, 120],
        [290, 65],
        [420, 100],
        [550, 55],
        [690, 120],
        [900, 70]
    ];

    for (const star of stars) {

        ctx.fillRect(
            star[0],
            star[1],
            3,
            3
        );
    }

    // Montanhas

    ctx.fillStyle = "#172554";

    ctx.beginPath();

    ctx.moveTo(0, 400);

    ctx.lineTo(160, 230);
    ctx.lineTo(300, 400);

    ctx.lineTo(470, 210);
    ctx.lineTo(650, 400);

    ctx.lineTo(790, 240);
    ctx.lineTo(960, 400);

    ctx.lineTo(960, 540);
    ctx.lineTo(0, 540);

    ctx.closePath();

    ctx.fill();
}

// ==============================
// DESENHAR PLATAFORMAS
// ==============================

function drawPlatforms() {

    for (const platform of platforms) {

        ctx.fillStyle = "#334155";

        ctx.fillRect(
            platform.x,
            platform.y,
            platform.width,
            platform.height
        );

        ctx.fillStyle = "#22c55e";

        ctx.fillRect(
            platform.x,
            platform.y,
            platform.width,
            7
        );
    }
}

// ==============================
// DESENHAR JOGADOR
// ==============================

function drawPlayer() {

    if (
        player.invincible > 0 &&
        Math.floor(player.invincible / 8) % 2 === 0
    ) {
        return;
    }

    // Corpo

    ctx.fillStyle = player.color;

    ctx.fillRect(
        player.x,
        player.y,
        player.width,
        player.height
    );

    // Capacete

    ctx.fillStyle = "#e0f2fe";

    ctx.fillRect(
        player.x + 5,
        player.y + 5,
        player.width - 10,
        13
    );

    // Olhos

    ctx.fillStyle = "#0f172a";

    ctx.fillRect(
        player.x + 9,
        player.y + 9,
        5,
        5
    );

    ctx.fillRect(
        player.x + 24,
        player.y + 9,
        5,
        5
    );

    // Pernas

    ctx.fillStyle = "#1e3a8a";

    ctx.fillRect(
        player.x + 5,
        player.y + 38,
        10,
        10
    );

    ctx.fillRect(
        player.x + 23,
        player.y + 38,
        10,
        10
    );
}

// ==============================
// DESENHAR MOEDAS
// ==============================

function drawCoins() {

    for (const coin of coins) {

        if (coin.collected) continue;

        ctx.fillStyle = "#facc15";

        ctx.beginPath();

        ctx.arc(
            coin.x,
            coin.y,
            coin.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.strokeStyle = "#fef08a";

        ctx.lineWidth = 3;

        ctx.stroke();

        ctx.fillStyle = "#fff7ed";

        ctx.font = "bold 10px Arial";

        ctx.textAlign = "center";

        ctx.fillText(
            "$",
            coin.x,
            coin.y + 4
        );
    }
}

// ==============================
// DESENHAR INIMIGOS
// ==============================

function drawEnemies() {

    for (const enemy of enemies) {

        ctx.fillStyle = enemy.color;

        ctx.fillRect(
            enemy.x,
            enemy.y,
            enemy.width,
            enemy.height
        );

        // Olhos

        ctx.fillStyle = "#ffffff";

        ctx.fillRect(
            enemy.x + 7,
            enemy.y + 10,
            8,
            8
        );

        ctx.fillRect(
            enemy.x + 20,
            enemy.y + 10,
            8,
            8
        );

        ctx.fillStyle = "#111827";

        ctx.fillRect(
            enemy.x + 10,
            enemy.y + 13,
            4,
            4
        );

        ctx.fillRect(
            enemy.x + 23,
            enemy.y + 13,
            4,
            4
        );
    }
}

// ==============================
// DESENHAR PORTAL
// ==============================

function drawPortal() {

    if (!portal.active) {

        ctx.fillStyle = "#475569";

        ctx.fillRect(
            portal.x,
            portal.y,
            portal.width,
            portal.height
        );

        ctx.fillStyle = "#94a3b8";

        ctx.font = "bold 11px Arial";

        ctx.textAlign = "center";

        ctx.fillText(
            "COLETE",
            portal.x + portal.width / 2,
            portal.y - 10
        );

        ctx.fillText(
            "TUDO",
            portal.x + portal.width / 2,
            portal.y + portal.height + 16
        );

        return;
    }

    const gradient = ctx.createLinearGradient(
        portal.x,
        portal.y,
        portal.x + portal.width,
        portal.y + portal.height
    );

    gradient.addColorStop(0, "#a855f7");
    gradient.addColorStop(0.5, "#22d3ee");
    gradient.addColorStop(1, "#ec4899");

    ctx.fillStyle = gradient;

    ctx.fillRect(
        portal.x,
        portal.y,
        portal.width,
        portal.height
    );

    ctx.strokeStyle = "#ffffff";

    ctx.lineWidth = 3;

    ctx.strokeRect(
        portal.x,
        portal.y,
        portal.width,
        portal.height
    );
}

// ==============================
// DESENHAR TUDO
// ==============================

function draw() {

    drawBackground();

    drawPlatforms();

    drawPortal();

    drawCoins();

    drawEnemies();

    drawPlayer();
}

// ==============================
// LOOP PRINCIPAL
// ==============================

function gameLoop() {

    if (gameRunning) {

        updatePlayer();

        updateEnemies();

        updateCoins();

        updatePortal();
    }

    draw();

    requestAnimationFrame(gameLoop);
}

// ==============================
// INICIAR
// ==============================

updateHUD();

gameLoop();