// 캔버스 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 캔버스 크기 설정
canvas.width = 800;
canvas.height = 400;

// 게임 상태 변수
let gameSpeed = 9;
let gravity = 0.8;
let score = 0;
let highScore = localStorage.getItem('dinoHighScore') || 0;
let gameRunning = false;
let gameOver = false;
let gamePaused = false;
let combo = 0;
let maxCombo = 0;

// 시간에 따른 배경 (낮/밤)
let timeOfDay = 'day'; // 'day' or 'night'
let dayNightTimer = 0;

// 점수 표시 업데이트
document.getElementById('score').textContent = score;
document.getElementById('highScore').textContent = highScore;

// 파티클 클래스 (먼지 효과)
class Particle {
    constructor(x, y, color = '#95a5a6') {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 2;
        this.speedX = -Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.life = 1;
        this.decay = Math.random() * 0.02 + 0.01;
        this.color = color;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
    }

    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    isDead() {
        return this.life <= 0;
    }
}

// 파티클 배열
let particles = [];

// 공룡 객체 - 더 디테일한 그래픽
const dino = {
    x: 50,
    y: 0,
    width: 44,
    height: 52,
    dy: 0,
    jumpPower: -15,
    grounded: false,
    ducking: false,

    draw() {
        ctx.save();

        if (this.ducking) {
            // 숙인 자세
            const duckHeight = 26;
            const duckY = this.y + (this.height - duckHeight);

            // 몸통 (길쭉하게)
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(this.x, duckY, 50, 20);

            // 머리
            ctx.fillRect(this.x + 40, duckY - 8, 20, 16);

            // 눈
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x + 50, duckY - 4, 4, 4);

            // 꼬리
            ctx.fillStyle = '#34495e';
            ctx.fillRect(this.x - 10, duckY + 5, 15, 8);

        } else {
            // 머리
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(this.x + 20, this.y, 24, 18);

            // 입 (작은 디테일)
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x + 38, this.y + 10, 6, 2);

            // 눈
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x + 32, this.y + 4, 6, 6);
            ctx.fillStyle = '#000';
            ctx.fillRect(this.x + 34, this.y + 6, 2, 2);

            // 몸통
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(this.x + 14, this.y + 18, 26, 28);

            // 배
            ctx.fillStyle = '#34495e';
            ctx.fillRect(this.x + 18, this.y + 24, 18, 18);

            // 팔
            const armOffset = Math.floor(score / 3) % 2 === 0 ? 0 : 2;
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(this.x + 12, this.y + 22 + armOffset, 8, 12);

            // 꼬리
            ctx.fillStyle = '#34495e';
            ctx.beginPath();
            ctx.moveTo(this.x + 10, this.y + 24);
            ctx.lineTo(this.x, this.y + 20);
            ctx.lineTo(this.x + 4, this.y + 32);
            ctx.fill();

            // 다리 애니메이션
            const legOffset = Math.floor(score / 3) % 2 === 0 ? 0 : 6;
            ctx.fillStyle = '#2c3e50';

            // 왼쪽 다리
            ctx.fillRect(this.x + 16, this.y + 46, 8, 12 + legOffset);
            // 발
            ctx.fillRect(this.x + 14, this.y + 58 + legOffset, 12, 4);

            // 오른쪽 다리
            ctx.fillRect(this.x + 28, this.y + 46, 8, 12 - legOffset);
            // 발
            ctx.fillRect(this.x + 26, this.y + 58 - legOffset, 12, 4);
        }

        ctx.restore();

        // 달리기 중일 때 먼지 효과
        if (this.grounded && gameRunning && Math.random() > 0.7) {
            particles.push(new Particle(
                this.x + 10,
                this.y + this.height + 5,
                '#bdc3c7'
            ));
        }
    },

    update() {
        // 중력 적용
        this.dy += gravity;
        this.y += this.dy;

        // 바닥 체크
        const groundY = canvas.height - 100 - (this.ducking ? 26 : this.height);
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

            // 점프 먼지 효과
            for (let i = 0; i < 5; i++) {
                particles.push(new Particle(
                    this.x + Math.random() * 20 + 10,
                    this.y + this.height + 5,
                    '#e0e0e0'
                ));
            }
        }
    },

    duck(isDucking) {
        if (this.grounded) {
            this.ducking = isDucking;
        }
    },

    getHitbox() {
        if (this.ducking) {
            return {
                x: this.x + 5,
                y: this.y + (this.height - 26),
                width: 45,
                height: 20
            };
        }
        return {
            x: this.x + 10,
            y: this.y + 5,
            width: 34,
            height: 52
        };
    }
};

// 장애물 클래스 - 더 다양한 타입
class Obstacle {
    constructor(type) {
        this.x = canvas.width;
        this.passed = false;

        if (type === 'bird') {
            this.type = 'bird';
            this.width = 40;
            this.height = 30;
            this.y = canvas.height - 100 - this.height - (Math.random() > 0.5 ? 60 : 100);
            this.wingFrame = 0;
        } else {
            // 선인장 타입
            const cactusTypes = ['single', 'double', 'triple', 'tall', 'small'];
            this.type = type || cactusTypes[Math.floor(Math.random() * cactusTypes.length)];

            switch(this.type) {
                case 'single':
                    this.width = 20;
                    this.height = 50;
                    break;
                case 'double':
                    this.width = 40;
                    this.height = 50;
                    break;
                case 'triple':
                    this.width = 60;
                    this.height = 50;
                    break;
                case 'tall':
                    this.width = 20;
                    this.height = 70;
                    break;
                case 'small':
                    this.width = 30;
                    this.height = 30;
                    break;
            }

            this.y = canvas.height - 100 - this.height;
        }
    }

    draw() {
        if (this.type === 'bird') {
            // 새 그리기
            ctx.fillStyle = '#34495e';

            // 몸통
            ctx.fillRect(this.x + 10, this.y + 10, 20, 12);

            // 머리
            ctx.fillRect(this.x + 26, this.y + 8, 12, 10);

            // 눈
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x + 32, this.y + 10, 3, 3);

            // 부리
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(this.x + 38, this.y + 12, 4, 2);

            // 날개 애니메이션
            ctx.fillStyle = '#34495e';
            this.wingFrame = (this.wingFrame + 0.3) % 20;
            const wingUp = this.wingFrame < 10;

            if (wingUp) {
                // 날개 위로
                ctx.fillRect(this.x + 8, this.y + 2, 18, 8);
                ctx.fillRect(this.x + 14, this.y + 22, 18, 8);
            } else {
                // 날개 아래로
                ctx.fillRect(this.x + 8, this.y + 12, 18, 8);
                ctx.fillRect(this.x + 14, this.y + 12, 18, 8);
            }
        } else {
            // 선인장 그리기
            ctx.fillStyle = '#27ae60';

            switch(this.type) {
                case 'single':
                    this.drawCactus(this.x, this.y, this.height);
                    break;
                case 'double':
                    this.drawCactus(this.x, this.y, this.height);
                    this.drawCactus(this.x + 22, this.y, this.height);
                    break;
                case 'triple':
                    this.drawCactus(this.x, this.y, this.height);
                    this.drawCactus(this.x + 22, this.y, this.height);
                    this.drawCactus(this.x + 44, this.y, this.height);
                    break;
                case 'tall':
                    this.drawCactus(this.x, this.y, this.height, true);
                    break;
                case 'small':
                    this.drawSmallCactus(this.x, this.y);
                    break;
            }
        }
    }

    drawCactus(x, y, height, tall = false) {
        // 메인 줄기
        ctx.fillRect(x + 6, y, 12, height);

        if (tall) {
            // 큰 선인장 팔
            ctx.fillRect(x, y + 15, 10, 25);
            ctx.fillRect(x + 16, y + 20, 10, 20);
        } else {
            // 왼쪽 팔
            ctx.fillRect(x, y + 12, 10, 20);
            ctx.fillRect(x, y + 12, 6, 4);

            // 오른쪽 팔
            ctx.fillRect(x + 14, y + 18, 10, 15);
            ctx.fillRect(x + 18, y + 18, 6, 4);
        }

        // 가시 효과
        ctx.fillStyle = '#229954';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(x + 4, y + 10 + i * 12, 2, 2);
            ctx.fillRect(x + 16, y + 10 + i * 12, 2, 2);
        }
    }

    drawSmallCactus(x, y) {
        // 여러 개의 작은 선인장
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(x + i * 10, y + 10, 8, 20);
            ctx.fillRect(x + i * 10 + 2, y + 6, 4, 8);
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

        // 충돌 박스 약간의 여유 (더 관대하게)
        const margin = 5;

        return (
            dinoBox.x + margin < this.x + this.width - margin &&
            dinoBox.x + dinoBox.width - margin > this.x + margin &&
            dinoBox.y + margin < this.y + this.height - margin &&
            dinoBox.y + dinoBox.height - margin > this.y + margin
        );
    }
}

// 장애물 배열
let obstacles = [];
let obstacleTimer = 0;
let obstacleInterval = 70;

// 배경 요소 - 산
const mountains = [];
for (let i = 0; i < 5; i++) {
    mountains.push({
        x: i * 200 - 100,
        height: Math.random() * 80 + 60,
        width: Math.random() * 150 + 100
    });
}

function drawMountains() {
    ctx.fillStyle = timeOfDay === 'night' ? 'rgba(52, 73, 94, 0.3)' : 'rgba(149, 165, 166, 0.3)';

    mountains.forEach(mountain => {
        ctx.beginPath();
        ctx.moveTo(mountain.x, canvas.height - 100);
        ctx.lineTo(mountain.x + mountain.width / 2, canvas.height - 100 - mountain.height);
        ctx.lineTo(mountain.x + mountain.width, canvas.height - 100);
        ctx.closePath();
        ctx.fill();

        mountain.x -= gameSpeed * 0.1;
        if (mountain.x + mountain.width < 0) {
            mountain.x = canvas.width;
        }
    });
}

// 해/달
let sun = { x: 700, y: 60, radius: 30 };

function drawSun() {
    if (timeOfDay === 'day') {
        // 해
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(sun.x, sun.y, sun.radius, 0, Math.PI * 2);
        ctx.fill();

        // 햇살
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i + (score * 0.01);
            ctx.beginPath();
            ctx.moveTo(
                sun.x + Math.cos(angle) * (sun.radius + 5),
                sun.y + Math.sin(angle) * (sun.radius + 5)
            );
            ctx.lineTo(
                sun.x + Math.cos(angle) * (sun.radius + 15),
                sun.y + Math.sin(angle) * (sun.radius + 15)
            );
            ctx.stroke();
        }
    } else {
        // 달
        ctx.fillStyle = '#ecf0f1';
        ctx.beginPath();
        ctx.arc(sun.x, sun.y, sun.radius, 0, Math.PI * 2);
        ctx.fill();

        // 달 크레이터
        ctx.fillStyle = '#bdc3c7';
        ctx.beginPath();
        ctx.arc(sun.x - 8, sun.y - 5, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sun.x + 5, sun.y + 8, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 별 (밤에만)
const stars = [];
for (let i = 0; i < 50; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * (canvas.height - 150),
        size: Math.random() * 2 + 1,
        twinkle: Math.random() * Math.PI * 2
    });
}

function drawStars() {
    if (timeOfDay === 'night') {
        stars.forEach(star => {
            star.twinkle += 0.05;
            const alpha = (Math.sin(star.twinkle) + 1) / 2;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
    }
}

// 바닥 그리기
function drawGround() {
    ctx.strokeStyle = timeOfDay === 'night' ? '#34495e' : '#2c3e50';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 100);
    ctx.lineTo(canvas.width, canvas.height - 100);
    ctx.stroke();

    // 바닥 패턴
    ctx.fillStyle = timeOfDay === 'night' ? '#2c3e50' : '#34495e';
    for (let i = 0; i < canvas.width; i += 30) {
        const offset = (score * 3) % 30;
        ctx.fillRect(i - offset, canvas.height - 95, 12, 3);
        // 작은 돌들
        if (i % 60 === 0) {
            ctx.fillRect(i - offset + 15, canvas.height - 92, 4, 2);
        }
    }
}

// 구름 그리기
const clouds = [];
for (let i = 0; i < 5; i++) {
    clouds.push({
        x: Math.random() * canvas.width,
        y: Math.random() * 120 + 30,
        width: 60 + Math.random() * 40,
        speed: 1 + Math.random()
    });
}

function drawClouds() {
    ctx.fillStyle = timeOfDay === 'night'
        ? 'rgba(189, 195, 199, 0.4)'
        : 'rgba(236, 240, 241, 0.9)';

    clouds.forEach(cloud => {
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, 18, 0, Math.PI * 2);
        ctx.arc(cloud.x + 25, cloud.y, 24, 0, Math.PI * 2);
        ctx.arc(cloud.x + 50, cloud.y, 18, 0, Math.PI * 2);
        ctx.arc(cloud.x + 15, cloud.y - 10, 16, 0, Math.PI * 2);
        ctx.arc(cloud.x + 35, cloud.y - 8, 16, 0, Math.PI * 2);
        ctx.fill();

        cloud.x -= cloud.speed * 0.6;
        if (cloud.x < -100) {
            cloud.x = canvas.width + 50;
        }
    });
}

// 점수 업데이트
function updateScore() {
    if (gameRunning && !gameOver && !gamePaused) {
        score++;
        document.getElementById('score').textContent = Math.floor(score / 10);

        // 점수에 따라 속도 증가 (더 부드러운 곡선)
        if (score % 200 === 0 && score > 0) {
            gameSpeed += 0.8;
            obstacleInterval = Math.max(40, obstacleInterval - 3);
        }

        // 낮/밤 전환 (1000점마다)
        if (score % 1000 === 0 && score > 0) {
            timeOfDay = timeOfDay === 'day' ? 'night' : 'day';
            updateBackgroundColor();
        }
    }
}

// 배경색 업데이트
function updateBackgroundColor() {
    if (timeOfDay === 'night') {
        canvas.style.background = 'linear-gradient(to bottom, #2c3e50 0%, #34495e 100%)';
    } else {
        canvas.style.background = 'linear-gradient(to bottom, #E0F6FF 0%, #FFF 70%)';
    }
}

// 충돌 체크 및 콤보 시스템
function checkCollisions() {
    for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];

        if (obstacle.collidesWith(dino)) {
            endGame();
            return;
        }

        // 장애물을 성공적으로 통과
        if (!obstacle.passed && obstacle.x + obstacle.width < dino.x) {
            obstacle.passed = true;
            combo++;
            maxCombo = Math.max(maxCombo, combo);

            // 콤보 파티클 효과
            if (combo % 5 === 0) {
                for (let j = 0; j < 10; j++) {
                    particles.push(new Particle(
                        dino.x + 20,
                        dino.y + 20,
                        '#f39c12'
                    ));
                }
            }
        }
    }
}

// 게임 종료
function endGame() {
    gameOver = true;
    gameRunning = false;
    gamePaused = false;

    const finalScore = Math.floor(score / 10);
    document.getElementById('finalScore').textContent = finalScore;

    // 콤보 정보 추가
    const gameOverDiv = document.getElementById('gameOver');
    const existingCombo = gameOverDiv.querySelector('.combo-info');
    if (existingCombo) {
        existingCombo.remove();
    }

    const comboInfo = document.createElement('p');
    comboInfo.className = 'combo-info';
    comboInfo.textContent = `최대 콤보: ${maxCombo}`;
    comboInfo.style.fontSize = '1.2em';
    comboInfo.style.color = '#f39c12';
    gameOverDiv.insertBefore(comboInfo, document.getElementById('restartBtn'));

    gameOverDiv.classList.remove('hidden');

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
    gamePaused = false;
    score = 0;
    combo = 0;
    maxCombo = 0;
    gameSpeed = 9;
    obstacleInterval = 70;
    obstacles = [];
    particles = [];
    obstacleTimer = 0;
    dino.y = 0;
    dino.dy = 0;
    dino.ducking = false;
    timeOfDay = 'day';
    updateBackgroundColor();
    document.getElementById('gameOver').classList.add('hidden');
    document.getElementById('score').textContent = 0;
}

// 일시정지 토글
function togglePause() {
    if (gameRunning && !gameOver) {
        gamePaused = !gamePaused;
    }
}

// 장애물 생성 로직 개선
function spawnObstacle() {
    const rand = Math.random();
    let obstacleType;

    // 점수에 따라 새 등장 확률 증가
    const birdChance = Math.min(0.3, score / 5000);

    if (rand < birdChance) {
        obstacleType = 'bird';
    } else {
        // 다양한 선인장 타입
        const types = ['single', 'double', 'triple', 'tall', 'small'];
        obstacleType = types[Math.floor(Math.random() * types.length)];
    }

    obstacles.push(new Obstacle(obstacleType));
}

// 게임 루프
function gameLoop() {
    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 배경 요소 그리기
    drawStars();
    drawSun();
    drawMountains();
    drawClouds();
    drawGround();

    // 파티클 업데이트 및 그리기
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].isDead()) {
            particles.splice(i, 1);
        }
    }

    if (gameRunning && !gamePaused) {
        // 공룡 업데이트 및 그리기
        dino.update();
        dino.draw();

        // 장애물 생성
        obstacleTimer++;
        if (obstacleTimer > obstacleInterval) {
            spawnObstacle();
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

        // 콤보 표시
        if (combo > 0) {
            ctx.fillStyle = '#f39c12';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`콤보 x${combo}`, 20, 50);
        }

    } else if (gamePaused) {
        // 일시정지 상태
        dino.draw();
        obstacles.forEach(obs => obs.draw());

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('일시정지', canvas.width / 2, canvas.height / 2 - 20);

        ctx.font = '20px Arial';
        ctx.fillText('ESC 또는 P 키를 눌러 재개', canvas.width / 2, canvas.height / 2 + 20);

    } else if (!gameOver) {
        // 게임 시작 전
        dino.y = canvas.height - 100 - dino.height;
        dino.draw();

        ctx.fillStyle = timeOfDay === 'night' ? '#ecf0f1' : '#2c3e50';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🦖 공룡 게임', canvas.width / 2, canvas.height / 2 - 40);

        ctx.font = '20px Arial';
        ctx.fillText('스페이스바를 눌러 시작하세요!', canvas.width / 2, canvas.height / 2);

        ctx.font = '16px Arial';
        ctx.fillStyle = '#7f8c8d';
        ctx.fillText('↑ 점프 | ↓ 숙이기 | ESC/P 일시정지', canvas.width / 2, canvas.height / 2 + 40);
    }

    requestAnimationFrame(gameLoop);
}

// 키보드 이벤트
let keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    // 일시정지
    if ((e.code === 'Escape' || e.code === 'KeyP') && gameRunning && !gameOver) {
        e.preventDefault();
        togglePause();
        return;
    }

    if ((e.code === 'Space' || e.code === 'ArrowUp') && !gameOver && !gamePaused) {
        e.preventDefault();
        if (!gameRunning) {
            startGame();
        } else {
            dino.jump();
        }
    }

    if (e.code === 'ArrowDown' && gameRunning && !gamePaused) {
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
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
    if (!gameRunning || gamePaused) return;

    const touchY = e.touches[0].clientY;
    const diff = touchStartY - touchY;

    if (diff > 30) {
        // 위로 스와이프 - 점프
        dino.jump();
    } else if (diff < -30) {
        // 아래로 스와이프 - 숙이기
        dino.duck(true);
    }
}, { passive: true });

canvas.addEventListener('touchend', () => {
    dino.duck(false);
}, { passive: true });

canvas.addEventListener('click', () => {
    if (!gameRunning && !gameOver) {
        startGame();
    } else if (gameRunning && !gamePaused) {
        dino.jump();
    }
});

// 재시작 버튼
document.getElementById('restartBtn').addEventListener('click', () => {
    startGame();
});

// 게임 시작
updateBackgroundColor();
gameLoop();
