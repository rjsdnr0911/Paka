// 캔버스 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 캔버스 크기 설정
canvas.width = 800;
canvas.height = 400;

// 게임 변수
let gameSpeed = 6;
let gravity = 0.8;
let score = 0;
let highScore = localStorage.getItem('dinoHighScore') || 0;
let gameRunning = false;
let gameOver = false;

// 점수 표시 업데이트
document.getElementById('score').textContent = score;
document.getElementById('highScore').textContent = highScore;

// 공룡 객체
const dino = {
    x: 50,
    y: 0,
    width: 40,
    height: 50,
    dy: 0,
    jumpPower: -15,
    grounded: false,
    ducking: false,

    draw() {
        ctx.fillStyle = '#2c3e50';

        if (this.ducking) {
            // 숙인 자세
            ctx.fillRect(this.x, this.y + 20, this.width, this.height - 20);
            // 눈
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x + 25, this.y + 25, 5, 5);
        } else {
            // 몸통
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // 눈
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x + 25, this.y + 10, 5, 5);

            // 다리 애니메이션
            const legOffset = Math.floor(score / 5) % 2 === 0 ? 0 : 5;
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(this.x + 10, this.y + this.height, 8, 10 + legOffset);
            ctx.fillRect(this.x + 25, this.y + this.height, 8, 10 - legOffset);
        }
    },

    update() {
        // 중력 적용
        this.dy += gravity;
        this.y += this.dy;

        // 바닥 체크
        const groundY = canvas.height - 100 - (this.ducking ? this.height - 20 : this.height);
        if (this.y >= groundY) {
            this.y = groundY;
            this.dy = 0;
            this.grounded = true;
        } else {
            this.grounded = false;
        }
    },

    jump() {
        if (this.grounded) {
            this.dy = this.jumpPower;
            this.grounded = false;
        }
    },

    duck(isDucking) {
        this.ducking = isDucking && this.grounded;
    }
};

// 장애물 클래스
class Obstacle {
    constructor() {
        this.x = canvas.width;
        this.width = 30;
        this.height = 50 + Math.random() * 30;
        this.y = canvas.height - 100 - this.height;
        this.type = Math.random() > 0.5 ? 'cactus' : 'cactusSmall';

        if (this.type === 'cactusSmall') {
            this.height = 30;
            this.y = canvas.height - 100 - this.height;
        }
    }

    draw() {
        ctx.fillStyle = '#27ae60';

        if (this.type === 'cactus') {
            // 큰 선인장
            ctx.fillRect(this.x + 10, this.y, 10, this.height);
            ctx.fillRect(this.x, this.y + 10, 10, 20);
            ctx.fillRect(this.x + 20, this.y + 15, 10, 15);
        } else {
            // 작은 선인장
            ctx.fillRect(this.x + 5, this.y, 8, this.height);
            ctx.fillRect(this.x, this.y + 8, 8, 12);
            ctx.fillRect(this.x + 13, this.y + 10, 8, 10);
        }
    }

    update() {
        this.x -= gameSpeed;
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }

    collidesWith(dino) {
        const dinoHeight = dino.ducking ? dino.height - 20 : dino.height;
        const dinoY = dino.ducking ? dino.y + 20 : dino.y;

        return (
            dino.x < this.x + this.width - 5 &&
            dino.x + dino.width - 5 > this.x &&
            dinoY < this.y + this.height &&
            dinoY + dinoHeight > this.y
        );
    }
}

// 장애물 배열
let obstacles = [];
let obstacleTimer = 0;
let obstacleInterval = 90;

// 바닥 그리기
function drawGround() {
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 100);
    ctx.lineTo(canvas.width, canvas.height - 100);
    ctx.stroke();

    // 바닥 패턴
    ctx.fillStyle = '#34495e';
    for (let i = 0; i < canvas.width; i += 30) {
        const offset = (score * 2) % 30;
        ctx.fillRect(i - offset, canvas.height - 95, 10, 2);
    }
}

// 구름 그리기
const clouds = [];
for (let i = 0; i < 3; i++) {
    clouds.push({
        x: Math.random() * canvas.width,
        y: Math.random() * 150 + 20,
        width: 60 + Math.random() * 40,
        speed: 1 + Math.random()
    });
}

function drawClouds() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    clouds.forEach(cloud => {
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, 15, 0, Math.PI * 2);
        ctx.arc(cloud.x + 20, cloud.y, 20, 0, Math.PI * 2);
        ctx.arc(cloud.x + 40, cloud.y, 15, 0, Math.PI * 2);
        ctx.fill();

        cloud.x -= cloud.speed * 0.3;
        if (cloud.x < -100) {
            cloud.x = canvas.width + 50;
        }
    });
}

// 점수 업데이트
function updateScore() {
    if (gameRunning && !gameOver) {
        score++;
        document.getElementById('score').textContent = Math.floor(score / 10);

        // 점수에 따라 속도 증가
        if (score % 300 === 0) {
            gameSpeed += 0.5;
            obstacleInterval = Math.max(60, obstacleInterval - 5);
        }
    }
}

// 충돌 체크
function checkCollisions() {
    for (let obstacle of obstacles) {
        if (obstacle.collidesWith(dino)) {
            endGame();
        }
    }
}

// 게임 종료
function endGame() {
    gameOver = true;
    gameRunning = false;

    const finalScore = Math.floor(score / 10);
    document.getElementById('finalScore').textContent = finalScore;
    document.getElementById('gameOver').classList.remove('hidden');

    // 최고 점수 업데이트
    if (finalScore > highScore) {
        highScore = finalScore;
        localStorage.setItem('dinoHighScore', highScore);
        document.getElementById('highScore').textContent = highScore;
    }
}

// 게임 시작
function startGame() {
    gameRunning = true;
    gameOver = false;
    score = 0;
    gameSpeed = 6;
    obstacleInterval = 90;
    obstacles = [];
    obstacleTimer = 0;
    dino.y = 0;
    dino.dy = 0;
    document.getElementById('gameOver').classList.add('hidden');
    document.getElementById('score').textContent = 0;
}

// 게임 루프
function gameLoop() {
    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 배경 요소 그리기
    drawClouds();
    drawGround();

    if (gameRunning) {
        // 공룡 업데이트 및 그리기
        dino.update();
        dino.draw();

        // 장애물 생성
        obstacleTimer++;
        if (obstacleTimer > obstacleInterval) {
            obstacles.push(new Obstacle());
            obstacleTimer = 0;
        }

        // 장애물 업데이트 및 그리기
        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].update();
            obstacles[i].draw();

            // 화면 밖으로 나간 장애물 제거
            if (obstacles[i].isOffScreen()) {
                obstacles.splice(i, 1);
            }
        }

        // 충돌 체크
        checkCollisions();

        // 점수 업데이트
        updateScore();
    } else if (!gameOver) {
        // 게임 시작 전
        dino.y = canvas.height - 100 - dino.height;
        dino.draw();

        ctx.fillStyle = '#2c3e50';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('스페이스바를 눌러 시작하세요!', canvas.width / 2, canvas.height / 2);
    }

    requestAnimationFrame(gameLoop);
}

// 키보드 이벤트
let keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    if ((e.code === 'Space' || e.code === 'ArrowUp') && !gameOver) {
        e.preventDefault();
        if (!gameRunning) {
            startGame();
        } else {
            dino.jump();
        }
    }

    if (e.code === 'ArrowDown' && gameRunning) {
        e.preventDefault();
        dino.duck(true);
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;

    if (e.code === 'ArrowDown') {
        dino.duck(false);
    }
});

// 터치/클릭 이벤트 (모바일 지원)
canvas.addEventListener('click', () => {
    if (!gameRunning && !gameOver) {
        startGame();
    } else if (gameRunning) {
        dino.jump();
    }
});

// 재시작 버튼
document.getElementById('restartBtn').addEventListener('click', () => {
    startGame();
});

// 게임 시작
gameLoop();
