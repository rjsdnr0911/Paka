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
    button: new Image(),
    boo: new Image(),
    boo2: new Image(),
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
images.button.src = 'button.png';
images.boo.src = 'boo.png';
images.boo2.src = 'boo2.png';

// 이미지 로드 완료 체크
let imagesLoaded = 0;
let totalImages = 30;  // boo.png, boo2.png 추가로 30개
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
let isNightMode = false;
let nightModeTransition = 1;
let lastNightModeChange = 0;

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
            // 게임 속도에 따라 애니메이션 속도 조절 (속도가 빠를수록 딜레이를 낮춤)
            const dynamicDelay = Math.max(1, Math.floor(20 / currentSpeed));
            if (this.animFrameDelay > dynamicDelay) {
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
            yPos = this.groundY + 4;  // 숙인 자세를 위로 올려 땅과 자연스럽게 닿도록 조정
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
    constructor(type, isRising = false) {
        this.type = type;
        this.remove = false;
        this.animFrame = 0;
        this.animDelay = 0;
        this.x = GAME_WIDTH + Math.random() * 50;
        this.alpha = 1;  // 기본 투명도
        this.isRising = isRising;  // 솟구치는 선인장 여부
        this.hasRisen = false;  // 이미 솟구쳤는지 여부

        if (type === 'BIRD') {
            this.images = [images.bird, images.bird2];
            this.width = images.bird.width;
            this.height = images.bird.height;
            // 원본 게임과 동일한 새의 높이
            const heights = [20, 50, 75];
            this.y = heights[Math.floor(Math.random() * heights.length)];
        } else if (type === 'CACTUS_TRANSPARENT') {
            // 투명 선인장 타입
            const cactusImages = [images.cactus, images.cactus2, images.cactus3, images.cactus4, images.cactus5];
            this.image = cactusImages[Math.floor(Math.random() * cactusImages.length)];
            this.width = this.image.width;
            this.height = this.image.height;
            this.y = 145 - this.height;
            this.initialY = this.y;  // 초기 y 위치 저장
            this.alpha = 0.15;  // 처음에는 매우 희미하게
        } else {
            // 일반 선인장 타입
            const cactusImages = [images.cactus, images.cactus2, images.cactus3, images.cactus4, images.cactus5];
            this.image = cactusImages[Math.floor(Math.random() * cactusImages.length)];
            this.width = this.image.width;
            this.height = this.image.height;
            // 땅 안쪽으로 더 낮게 배치
            this.y = 145 - this.height;
            this.initialY = this.y;  // 초기 y 위치 저장
        }
    }

    update() {
        this.x -= currentSpeed;

        if (this.x + this.width < 0) {
            this.remove = true;
        }

        // 투명 선인장이 맵의 절반을 넘어가면 검은색으로 변경
        if (this.type === 'CACTUS_TRANSPARENT' && this.x < GAME_WIDTH / 2) {
            this.alpha = 1;
        }

        // 솟구치는 선인장이 맵의 절반을 넘어가면 위로 이동
        if (this.isRising && !this.hasRisen && this.x < GAME_WIDTH / 2) {
            // 공룡 점프 높이만큼 위로 이동 (약 83픽셀)
            this.y = this.initialY - 83;
            this.hasRisen = true;
            // 폭발 효과 추가
            explosions.push(new Explosion(this.x, this.y + 40));
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

        // 투명도 적용
        ctx.globalAlpha = this.alpha;

        if (this.type === 'BIRD') {
            ctx.drawImage(this.images[this.animFrame], this.x, this.y);
        } else {
            ctx.drawImage(this.image, this.x, this.y);
        }

        // 투명도 초기화
        ctx.globalAlpha = 1;
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

// 폭발 클래스
class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 60;
        this.frame = 0;
        this.maxFrames = 30; // 0.5초 (60fps 기준 30프레임)
        this.remove = false;
    }

    update() {
        this.frame++;
        if (this.frame >= this.maxFrames) {
            this.remove = true;
        }
        // 폭발도 배경과 함께 이동
        this.x -= currentSpeed;
    }

    draw() {
        if (!allImagesLoaded) return;

        // boo와 boo2를 번갈아 가며 출력하여 애니메이션 효과
        const img = Math.floor(this.frame / 5) % 2 === 0 ? images.boo : images.boo2;

        // 중앙 정렬하여 그리기
        ctx.drawImage(img, this.x - this.width / 4, this.y - this.height / 4, this.width, this.height);
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
        this.offset = 0;
        this.groundY = 135;  // 땅 위치
        this.groundHeight = 15;  // 땅 이미지가 잘 보이도록 적절한 높이
    }

    update() {
        if (!allImagesLoaded) return;

        // 실제 ground 이미지 너비 사용
        const tileWidth = images.ground.width;
        this.offset -= currentSpeed;

        // offset이 타일 너비를 초과하면 리셋 (끊김 없는 루프)
        if (this.offset <= -tileWidth) {
            this.offset += tileWidth;
        }
    }

    draw() {
        if (!allImagesLoaded) return;

        // 타일링 방식으로 땅 그리기 (끊김 없이 연결)
        // ground 이미지의 실제 너비를 사용하여 반복
        const tileWidth = images.ground.width;
        const numTiles = Math.ceil(GAME_WIDTH / tileWidth) + 2;  // 화면을 완전히 커버하기 위한 타일 개수

        for (let i = 0; i < numTiles; i++) {
            const x = this.offset + (i * tileWidth);
            // 원본 크기 그대로 사용 (비율 유지)
            ctx.drawImage(images.ground, x, this.groundY);
        }
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
        if (!images.button.complete) return;

        // 버튼 이미지 중앙 정렬하여 그리기
        const buttonWidth = images.button.width;
        const buttonHeight = images.button.height;
        const buttonX = x - buttonWidth / 2;
        const buttonY = y - buttonHeight / 2;

        ctx.drawImage(images.button, buttonX, buttonY);
    }
}

// 게임 객체들
const trex = new Trex();
const horizon = new Horizon();
const scoreBoard = new ScoreBoard();
const gameOverPanel = new GameOverPanel();
let obstacles = [];
let clouds = [];
let explosions = [];
let obstacleTimer = 0;
let cloudTimer = 0;
let nextObstacleGap = 0;

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
    let isRising = false;

    // 현재 점수 계산
    const score = Math.floor(distanceRan * 0.025);

    // 투명 선인장 확률 체크
    // 100점~200점 사이: 50% 확률로 투명 선인장 생성
    if (score >= 100 && score < 200 && Math.random() < 0.5) {
        type = 'CACTUS_TRANSPARENT';
    }
    // 200점 이상일 때 7% 확률로 투명 선인장 생성
    else if (score >= 200 && Math.random() < 0.07) {
        type = 'CACTUS_TRANSPARENT';
    }
    // 실제 Chrome 게임처럼 450점부터 익룡 등장
    // distanceRan * 0.025 = score이므로, 450점 = distanceRan 18000
    else if (distanceRan < 18000) {
        type = 'CACTUS';
    } else {
        type = obstacleTypes[Math.floor(Math.random() * 2)];
    }

    // 솟구치는 선인장 확률 체크 (투명 선인장과 독립적으로 적용)
    if (type !== 'BIRD') {  // 선인장 타입일 때만
        // 100점~200점 사이: 30% 확률로 솟구치는 선인장
        if (score >= 100 && score < 200 && Math.random() < 0.3) {
            isRising = true;
        }
        // 200점 이상: 8% 확률로 솟구치는 선인장
        else if (score >= 200 && Math.random() < 0.08) {
            isRising = true;
        }
    }

    obstacles.push(new Obstacle(type, isRising));
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

// 낮/밤 모드 전환 체크
function checkNightMode() {
    const score = Math.floor(distanceRan * 0.025);
    const nightModeInterval = 700; // 700점마다 전환

    if (Math.floor(score / nightModeInterval) !== lastNightModeChange) {
        lastNightModeChange = Math.floor(score / nightModeInterval);
        isNightMode = !isNightMode;
        nightModeTransition = 0;
    }

    // 전환 애니메이션
    if (nightModeTransition < 1) {
        nightModeTransition += 0.02;
    }
}

// 달 그리기
function drawMoon() {
    const moonX = GAME_WIDTH - 60;
    const moonY = 30;
    const moonRadius = 15;

    // 달 (반전될 것이므로 어두운 색으로 그려서 밝게 보이게 함)
    ctx.fillStyle = '#535353';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.fill();

    // 달 크레이터
    ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
    ctx.beginPath();
    ctx.arc(moonX - 4, moonY - 3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(moonX + 3, moonY + 2, 2, 0, Math.PI * 2);
    ctx.fill();
}

// 별 그리기
function drawStars() {
    ctx.fillStyle = '#535353';
    const stars = [
        [50, 20], [120, 35], [200, 15], [280, 40], [350, 25],
        [430, 30], [500, 18], [550, 38]
    ];

    stars.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
    });
}

// 게임 업데이트
function update() {
    if (!isRunning || gameOver) return;

    frameCount++;
    distanceRan += currentSpeed;

    // 낮/밤 모드 체크
    checkNightMode();

    // 속도 증가 (프레임 단위 가속)
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

    // 장애물 생성 (속도에 비례하여 간격을 조절하여 거리 밸런스 유지)
    obstacleTimer++;
    const baseMinGap = 50;
    const baseMaxGap = 100;
    // 속도가 빨라지면 프레임당 이동 거리가 늘어나므로, 프레임 기반의 Gap을 속도에 맞춰 보정
    const scaleFactor = SPEED / currentSpeed;
    const minGap = baseMinGap * scaleFactor;
    const maxGap = baseMaxGap * scaleFactor;
    const gapSize = minGap + Math.random() * (maxGap - minGap);

    if (obstacleTimer > nextObstacleGap) {
        spawnObstacle();
        obstacleTimer = 0;
        // 다음 장애물까지의 랜덤 간격 설정 (40~140 프레임)
        const minGap = 40;
        const maxGap = 140;
        nextObstacleGap = minGap + Math.random() * (maxGap - minGap);
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

    // 폭발 업데이트
    explosions.forEach(exp => exp.update());
    explosions = explosions.filter(exp => !exp.remove);
}

// 게임 그리기
function draw() {
    const dayColor = { r: 247, g: 247, b: 247 };
    ctx.fillStyle = `rgb(${dayColor.r}, ${dayColor.g}, ${dayColor.b})`;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 밤 모드일 때 별과 달 그리기
    if (isNightMode && nightModeTransition > 0.5) {
        drawStars();
        drawMoon();
    }


    // 구름
    clouds.forEach(cloud => cloud.draw());

    // 지평선
    horizon.draw();

    // 장애물
    obstacles.forEach(obstacle => obstacle.draw());

    // 공룡
    trex.draw();

    // 폭발 (밤 모드 반전 효과 전후 위치 고려 - 반전 효과 전에 그려야 밤 모드에서 색 반전이 일어남)
    explosions.forEach(exp => exp.draw());

    // 점수
    scoreBoard.draw();

    // 게임 오버
    if (gameOver) {
        gameOverPanel.draw();
    }

    // 밤 모드 전환 (성능 최적화를 위해 difference 합성 연산 사용)
    // 모든 요소를 그린 후 마지막에 한 번에 반전시켜 렉을 방지하고 효과를 극대화함
    const invertAlpha = isNightMode ? nightModeTransition : (1 - nightModeTransition);
    if (invertAlpha > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'difference';
        ctx.globalAlpha = invertAlpha;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.restore();
    }

    // filter 초기화 (혹시 다른 곳에서 사용될 경우를 위해)
    ctx.filter = 'none';

    // 시작 전 메시지
    if (!isRunning && !gameOver) {
        ctx.fillStyle = isNightMode ? '#fff' : '#535353';
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
    nextObstacleGap = 50 + Math.random() * 50; // 첫 장애물 간격 초기화
    obstacles = [];
    clouds = [];
    explosions = [];
    trex.reset();
    isNightMode = false;
    nightModeTransition = 1;
    lastNightModeChange = 0;
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
