// ===== Chrome 공룡 게임 - 원본과 동일하게 재구현 =====

// 캔버스 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 게임 크기 (원본 Chrome 게임 크기)
const GAME_WIDTH = 600;
const GAME_HEIGHT = 150;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// 스프라이트 이미지 로드
const spriteImage = new Image();
let spriteLoaded = false;
spriteImage.onload = () => {
    spriteLoaded = true;
    console.log('🦖 Sprite loaded!');
};
spriteImage.src = 'sprite.png';

// 스프라이트 좌표 (Chrome 공룡 게임 원본)
const SPRITE = {
    DINO: {
        STANDING: [
            { x: 848, y: 2, w: 44, h: 47 },
            { x: 892, y: 2, w: 44, h: 47 }
        ],
        DUCKING: [
            { x: 1112, y: 19, w: 59, h: 30 },
            { x: 1171, y: 19, w: 59, h: 30 }
        ],
        DEAD: { x: 1068, y: 2, w: 44, h: 47 }
    },
    CACTUS: {
        SMALL: [
            { x: 228, y: 2, w: 17, h: 35 }
        ],
        LARGE: [
            { x: 332, y: 2, w: 25, h: 50 }
        ],
        GROUP: [
            { x: 245, y: 2, w: 34, h: 50 },
            { x: 304, y: 2, w: 51, h: 50 }
        ]
    },
    PTERODACTYL: [
        { x: 134, y: 2, w: 46, h: 40 },
        { x: 180, y: 2, w: 46, h: 40 }
    ],
    CLOUD: { x: 86, y: 2, w: 46, h: 14 },
    HORIZON: { x: 2, y: 54, w: 1200, h: 12 },
    RESTART: { x: 2, y: 2, w: 36, h: 32 },
    TEXT: {
        GAME_OVER: { x: 655, y: 14, w: 191, h: 11 },
        HI: { x: 755, y: 2, w: 20, h: 13 }
    },
    NUMBERS: [
        { x: 655, y: 2, w: 10, h: 13 }, // 0
        { x: 665, y: 2, w: 10, h: 13 }, // 1
        { x: 675, y: 2, w: 10, h: 13 }, // 2
        { x: 685, y: 2, w: 10, h: 13 }, // 3
        { x: 695, y: 2, w: 10, h: 13 }, // 4
        { x: 705, y: 2, w: 10, h: 13 }, // 5
        { x: 715, y: 2, w: 10, h: 13 }, // 6
        { x: 725, y: 2, w: 10, h: 13 }, // 7
        { x: 735, y: 2, w: 10, h: 13 }, // 8
        { x: 745, y: 2, w: 10, h: 13 }  // 9
    ]
};

// 게임 상수
const FPS = 60;
const GRAVITY = 0.6;
const INITIAL_JUMP_VELOCITY = -10;
const MIN_JUMP_HEIGHT = 30;
const SPEED = 6;
const MAX_SPEED = 13;
const ACCELERATION = 0.001;
const CLOUD_FREQUENCY = 0.5;
const MAX_CLOUDS = 20;

// 게임 변수
let isRunning = false;
let gameOver = false;
let score = 0;
let highScore = parseInt(localStorage.getItem('highScore')) || 0;
let currentSpeed = SPEED;
let distanceRan = 0;
let frameCount = 0;

// 공룡 클래스
class Trex {
    constructor() {
        this.width = 44;
        this.height = 47;
        this.x = 25;
        this.groundY = 95;
        this.y = this.groundY;
        this.yVelocity = 0;
        this.jumping = false;
        this.ducking = false;
        this.crashed = false;
        this.animFrame = 0;
        this.animFrameDelay = 0;
    }

    update() {
        // 애니메이션 프레임
        if (isRunning && !this.crashed) {
            this.animFrameDelay++;
            if (this.animFrameDelay > 3) {
                this.animFrame = this.animFrame === 0 ? 1 : 0;
                this.animFrameDelay = 0;
            }
        }

        // 중력 적용
        if (this.jumping) {
            this.yVelocity += GRAVITY;
            this.y += this.yVelocity;

            // 착지
            if (this.y > this.groundY) {
                this.y = this.groundY;
                this.jumping = false;
                this.yVelocity = 0;
            }
        }

        // 숙이기 상태 크기 조정
        if (this.ducking) {
            this.width = 59;
            this.height = 30;
        } else {
            this.width = 44;
            this.height = 47;
        }
    }

    jump() {
        if (!this.jumping && !this.ducking) {
            this.yVelocity = INITIAL_JUMP_VELOCITY;
            this.jumping = true;
        }
    }

    duck(state) {
        if (!this.jumping) {
            this.ducking = state;
        }
    }

    draw() {
        if (!spriteLoaded) return;

        let sprite;
        let yPos = this.y;

        if (this.crashed) {
            sprite = SPRITE.DINO.DEAD;
        } else if (this.ducking) {
            sprite = SPRITE.DINO.DUCKING[this.animFrame];
            yPos = this.groundY + 18;
        } else {
            sprite = SPRITE.DINO.STANDING[this.jumping ? 0 : this.animFrame];
        }

        ctx.drawImage(
            spriteImage,
            sprite.x, sprite.y, sprite.w, sprite.h,
            this.x, yPos, sprite.w, sprite.h
        );
    }

    reset() {
        this.y = this.groundY;
        this.yVelocity = 0;
        this.jumping = false;
        this.ducking = false;
        this.crashed = false;
        this.animFrame = 0;
    }
}

// 장애물 클래스
class Obstacle {
    constructor(type, speedOffset) {
        this.type = type;
        this.speedOffset = speedOffset;
        this.remove = false;
        this.animFrame = 0;
        this.animDelay = 0;

        const sprites = type === 'PTERODACTYL' ? SPRITE.PTERODACTYL :
                       type === 'CACTUS_SMALL' ? SPRITE.CACTUS.SMALL :
                       type === 'CACTUS_LARGE' ? SPRITE.CACTUS.LARGE :
                       SPRITE.CACTUS.GROUP;

        this.sprite = sprites[0];
        this.width = this.sprite.w;
        this.height = this.sprite.h;
        this.x = GAME_WIDTH + Math.random() * 50;

        if (type === 'PTERODACTYL') {
            const heights = [50, 75, 95];
            this.y = heights[Math.floor(Math.random() * heights.length)];
            this.sprites = SPRITE.PTERODACTYL;
        } else {
            this.y = 95 + (47 - this.height);
            this.sprites = sprites;
        }
    }

    update() {
        this.x -= currentSpeed + this.speedOffset;

        if (this.x + this.width < 0) {
            this.remove = true;
        }

        // 익룡 애니메이션
        if (this.type === 'PTERODACTYL') {
            this.animDelay++;
            if (this.animDelay > 5) {
                this.animFrame = this.animFrame === 0 ? 1 : 0;
                this.sprite = this.sprites[this.animFrame];
                this.animDelay = 0;
            }
        }
    }

    draw() {
        if (!spriteLoaded) return;

        ctx.drawImage(
            spriteImage,
            this.sprite.x, this.sprite.y, this.sprite.w, this.sprite.h,
            this.x, this.y, this.sprite.w, this.sprite.h
        );
    }

    collidesWith(trex) {
        const buffer = 4;
        return !(
            trex.x + buffer > this.x + this.width ||
            trex.x + trex.width - buffer < this.x ||
            trex.y + buffer > this.y + this.height ||
            trex.y + trex.height - buffer < this.y
        );
    }
}

// 구름 클래스
class Cloud {
    constructor() {
        this.sprite = SPRITE.CLOUD;
        this.width = this.sprite.w;
        this.height = this.sprite.h;
        this.x = GAME_WIDTH + Math.random() * 100;
        this.y = Math.random() * 50 + 10;
        this.remove = false;
    }

    update() {
        this.x -= currentSpeed * 0.2;
        if (this.x + this.width < 0) {
            this.remove = true;
        }
    }

    draw() {
        if (!spriteLoaded) return;
        ctx.drawImage(
            spriteImage,
            this.sprite.x, this.sprite.y, this.sprite.w, this.sprite.h,
            this.x, this.y, this.sprite.w, this.sprite.h
        );
    }
}

// 지평선 클래스
class Horizon {
    constructor() {
        this.x = 0;
        this.groundY = 143;
    }

    update() {
        this.x -= currentSpeed;
        if (this.x <= -GAME_WIDTH) {
            this.x = 0;
        }
    }

    draw() {
        // 바닥 선
        ctx.strokeStyle = '#535353';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, this.groundY);
        ctx.lineTo(GAME_WIDTH, this.groundY);
        ctx.stroke();

        // 바닥 패턴 (움직이는 점선)
        ctx.fillStyle = '#535353';
        const patternWidth = 20;
        const patternHeight = 2;
        const patternGap = 20;

        for (let x = this.x; x < GAME_WIDTH; x += patternWidth + patternGap) {
            ctx.fillRect(x, this.groundY + 3, patternWidth, patternHeight);
        }
    }
}

// 점수판 클래스
class ScoreBoard {
    draw() {
        if (!spriteLoaded) return;

        const scoreStr = Math.floor(distanceRan * 0.025).toString().padStart(5, '0');
        let x = GAME_WIDTH - 15;

        // 현재 점수 (오른쪽에서 왼쪽으로 그리기)
        for (let i = scoreStr.length - 1; i >= 0; i--) {
            const digit = parseInt(scoreStr[i]);
            const sprite = SPRITE.NUMBERS[digit];
            x -= sprite.w;
            ctx.drawImage(
                spriteImage,
                sprite.x, sprite.y, sprite.w, sprite.h,
                x, 15, sprite.w, sprite.h
            );
            x -= 1;
        }

        // HI 점수
        if (highScore > 0) {
            const hiScoreStr = highScore.toString().padStart(5, '0');
            x -= 25;

            // HI 점수 숫자
            let hiX = x;
            for (let i = hiScoreStr.length - 1; i >= 0; i--) {
                const digit = parseInt(hiScoreStr[i]);
                const sprite = SPRITE.NUMBERS[digit];
                hiX -= sprite.w;
                ctx.drawImage(
                    spriteImage,
                    sprite.x, sprite.y, sprite.w, sprite.h,
                    hiX, 15, sprite.w, sprite.h
                );
                hiX -= 1;
            }

            // HI 텍스트
            const hiSprite = SPRITE.TEXT.HI;
            hiX -= hiSprite.w + 3;
            ctx.drawImage(
                spriteImage,
                hiSprite.x, hiSprite.y, hiSprite.w, hiSprite.h,
                hiX, 15, hiSprite.w, hiSprite.h
            );
        }
    }
}

// 게임 오버 화면
class GameOverPanel {
    draw() {
        if (!spriteLoaded) return;

        // GAME OVER 텍스트
        const gameOverSprite = SPRITE.TEXT.GAME_OVER;
        const x = (GAME_WIDTH - gameOverSprite.w) / 2;
        ctx.drawImage(
            spriteImage,
            gameOverSprite.x, gameOverSprite.y, gameOverSprite.w, gameOverSprite.h,
            x, 50, gameOverSprite.w, gameOverSprite.h
        );

        // 재시작 버튼
        const restartSprite = SPRITE.RESTART;
        const restartX = (GAME_WIDTH - restartSprite.w) / 2;
        ctx.drawImage(
            spriteImage,
            restartSprite.x, restartSprite.y, restartSprite.w, restartSprite.h,
            restartX, 70, restartSprite.w, restartSprite.h
        );
    }
}

// 게임 객체들
const trex = new Trex();
const horizon = new Horizon();
const scoreBoard = new ScoreBoard();
const gameOverPanel = new GameOverPanel();
let obstacles = [];
let clouds = [];
let obstacleTimer = 0;
let cloudTimer = 0;

// 모바일 대응
let scale = 1;
function resizeCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.offsetWidth;
    const scaleX = containerWidth / GAME_WIDTH;
    const scaleY = (window.innerHeight * 0.8) / GAME_HEIGHT;
    scale = Math.min(scaleX, scaleY, 1);

    canvas.style.width = (GAME_WIDTH * scale) + 'px';
    canvas.style.height = (GAME_HEIGHT * scale) + 'px';
}

function getTouchPos(touch) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (touch.clientX - rect.left) / scale,
        y: (touch.clientY - rect.top) / scale
    };
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));

// 장애물 생성
function spawnObstacle() {
    const obstacleTypes = ['CACTUS_SMALL', 'CACTUS_LARGE', 'CACTUS_GROUP', 'PTERODACTYL'];
    let type;

    // 점수가 낮을 때는 익룡 제외
    if (distanceRan < 1000) {
        type = obstacleTypes[Math.floor(Math.random() * 3)];
    } else {
        type = obstacleTypes[Math.floor(Math.random() * 4)];
    }

    const speedOffset = Math.random() * 2;
    obstacles.push(new Obstacle(type, speedOffset));
}

// 구름 생성
function spawnCloud() {
    if (clouds.length < MAX_CLOUDS && Math.random() < CLOUD_FREQUENCY) {
        clouds.push(new Cloud());
    }
}

// 게임 업데이트
function update() {
    if (!isRunning || gameOver) return;

    frameCount++;
    distanceRan += currentSpeed;

    // 속도 증가
    if (currentSpeed < MAX_SPEED) {
        currentSpeed += ACCELERATION;
    }

    // 공룡 업데이트
    trex.update();

    // 지평선 업데이트
    horizon.update();

    // 구름 업데이트
    cloudTimer++;
    if (cloudTimer > 100) {
        spawnCloud();
        cloudTimer = 0;
    }
    clouds.forEach(cloud => cloud.update());
    clouds = clouds.filter(cloud => !cloud.remove);

    // 장애물 생성
    obstacleTimer++;
    const minGap = 80;
    const maxGap = 140;
    const gapSize = minGap + Math.random() * (maxGap - minGap);

    if (obstacleTimer > gapSize) {
        spawnObstacle();
        obstacleTimer = 0;
    }

    // 장애물 업데이트 및 충돌 체크
    obstacles.forEach(obstacle => {
        obstacle.update();

        if (!trex.crashed && obstacle.collidesWith(trex)) {
            trex.crashed = true;
            gameOver = true;

            // 최고 점수 저장
            const finalScore = Math.floor(distanceRan * 0.025);
            if (finalScore > highScore) {
                highScore = finalScore;
                localStorage.setItem('highScore', highScore);
            }
        }
    });
    obstacles = obstacles.filter(obstacle => !obstacle.remove);
}

// 게임 그리기
function draw() {
    // 배경
    ctx.fillStyle = '#f7f7f7';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 구름
    clouds.forEach(cloud => cloud.draw());

    // 지평선
    horizon.draw();

    // 장애물
    obstacles.forEach(obstacle => obstacle.draw());

    // 공룡
    trex.draw();

    // 점수
    scoreBoard.draw();

    // 게임 오버
    if (gameOver) {
        gameOverPanel.draw();
    }

    // 시작 전 메시지
    if (!isRunning && !gameOver) {
        ctx.fillStyle = '#535353';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Press SPACE to start', GAME_WIDTH / 2, GAME_HEIGHT / 2);
    }
}

// 게임 리셋
function reset() {
    isRunning = true;
    gameOver = false;
    distanceRan = 0;
    currentSpeed = SPEED;
    frameCount = 0;
    obstacleTimer = 0;
    cloudTimer = 0;
    obstacles = [];
    clouds = [];
    trex.reset();
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
        if (!isRunning || gameOver) {
            reset();
        } else {
            trex.jump();
        }
    }

    if (e.code === 'ArrowDown' && isRunning && !gameOver) {
        e.preventDefault();
        trex.duck(true);
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowDown') {
        e.preventDefault();
        trex.duck(false);
    }
});

// 터치 이벤트
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const pos = getTouchPos(touch);

    if (!isRunning || gameOver) {
        reset();
    } else {
        if (pos.y < GAME_HEIGHT / 2) {
            trex.jump();
        } else {
            trex.duck(true);
        }
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (isRunning && !gameOver) {
        trex.duck(false);
    }
});

canvas.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    trex.duck(false);
});

// 모바일 스크롤/줌 방지
document.body.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// 게임 시작
console.log('🦖 Chrome Dinosaur Game Ready!');
gameLoop();
