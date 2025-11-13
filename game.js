// ===== Chrome 공룡 게임 - 개별 이미지 파일 사용 =====

// 캔버스 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 게임 크기
const GAME_WIDTH = 600;
const GAME_HEIGHT = 150;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// 이미지 로드
const images = {
    dino: new Image(),
    dino2: new Image(),
    dino3: new Image(),
    dinoDamaged: new Image(),
    dinoDown: new Image(),
    dinoDown2: new Image(),
    bird: new Image(),
    bird2: new Image(),
    cactus: new Image(),
    cactus2: new Image(),
    cactus3: new Image(),
    cactus4: new Image(),
    cactus5: new Image(),
    cloud: new Image(),
    ground: new Image(),
    gameover: new Image(),
    hi: new Image(),
    numbers: []
};

// 숫자 이미지 로드
for (let i = 0; i <= 9; i++) {
    images.numbers[i] = new Image();
    images.numbers[i].src = `${i}.png`;
}

// 이미지 소스 설정
images.dino.src = 'dino.png';
images.dino2.src = 'dino2.png';
images.dino3.src = 'dino3.png';
images.dinoDamaged.src = 'dino_damaged.png';
images.dinoDown.src = 'dino_down.png';
images.dinoDown2.src = 'dino_down2.png';
images.bird.src = 'bird.png';
images.bird2.src = 'bird2.png';
images.cactus.src = 'cactus.png';
images.cactus2.src = 'cactus2.png';
images.cactus3.src = 'cactus3.png';
images.cactus4.src = 'cactus4.png';
images.cactus5.src = 'cactus5.png';
images.cloud.src = 'cloud.png';
images.ground.src = 'ground.png';
images.gameover.src = 'gameover.png';
images.hi.src = 'hi.png';

// 이미지 로드 완료 체크
let imagesLoaded = 0;
let totalImages = 27;
let allImagesLoaded = false;

Object.values(images).forEach(img => {
    if (img instanceof Image) {
        img.onload = () => {
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
                allImagesLoaded = true;
                console.log('🦖 All images loaded!');
            }
        };
    }
});

images.numbers.forEach(img => {
    img.onload = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            allImagesLoaded = true;
            console.log('🦖 All images loaded!');
        }
    };
});

// 게임 상수
const GRAVITY = 0.6;
const INITIAL_JUMP_VELOCITY = -10;
const SPEED = 6;
const MAX_SPEED = 13;
const ACCELERATION = 0.001;

// 게임 변수
let isRunning = false;
let gameOver = false;
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
        this.groundY = 88;  // 땅 위치(135px)에 맞춘 공룡 위치
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
        if (!allImagesLoaded) return;

        let img;
        let yPos = this.y;

        if (this.crashed) {
            img = images.dinoDamaged;
        } else if (this.ducking) {
            img = this.animFrame === 0 ? images.dinoDown : images.dinoDown2;
            yPos = this.groundY + 20;  // 숙인 자세 위치 조정
        } else {
            if (this.jumping) {
                img = images.dino;
            } else {
                img = this.animFrame === 0 ? images.dino2 : images.dino3;
            }
        }

        ctx.drawImage(img, this.x, yPos);
    }

    getHitbox() {
        // 매우 작은 히트박스 (보이는 이미지보다 훨씬 작음)
        if (this.ducking) {
            // 숙인 상태: 극도로 작은 히트박스
            return {
                x: this.x + 15,
                y: this.groundY + 32,
                width: this.width - 30,
                height: this.height - 18
            };
        } else {
            // 서있는 상태: 극도로 작은 히트박스
            return {
                x: this.x + 15,
                y: this.y + 15,
                width: this.width - 30,
                height: this.height - 25
            };
        }
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
    constructor(type) {
        this.type = type;
        this.remove = false;
        this.animFrame = 0;
        this.animDelay = 0;
        this.x = GAME_WIDTH + Math.random() * 50;

        if (type === 'BIRD') {
            this.images = [images.bird, images.bird2];
            this.width = images.bird.width;
            this.height = images.bird.height;
            // 원본 게임과 동일한 새의 높이
            const heights = [20, 50, 75];
            this.y = heights[Math.floor(Math.random() * heights.length)];
        } else {
            // 선인장 타입
            const cactusImages = [images.cactus, images.cactus2, images.cactus3, images.cactus4, images.cactus5];
            this.image = cactusImages[Math.floor(Math.random() * cactusImages.length)];
            this.width = this.image.width;
            this.height = this.image.height;
            // 땅 안쪽으로 더 낮게 배치
            this.y = 145 - this.height;
        }
    }

    update() {
        this.x -= currentSpeed;

        if (this.x + this.width < 0) {
            this.remove = true;
        }

        // 새 날개 애니메이션
        if (this.type === 'BIRD') {
            this.animDelay++;
            if (this.animDelay > 5) {
                this.animFrame = this.animFrame === 0 ? 1 : 0;
                this.animDelay = 0;
            }
        }
    }

    draw() {
        if (!allImagesLoaded) return;

        if (this.type === 'BIRD') {
            ctx.drawImage(this.images[this.animFrame], this.x, this.y);
        } else {
            ctx.drawImage(this.image, this.x, this.y);
        }
    }

    collidesWith(trex) {
        const trexBox = trex.getHitbox();

        // 장애물 종류에 따라 다른 buffer 적용
        let buffer;
        if (this.type === 'BIRD') {
            buffer = 14;  // 새는 극도로 작은 히트박스
        } else {
            buffer = 12;  // 선인장은 매우 작은 히트박스
        }

        // 장애물 히트박스 (이미지보다 훨씬 작게)
        const obsBox = {
            x: this.x + buffer,
            y: this.y + buffer,
            width: this.width - buffer * 2,
            height: this.height - buffer * 2
        };

        return !(
            trexBox.x + trexBox.width < obsBox.x ||
            trexBox.x > obsBox.x + obsBox.width ||
            trexBox.y + trexBox.height < obsBox.y ||
            trexBox.y > obsBox.y + obsBox.height
        );
    }
}

// 구름 클래스
class Cloud {
    constructor() {
        this.x = GAME_WIDTH + Math.random() * 100;
        this.y = Math.random() * 50 + 10;
        this.remove = false;
    }

    update() {
        this.x -= currentSpeed * 0.2;
        if (this.x + images.cloud.width < 0) {
            this.remove = true;
        }
    }

    draw() {
        if (!allImagesLoaded) return;
        ctx.drawImage(images.cloud, this.x, this.y);
    }
}

// 지평선 클래스
class Horizon {
    constructor() {
        this.x1 = 0;
        this.x2 = GAME_WIDTH;
        this.groundY = 135;  // 땅 위치
        this.groundHeight = 15;  // 땅 이미지가 잘 보이도록 적절한 높이
    }

    update() {
        this.x1 -= currentSpeed;
        this.x2 -= currentSpeed;

        // 첫 번째 이미지가 완전히 왼쪽으로 벗어나면 오른쪽으로 이동
        if (this.x1 + GAME_WIDTH <= 0) {
            this.x1 = this.x2 + GAME_WIDTH;
        }

        // 두 번째 이미지가 완전히 왼쪽으로 벗어나면 오른쪽으로 이동
        if (this.x2 + GAME_WIDTH <= 0) {
            this.x2 = this.x1 + GAME_WIDTH;
        }
    }

    draw() {
        if (!allImagesLoaded) return;

        // 두 개의 땅 이미지를 교대로 그려서 끊김 없이 연결
        ctx.drawImage(images.ground,
            0, 0, images.ground.width, images.ground.height,  // 소스
            this.x1, this.groundY, GAME_WIDTH, this.groundHeight  // 목적지
        );
        ctx.drawImage(images.ground,
            0, 0, images.ground.width, images.ground.height,  // 소스
            this.x2, this.groundY, GAME_WIDTH, this.groundHeight  // 목적지
        );
    }
}

// 점수판 클래스
class ScoreBoard {
    draw() {
        if (!allImagesLoaded) return;

        const score = Math.floor(distanceRan * 0.025);
        const scoreStr = score.toString().padStart(5, '0');
        let x = GAME_WIDTH - 10;

        // 현재 점수 (오른쪽에서 왼쪽으로)
        for (let i = scoreStr.length - 1; i >= 0; i--) {
            const digit = parseInt(scoreStr[i]);
            x -= images.numbers[digit].width;
            ctx.drawImage(images.numbers[digit], x, 10);
            x -= 1;
        }

        // HI 점수
        if (highScore > 0) {
            const hiScoreStr = highScore.toString().padStart(5, '0');
            x -= 30;

            // HI 점수 숫자
            let hiX = x;
            for (let i = hiScoreStr.length - 1; i >= 0; i--) {
                const digit = parseInt(hiScoreStr[i]);
                hiX -= images.numbers[digit].width;
                ctx.drawImage(images.numbers[digit], hiX, 10);
                hiX -= 1;
            }

            // HI 텍스트
            hiX -= images.hi.width + 5;
            ctx.drawImage(images.hi, hiX, 10);
        }
    }
}

// 게임 오버 화면
class GameOverPanel {
    draw() {
        if (!allImagesLoaded) return;

        // GAME OVER 이미지
        const gameOverX = (GAME_WIDTH - images.gameover.width) / 2;
        const gameOverY = 50;
        ctx.drawImage(images.gameover, gameOverX, gameOverY);

        // 재시작 버튼 (아이콘 그리기)
        const buttonX = GAME_WIDTH / 2;
        const buttonY = gameOverY + images.gameover.height + 20;

        this.drawRestartButton(buttonX, buttonY);
    }

    drawRestartButton(x, y) {
        const size = 36;
        const centerX = x;
        const centerY = y;

        ctx.save();

        // 배경 원 (흰색)
        ctx.fillStyle = '#f7f7f7';
        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 2 - 1, 0, Math.PI * 2);
        ctx.fill();

        // 외곽 원
        ctx.strokeStyle = '#535353';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
        ctx.stroke();

        // 재시작 아이콘 (회전 화살표 그리기)
        ctx.strokeStyle = '#535353';
        ctx.fillStyle = '#535353';
        ctx.lineWidth = 2;

        // 원형 화살표
        ctx.beginPath();
        ctx.arc(centerX, centerY, 10, -Math.PI / 4, Math.PI * 3 / 2, false);
        ctx.stroke();

        // 화살표 머리
        ctx.beginPath();
        ctx.moveTo(centerX - 10, centerY - 3);
        ctx.lineTo(centerX - 10, centerY + 3);
        ctx.lineTo(centerX - 5, centerY);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
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
    const obstacleTypes = ['CACTUS', 'BIRD'];
    let type;

    // 점수가 낮을 때는 새 제외
    if (distanceRan < 1000) {
        type = 'CACTUS';
    } else {
        type = obstacleTypes[Math.floor(Math.random() * 2)];
    }

    obstacles.push(new Obstacle(type));
}

// 구름 생성
function spawnCloud() {
    if (clouds.length < 6 && Math.random() < 0.3) {
        clouds.push(new Cloud());
    }
}

// 초기 구름 생성 (게임 시작 시)
function initClouds() {
    for (let i = 0; i < 3; i++) {
        const cloud = new Cloud();
        cloud.x = Math.random() * GAME_WIDTH;
        clouds.push(cloud);
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
    if (cloudTimer > 200) {  // 더 천천히 생성
        spawnCloud();
        cloudTimer = 0;
    }
    clouds.forEach(cloud => cloud.update());
    clouds = clouds.filter(cloud => !cloud.remove);

    // 장애물 생성 (원본 게임과 동일한 간격)
    obstacleTimer++;
    const minGap = 50;
    const maxGap = 100;
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
initClouds();  // 초기 구름 생성
gameLoop();
