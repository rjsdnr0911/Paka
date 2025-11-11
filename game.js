// 캔버스 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 600;
canvas.height = 150;

// 게임 변수
let gameSpeed = 6;
let gravity = 0.6;
let score = 0;
let highScore = localStorage.getItem('dinoHighScore') || 0;
let gameRunning = false;
let gameOver = false;
let lives = 3;
let invincible = false;
let invincibleTimer = 0;

// 공룡 객체
const dino = {
    x: 25,
    y: 0,
    width: 44,
    height: 47,
    dy: 0,
    jumpPower: -10,
    grounded: false,
    ducking: false,

    draw() {
        ctx.fillStyle = '#535353';

        if (this.ducking) {
            // 숙인 자세 - 심플한 직사각형
            ctx.fillRect(this.x, this.y + 25, this.width, 22);
        } else {
            // 일반 자세
            // 머리
            ctx.fillRect(this.x + 22, this.y, 22, 22);
            // 눈
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x + 30, this.y + 6, 6, 6);

            // 몸통
            ctx.fillStyle = '#535353';
            ctx.fillRect(this.x + 15, this.y + 22, 29, 25);

            // 팔
            ctx.fillRect(this.x + 15, this.y + 22, 8, 15);

            // 다리
            const legOffset = (Math.floor(score / 5) % 2) * 4;
            ctx.fillRect(this.x + 16, this.y + 42, 7, 10 + legOffset);
            ctx.fillRect(this.x + 30, this.y + 42, 7, 10 - legOffset);

            // 꼬리
            ctx.fillRect(this.x, this.y + 25, 16, 10);
        }
    },

    update() {
        this.dy += gravity;
        this.y += this.dy;

        const groundY = 97 - (this.ducking ? 22 : this.height);
        if (this.y >= groundY) {
            this.y = groundY;
            this.dy = 0;
            this.grounded = true;
        } else {
            this.grounded = false;
        }
    },

    jump() {
        if (this.grounded && !this.ducking) {
            this.dy = this.jumpPower;
            this.grounded = false;
        }
    },

    duck(isDucking) {
        if (this.grounded) {
            this.ducking = isDucking;
        }
    },

    getHitbox() {
        if (this.ducking) {
            return { x: this.x + 4, y: this.y + 25, width: this.width - 8, height: 22 };
        }
        return { x: this.x + 4, y: this.y + 4, width: this.width - 8, height: this.height - 8 };
    }
};

// 장애물 클래스
class Obstacle {
    constructor(type) {
        this.x = canvas.width;
        this.passed = false;

        if (type === 'bird') {
            this.type = 'bird';
            this.width = 40;
            this.height = 30;
            this.y = 60;
            this.frame = 0;
        } else {
            this.type = type || (Math.random() > 0.5 ? 'cactus' : 'cactus2');

            if (this.type === 'cactus') {
                this.width = 17;
                this.height = 35;
            } else if (this.type === 'cactus2') {
                this.width = 34;
                this.height = 35;
            }

            this.y = 97 - this.height;
        }
    }

    draw() {
        ctx.fillStyle = '#535353';

        if (this.type === 'bird') {
            // 새 - 매우 심플
            // 몸
            ctx.fillRect(this.x + 10, this.y + 10, 20, 10);
            // 날개 (애니메이션)
            const wingY = (Math.floor(this.frame) % 10 < 5) ? this.y : this.y + 5;
            ctx.fillRect(this.x, wingY, 12, 8);
            ctx.fillRect(this.x + 28, wingY, 12, 8);
            this.frame += 0.2;
        } else if (this.type === 'cactus') {
            // 단일 선인장
            ctx.fillRect(this.x + 4, this.y, 9, this.height);
            ctx.fillRect(this.x, this.y + 12, 8, 15);
        } else if (this.type === 'cactus2') {
            // 더블 선인장
            ctx.fillRect(this.x + 4, this.y, 9, this.height);
            ctx.fillRect(this.x, this.y + 12, 8, 15);
            ctx.fillRect(this.x + 21, this.y, 9, this.height);
            ctx.fillRect(this.x + 26, this.y + 12, 8, 15);
        }
    }

    update() {
        this.x -= gameSpeed;
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }

    collidesWith(dino) {
        const dinoBox = dino.getHitbox();
        const obsBox = { x: this.x + 2, y: this.y + 2, width: this.width - 4, height: this.height - 4 };

        return (
            dinoBox.x < obsBox.x + obsBox.width &&
            dinoBox.x + dinoBox.width > obsBox.x &&
            dinoBox.y < obsBox.y + obsBox.height &&
            dinoBox.y + dinoBox.height > obsBox.y
        );
    }
}

// 구름 클래스
class Cloud {
    constructor() {
        this.x = canvas.width + Math.random() * 100;
        this.y = Math.random() * 50 + 10;
        this.width = 46;
        this.height = 14;
    }

    draw() {
        ctx.fillStyle = '#c9c9c9';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillRect(this.x + 10, this.y - 5, 26, 5);
    }

    update() {
        this.x -= gameSpeed * 0.2;
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }
}

// 게임 객체
let obstacles = [];
let clouds = [];
let obstacleTimer = 0;
let obstacleInterval = 75;
let cloudTimer = 0;

// 초기 구름 생성
for (let i = 0; i < 3; i++) {
    const cloud = new Cloud();
    cloud.x = Math.random() * canvas.width;
    clouds.push(cloud);
}

// 점수 그리기
function drawScore() {
    const scoreText = Math.floor(score).toString().padStart(5, '0');
    const hiText = 'HI ' + highScore.toString().padStart(5, '0');

    ctx.fillStyle = '#535353';
    ctx.font = '12px "Courier New", monospace';
    ctx.textAlign = 'right';

    // 최고 점수
    ctx.fillText(hiText, canvas.width - 80, 20);
    // 현재 점수
    ctx.fillText(scoreText, canvas.width - 10, 20);
}

// 하트 그리기 (픽셀아트 스타일)
function drawHearts() {
    const heartSize = 2; // 픽셀 크기
    const startX = 10;
    const startY = 12;
    const spacing = 30;

    ctx.fillStyle = '#535353';

    for (let i = 0; i < 3; i++) {
        const x = startX + i * spacing;
        const y = startY;

        if (i < lives) {
            // 채워진 하트
            ctx.fillStyle = invincible && invincibleTimer % 10 < 5 ? '#c9c9c9' : '#535353';
        } else {
            // 빈 하트 (외곽선만)
            ctx.fillStyle = '#c9c9c9';
        }

        // 하트 모양 픽셀아트
        // 상단 두 개의 원
        ctx.fillRect(x + heartSize * 1, y, heartSize * 2, heartSize);
        ctx.fillRect(x + heartSize * 4, y, heartSize * 2, heartSize);

        // 중간 넓은 부분
        ctx.fillRect(x, y + heartSize, heartSize * 7, heartSize);
        ctx.fillRect(x, y + heartSize * 2, heartSize * 7, heartSize);

        // 아래로 좁아지는 부분
        ctx.fillRect(x + heartSize, y + heartSize * 3, heartSize * 5, heartSize);
        ctx.fillRect(x + heartSize * 2, y + heartSize * 4, heartSize * 3, heartSize);
        ctx.fillRect(x + heartSize * 3, y + heartSize * 5, heartSize, heartSize);

        // 빈 하트인 경우 내부를 흰색으로
        if (i >= lives) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(x + heartSize * 2, y + heartSize, heartSize, heartSize);
            ctx.fillRect(x + heartSize * 4, y + heartSize, heartSize, heartSize);
            ctx.fillRect(x + heartSize * 1, y + heartSize * 2, heartSize * 5, heartSize);
            ctx.fillRect(x + heartSize * 2, y + heartSize * 3, heartSize * 3, heartSize);
            ctx.fillRect(x + heartSize * 3, y + heartSize * 4, heartSize, heartSize);
        }
    }
}

// 바닥 그리기
function drawGround() {
    ctx.strokeStyle = '#535353';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 97);
    ctx.lineTo(canvas.width, 97);
    ctx.stroke();

    // 바닥 패턴
    const offset = Math.floor(score * 2) % 20;
    ctx.fillStyle = '#535353';
    for (let i = -offset; i < canvas.width; i += 20) {
        ctx.fillRect(i, 99, 10, 2);
    }
}

// 게임 오버 텍스트
function drawGameOver() {
    ctx.fillStyle = '#535353';
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('G A M E  O V E R', canvas.width / 2, 40);

    ctx.font = '10px "Courier New", monospace';
    ctx.fillText('Press SPACE to restart', canvas.width / 2, 55);

    // 재시작 아이콘 (↻)
    ctx.font = '20px Arial';
    ctx.fillText('↻', canvas.width / 2, 75);
}

// 시작 화면
function drawStartScreen() {
    ctx.fillStyle = '#535353';
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Press SPACE to start', canvas.width / 2, 60);
}

// 장애물 생성
function spawnObstacle() {
    const rand = Math.random();
    let type;

    if (rand < 0.1 && score > 100) {
        type = 'bird';
    } else if (rand < 0.5) {
        type = 'cactus';
    } else {
        type = 'cactus2';
    }

    obstacles.push(new Obstacle(type));
}

// 게임 업데이트
function update() {
    if (!gameRunning || gameOver) return;

    // 공룡 업데이트
    dino.update();

    // 무적 타이머 업데이트
    if (invincible) {
        invincibleTimer++;
        if (invincibleTimer > 60) { // 약 1초 무적
            invincible = false;
            invincibleTimer = 0;
        }
    }

    // 점수 증가
    score += 0.1;

    // 속도 증가
    if (Math.floor(score) % 100 === 0 && Math.floor(score) > 0) {
        gameSpeed += 0.5;
        obstacleInterval = Math.max(50, obstacleInterval - 5);
    }

    // 장애물 생성
    obstacleTimer++;
    if (obstacleTimer > obstacleInterval) {
        spawnObstacle();
        obstacleTimer = 0;
    }

    // 장애물 업데이트
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].update();

        // 충돌 체크 (무적 상태가 아닐 때만)
        if (!invincible && obstacles[i].collidesWith(dino) && !obstacles[i].passed) {
            obstacles[i].passed = true; // 중복 충돌 방지
            lives--;

            if (lives <= 0) {
                // 게임 오버
                gameOver = true;
                const finalScore = Math.floor(score);
                if (finalScore > highScore) {
                    highScore = finalScore;
                    localStorage.setItem('dinoHighScore', highScore);
                }
            } else {
                // 하트가 남아있으면 무적 시간 부여
                invincible = true;
                invincibleTimer = 0;
            }
        }

        // 화면 밖으로 나간 장애물 제거
        if (obstacles[i].isOffScreen()) {
            obstacles.splice(i, 1);
        }
    }

    // 구름 업데이트
    cloudTimer++;
    if (cloudTimer > 200) {
        clouds.push(new Cloud());
        cloudTimer = 0;
    }

    for (let i = clouds.length - 1; i >= 0; i--) {
        clouds[i].update();
        if (clouds[i].isOffScreen()) {
            clouds.splice(i, 1);
        }
    }
}

// 게임 그리기
function draw() {
    // 배경 (흰색)
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 구름
    clouds.forEach(cloud => cloud.draw());

    // 바닥
    drawGround();

    // 점수
    drawScore();

    // 하트
    drawHearts();

    if (gameRunning && !gameOver) {
        // 공룡 (무적 상태면 깜빡임)
        if (!invincible || invincibleTimer % 6 < 3) {
            dino.draw();
        }

        // 장애물
        obstacles.forEach(obstacle => obstacle.draw());
    } else if (gameOver) {
        // 공룡 (죽은 상태)
        dino.draw();
        obstacles.forEach(obstacle => obstacle.draw());
        drawGameOver();
    } else {
        // 시작 화면
        dino.y = 97 - dino.height;
        dino.draw();
        drawStartScreen();
    }
}

// 게임 리셋
function resetGame() {
    dino.y = 0;
    dino.dy = 0;
    dino.ducking = false;
    dino.grounded = false;
    score = 0;
    gameSpeed = 6;
    obstacles = [];
    obstacleTimer = 0;
    obstacleInterval = 75;
    gameOver = false;
    gameRunning = true;
    lives = 3;
    invincible = false;
    invincibleTimer = 0;
}

// 게임 루프
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// 키보드 이벤트
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!gameRunning) {
            resetGame();
        } else if (gameOver) {
            resetGame();
        } else {
            dino.jump();
        }
    }

    if (e.code === 'ArrowDown' && gameRunning && !gameOver) {
        e.preventDefault();
        dino.duck(true);
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowDown') {
        dino.duck(false);
    }
});

// 터치 이벤트 (모바일)
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gameRunning || gameOver) {
        resetGame();
    } else {
        dino.jump();
    }
});

// 게임 시작
dino.y = 97 - dino.height;
gameLoop();
