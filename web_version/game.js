// 캔버스 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 원본 캔버스 크기
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 200;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// 스프라이트 이미지 로드
const spriteImage = new Image();
let spriteLoaded = false;
spriteImage.onload = () => {
    spriteLoaded = true;
    console.log('Sprite image loaded successfully!');
};
spriteImage.src = 'sprite.png';

// 스프라이트 좌표 (Chrome 공룡 게임 표준)
const SPRITES = {
    DINO: {
        STAND_1: { x: 936, y: 2, w: 44, h: 47 },    // 달리기 프레임 1
        STAND_2: { x: 980, y: 2, w: 44, h: 47 },    // 달리기 프레임 2
        DUCK_1: { x: 1112, y: 19, w: 59, h: 30 },   // 숙이기 프레임 1
        DUCK_2: { x: 1171, y: 19, w: 59, h: 30 },   // 숙이기 프레임 2
        DEAD: { x: 1024, y: 2, w: 44, h: 47 }       // 죽은 모습
    },
    BIRD: {
        FLY_1: { x: 134, y: 2, w: 46, h: 40 },      // 새 프레임 1
        FLY_2: { x: 180, y: 2, w: 46, h: 40 }       // 새 프레임 2
    },
    CACTUS: {
        SMALL: { x: 228, y: 2, w: 17, h: 35 },      // 작은 선인장
        LARGE: { x: 245, y: 2, w: 25, h: 50 },      // 큰 선인장
        DOUBLE: { x: 270, y: 2, w: 34, h: 50 },     // 더블 선인장
        TRIPLE: { x: 304, y: 2, w: 51, h: 50 }      // 트리플 선인장
    },
    CLOUD: { x: 86, y: 2, w: 46, h: 14 },           // 구름
    RESTART: { x: 2, y: 2, w: 36, h: 32 },          // 재시작 버튼
    TEXT: {
        GAME_OVER: { x: 655, y: 14, w: 191, h: 11 } // "GAME OVER" 텍스트
    },
    NUMBERS: [
        { x: 655, y: 2, w: 10, h: 13 },   // 0
        { x: 665, y: 2, w: 10, h: 13 },   // 1
        { x: 675, y: 2, w: 10, h: 13 },   // 2
        { x: 685, y: 2, w: 10, h: 13 },   // 3
        { x: 695, y: 2, w: 10, h: 13 },   // 4
        { x: 705, y: 2, w: 10, h: 13 },   // 5
        { x: 715, y: 2, w: 10, h: 13 },   // 6
        { x: 725, y: 2, w: 10, h: 13 },   // 7
        { x: 735, y: 2, w: 10, h: 13 },   // 8
        { x: 745, y: 2, w: 10, h: 13 }    // 9
    ],
    HI: { x: 755, y: 2, w: 20, h: 13 }    // "HI" 텍스트
};

// 모바일 대응 스케일링 변수
let scale = 1;
let offsetX = 0;
let offsetY = 0;

// 캔버스 크기 조정 함수
function resizeCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.offsetWidth;
    const containerHeight = window.innerHeight;

    // 가로 기준 스케일 계산
    const scaleX = containerWidth / CANVAS_WIDTH;
    // 세로 기준 스케일 계산 (여유 공간 고려)
    const scaleY = (containerHeight * 0.8) / CANVAS_HEIGHT;

    // 더 작은 스케일 사용 (비율 유지)
    scale = Math.min(scaleX, scaleY, 1);

    // 캔버스 표시 크기 설정
    canvas.style.width = (CANVAS_WIDTH * scale) + 'px';
    canvas.style.height = (CANVAS_HEIGHT * scale) + 'px';
}

// 터치 좌표를 캔버스 좌표로 변환
function getTouchPos(touch) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (touch.clientX - rect.left) / scale,
        y: (touch.clientY - rect.top) / scale
    };
}

// 초기 크기 조정 및 리사이즈 이벤트
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 100);
});

// 게임 변수
let gameSpeed = 6;
let gravity = 0.6;
let score = 0;
let highScore = localStorage.getItem('dinoHighScore') || 0;
let gameRunning = false;
let gameOver = false;
const MAX_SPEED = 13; // 최대 속도 제한
const MAX_SCORE = 99999; // 최대 점수

// 공룡 객체
const dino = {
    x: 50,
    y: 0,
    width: 44,
    height: 47,
    dy: 0,
    jumpPower: -13,
    grounded: false,
    ducking: false,
    frameIndex: 0,

    draw() {
        if (!spriteLoaded) return; // 스프라이트 로드 전에는 그리지 않음

        if (gameOver) {
            // 죽은 상태
            const sprite = SPRITES.DINO.DEAD;
            ctx.drawImage(spriteImage, sprite.x, sprite.y, sprite.w, sprite.h,
                this.x, this.y, sprite.w, sprite.h);
        } else if (this.ducking) {
            // 숙인 자세 애니메이션
            const sprite = (Math.floor(score / 3) % 2 === 0) ? SPRITES.DINO.DUCK_1 : SPRITES.DINO.DUCK_2;
            ctx.drawImage(spriteImage, sprite.x, sprite.y, sprite.w, sprite.h,
                this.x, this.y + 17, sprite.w, sprite.h);
        } else {
            // 달리기 애니메이션
            const sprite = (Math.floor(score / 5) % 2 === 0) ? SPRITES.DINO.STAND_1 : SPRITES.DINO.STAND_2;
            ctx.drawImage(spriteImage, sprite.x, sprite.y, sprite.w, sprite.h,
                this.x, this.y, sprite.w, sprite.h);
        }
    },

    update() {
        this.dy += gravity;
        this.y += this.dy;

        const groundY = 130 - (this.ducking ? 30 : this.height);
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
            return { x: this.x + 5, y: this.y + 20, width: 54, height: 25 };
        }
        return { x: this.x + 5, y: this.y + 5, width: 34, height: 37 };
    },

    reset() {
        this.y = 130 - this.height;
        this.dy = 0;
        this.ducking = false;
        this.grounded = false;
    }
};

// 장애물 클래스
class Obstacle {
    constructor(type) {
        this.x = canvas.width;
        this.passed = false;
        this.frame = 0;

        if (type === 'bird') {
            this.type = 'bird';
            this.sprite = SPRITES.BIRD.FLY_1;
            this.width = this.sprite.w;
            this.height = this.sprite.h;
            this.y = 80;
        } else {
            // 선인장 타입 랜덤 선택
            const cactusTypes = ['SMALL', 'LARGE', 'DOUBLE', 'TRIPLE'];
            const randomType = type || cactusTypes[Math.floor(Math.random() * cactusTypes.length)];
            this.type = randomType;
            this.sprite = SPRITES.CACTUS[randomType];
            this.width = this.sprite.w;
            this.height = this.sprite.h;
            this.y = 130 - this.height;
        }
    }

    draw() {
        if (!spriteLoaded) return; // 스프라이트 로드 전에는 그리지 않음

        if (this.type === 'bird') {
            // 새 날개 애니메이션
            const sprite = (Math.floor(this.frame) % 10 < 5) ? SPRITES.BIRD.FLY_1 : SPRITES.BIRD.FLY_2;
            ctx.drawImage(spriteImage, sprite.x, sprite.y, sprite.w, sprite.h,
                this.x, this.y, sprite.w, sprite.h);
            this.frame += 0.2;
        } else {
            // 선인장
            ctx.drawImage(spriteImage, this.sprite.x, this.sprite.y, this.sprite.w, this.sprite.h,
                this.x, this.y, this.sprite.w, this.sprite.h);
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
        this.x = canvas.width + Math.random() * 133;
        this.y = Math.random() * 67 + 13;
        this.sprite = SPRITES.CLOUD;
        this.width = this.sprite.w;
        this.height = this.sprite.h;
    }

    draw() {
        if (!spriteLoaded) return; // 스프라이트 로드 전에는 그리지 않음

        ctx.drawImage(spriteImage, this.sprite.x, this.sprite.y, this.sprite.w, this.sprite.h,
            this.x, this.y, this.sprite.w, this.sprite.h);
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

// 스프라이트 숫자 그리기 헬퍼 함수
function drawSpriteNumber(num, x, y) {
    if (!spriteLoaded) return x;

    const numStr = Math.floor(num).toString().padStart(5, '0');
    let currentX = x;

    for (let i = 0; i < numStr.length; i++) {
        const digit = parseInt(numStr[i]);
        const sprite = SPRITES.NUMBERS[digit];
        ctx.drawImage(spriteImage, sprite.x, sprite.y, sprite.w, sprite.h,
            currentX, y, sprite.w, sprite.h);
        currentX += sprite.w + 1; // 1픽셀 간격
    }

    return currentX;
}

// 점수 그리기
function drawScore() {
    if (!spriteLoaded) return;

    const currentScore = Math.min(Math.floor(score), MAX_SCORE);
    const rightX = canvas.width - 15;

    // 현재 점수 (오른쪽 정렬)
    drawSpriteNumber(currentScore, rightX - (5 * 11), 20);

    // "HI" 텍스트와 최고 점수
    if (highScore > 0) {
        const hiSprite = SPRITES.HI;
        const hiX = rightX - (5 * 11) - 60;
        ctx.drawImage(spriteImage, hiSprite.x, hiSprite.y, hiSprite.w, hiSprite.h,
            hiX, 20, hiSprite.w, hiSprite.h);
        drawSpriteNumber(highScore, hiX + hiSprite.w + 5, 20);
    }
}


// 바닥 그리기
function drawGround() {
    ctx.strokeStyle = '#535353';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 130);
    ctx.lineTo(canvas.width, 130);
    ctx.stroke();

    // 바닥 패턴
    const offset = Math.floor(score * 2) % 27;
    ctx.fillStyle = '#535353';
    for (let i = -offset; i < canvas.width; i += 27) {
        ctx.fillRect(i, 133, 13, 3);
    }
}

// 게임 오버 텍스트
function drawGameOver() {
    if (spriteLoaded) {
        // "GAME OVER" 스프라이트 이미지 사용
        const gameOverSprite = SPRITES.TEXT.GAME_OVER;
        const x = (canvas.width - gameOverSprite.w) / 2;
        ctx.drawImage(spriteImage, gameOverSprite.x, gameOverSprite.y, gameOverSprite.w, gameOverSprite.h,
            x, 50, gameOverSprite.w, gameOverSprite.h);

        // 재시작 아이콘 스프라이트
        const restartSprite = SPRITES.RESTART;
        const restartX = (canvas.width - restartSprite.w) / 2;
        ctx.drawImage(spriteImage, restartSprite.x, restartSprite.y, restartSprite.w, restartSprite.h,
            restartX, 80, restartSprite.w, restartSprite.h);
    } else {
        // 폴백: 텍스트로 표시
        ctx.fillStyle = '#535353';
        ctx.font = 'bold 19px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('G A M E  O V E R', canvas.width / 2, 53);

        ctx.font = '13px "Courier New", monospace';
        ctx.fillText('Press SPACE to restart', canvas.width / 2, 73);

        ctx.font = '27px Arial';
        ctx.fillText('↻', canvas.width / 2, 100);
    }
}

// 시작 화면
function drawStartScreen() {
    ctx.fillStyle = '#535353';
    ctx.font = '13px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Press SPACE to start', canvas.width / 2, 80);
}

// 장애물 생성
function spawnObstacle() {
    const rand = Math.random();

    if (rand < 0.1 && score > 100) {
        obstacles.push(new Obstacle('bird'));
    } else {
        // 선인장 타입은 Obstacle 생성자에서 랜덤 선택됨
        obstacles.push(new Obstacle());
    }
}

// 게임 업데이트
function update() {
    if (!gameRunning || gameOver) return;

    // 공룡 업데이트
    dino.update();

    // 점수 증가 (최대 99999까지)
    if (score < MAX_SCORE) {
        score += 0.1;
    }

    // 속도 증가 (천천히, 최대 속도 제한)
    if (Math.floor(score) % 100 === 0 && Math.floor(score) > 0) {
        if (gameSpeed < MAX_SPEED) {
            gameSpeed += 0.2;
        }
        obstacleInterval = Math.max(60, obstacleInterval - 2);
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

        // 충돌 체크 - 한 번 부딪히면 게임 오버
        if (obstacles[i].collidesWith(dino) && !obstacles[i].passed) {
            obstacles[i].passed = true; // 중복 충돌 방지

            // 게임 오버
            gameOver = true;
            const finalScore = Math.min(Math.floor(score), MAX_SCORE);
            if (finalScore > highScore) {
                highScore = finalScore;
                localStorage.setItem('dinoHighScore', highScore);
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

    if (gameRunning && !gameOver) {
        // 공룡
        dino.draw();

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
    dino.reset();
    score = 0;
    gameSpeed = 6;
    obstacles = [];
    obstacleTimer = 0;
    obstacleInterval = 75;
    gameOver = false;
    gameRunning = true;
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
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();

    const touch = e.touches[0];
    const pos = getTouchPos(touch);
    touchStartY = pos.y;

    if (!gameRunning || gameOver) {
        resetGame();
    } else {
        // 화면 중앙(100px) 기준으로 위/아래 구분
        if (pos.y < CANVAS_HEIGHT / 2) {
            // 화면 위쪽 터치 = 점프
            dino.jump();
        } else {
            // 화면 아래쪽 터치 = 숙이기
            dino.duck(true);
        }
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    // 터치를 떼면 숙이기 해제
    if (gameRunning && !gameOver) {
        dino.duck(false);
    }
});

canvas.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    // 터치 취소 시에도 숙이기 해제
    if (gameRunning && !gameOver) {
        dino.duck(false);
    }
});

// 모바일 스크롤 방지
document.body.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

// 더블 탭 줌 방지
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// 게임 시작
dino.y = 130 - dino.height;
gameLoop();
