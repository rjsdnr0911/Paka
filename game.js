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
    volcano1: new Image(),
    volcano2: new Image(),
    volcano3: new Image(),
    caution: new Image(),
    hi: new Image(),
    button: new Image(),
    boo: new Image(),
    boo2: new Image(),
    monster: new Image(), // MONSTER EVENT
    monster2: new Image(), // MONSTER EVENT
    lightning1: new Image(), // MONSTER EVENT
    lightning2: new Image(), // MONSTER EVENT
    lightning3: new Image(), // MONSTER EVENT
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
images.caution.src = 'caution.png';
images.volcano1.src = 'volcano.png';
images.volcano2.src = 'volcano2.png';
images.volcano3.src = 'volcano3.png';
images.meteor = new Image(); // METEOR FEATURE
images.meteor.src = 'meteor.png'; // METEOR FEATURE
images.meteor2 = new Image(); // METEOR FEATURE
images.meteor2.src = 'meteor2.png'; // METEOR FEATURE
images.heart = new Image(); // HEALTH FEATURE
images.heart.src = 'heart.png'; // HEALTH FEATURE
images.heartEmpty = new Image(); // HEALTH FEATURE
images.heartEmpty.src = 'heart2.png'; // HEALTH FEATURE
images.monster.src = 'illusion.png'; // MONSTER EVENT
images.monster2.src = 'illusion2.png'; // MONSTER EVENT
images.lightning1.src = 'lightning1.png'; // MONSTER EVENT
images.lightning2.src = 'lightning2.png'; // MONSTER EVENT
images.lightning3.src = 'lightning3.png'; // MONSTER EVENT

// 이미지 로드 완료 체크
let imagesLoaded = 0;
let totalImages = 43; // 38 + 5 (monster1, 2, lightning1, 2, 3)
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

// 화산 관련 상수 // VOLCANO FEATURE
const VOLCANO_SCALE = 0.4; // 선인장과 비슷한 위압감을 위해 확대
const VOLCANO_Y_OFFSET = 12; // [추가] 이미지 하단 여백을 없애기 위한 Y축 보정값 (12px 아래로)
const VOLCANO_WARNING_DISPLAY_FRAMES = 15; // [추가] 경고 아이콘 표시 시간 (약 0.25초)
const WARNING_SCALE = 0.25; // 경고 이미지는 기존 크기 유지
const VOLCANO_SPAWN_PROBABILITY = 0.05; // 10% -> 5% 확률로 추가 하향 조정
const MONSTER_EVENT_PROBABILITY = 0.02; // [추가] 몬STER 이벤트 발생 확률 (~2% 수준으로 상향)

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
let lightningTimer = 0; // MONSTER EVENT: duration (frames)
let lightningX = 0; // MONSTER EVENT: strike position

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

        // [수정] 솟구침 동작과 폭발 로직 분리 (장애물당 폭발 1회 제한)
        if (this.isRising && this.x < GAME_WIDTH / 2) {
            this.y = this.initialY - 83; // 솟구침 상태 유지
            if (!this.hasRisen) {
                // 폭발 효과 추가 (최초 1회만 실행)
                explosions.push(new Explosion(this.x, this.initialY + this.height, this.width, this.height)); // FIX: ground explosion position
                this.hasRisen = true;
            }
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
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
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

        // 0.5초 동안 boo에서 boo2로 딱 한 번만 전환 (15프레임 기준)
        const img = this.frame < 15 ? images.boo : images.boo2;

        // [폭발 위치/크기 연출] 중앙 기준 확대를 위한 좌표 계산 (x는 선인장 중앙, y는 지면(전달받은 y) 기준)
        const baseScale = 3.5 + (this.frame / this.maxFrames) * 0.5;
        const drawWidth = this.width * baseScale; // FIX: keep explosion aspect ratio
        const drawHeight = drawWidth * (img.height / img.width); // FIX: keep explosion aspect ratio

        const drawX = this.x - (drawWidth - this.width) / 2;
        const drawY = this.y - drawHeight / 2 - 15; // FIX: lift explosion above ground

        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    }
}

// METEOR FEATURE
class Meteor {
    constructor() {
        this.width = 180; // meteor size increased
        this.height = 180; // meteor size increased

        // METEOR FEATURE: Animation setup
        this.speed = 4 + Math.random() * 2;
        this.y = -this.height;

        // meteor spawn range (constant-based)
        // Set spawn x relative to Trex to ensure it lands in a challenging range
        // Roughly 200px ahead of Trex + random variation
        this.x = trex.x + 200 + Math.random() * 200;

        this.remove = false;
        this.animFrame = 0; // METEOR FEATURE: Animation frame
        this.animDelay = 0; // METEOR FEATURE: Animation delay
    }

    update() {
        // 45도 대각선 아래로 이동 (오른쪽에서 왼쪽으로)
        this.x -= this.speed;
        this.y += this.speed;

        // METEOR FEATURE: Animation update
        this.animDelay++;
        if (this.animDelay > 10) { // 10프레임마다 이미지 교체
            this.animFrame = this.animFrame === 0 ? 1 : 0;
            this.animDelay = 0;
        }

        // 화면 밖으로 완전히 나가면 제거
        if (this.y > GAME_HEIGHT || this.x < -this.width) {
            this.remove = true;
        }
    }

    draw() {
        // METEOR FEATURE: Animation draw
        const img = this.animFrame === 0 ? images.meteor : images.meteor2;
        ctx.drawImage(img, this.x, this.y, this.width, this.height);
    }

    getHitbox() {
        // METEOR FEATURE: Adjusted hitbox for larger size
        // inscribed hitbox for meteor (intentionally much smaller than sprite)
        const hbWidth = this.width * 0.225;
        const hbHeight = this.height * 0.225;
        return {
            x: this.x + (this.width - hbWidth) / 2,
            y: this.y + (this.height - hbHeight) / 2,
            width: hbWidth,
            height: hbHeight
        };
    }

    collidesWith(trex) {
        const trexHitbox = trex.getHitbox();
        const meteorHitbox = this.getHitbox();

        return (
            trexHitbox.x < meteorHitbox.x + meteorHitbox.width &&
            trexHitbox.x + trexHitbox.width > meteorHitbox.x &&
            trexHitbox.y < meteorHitbox.y + meteorHitbox.height &&
            trexHitbox.y + trexHitbox.height > meteorHitbox.y
        );
    }
}
// METEOR FEATURE

// VOLCANO FEATURE
class Volcano {
    constructor() {
        this.type = 'VOLCANO';
        this.x = GAME_WIDTH + 50;
        this.state = 'WARNING'; // 'WARNING' or 'ACTIVE'
        this.timer = 60; // 1 second warning at 60fps
        this.remove = false;
        this.groundY = 135; // Ground line (horizon.groundY is 135)

        // Initial dimensions for caution icon with scale
        this.width = (images.caution.width || 30) * WARNING_SCALE;
        this.height = (images.caution.height || 30) * WARNING_SCALE;
        this.y = this.groundY - this.height + VOLCANO_Y_OFFSET; // Anchor to bottom with offset

        // [추가] 고정 히트박스 크기 (가장 기본인 volcano1 기준)
        this.hitboxWidth = images.volcano1.width * VOLCANO_SCALE;
        this.hitboxHeight = images.volcano1.height * VOLCANO_SCALE;

        this.animFrame = 0;
        this.animDelay = 0;
    }

    update() {
        this.x -= currentSpeed;

        if (this.state === 'WARNING') {
            this.timer--;
            // Caution icon height is constant, but let's keep it robust
            this.width = images.caution.width * WARNING_SCALE;
            this.height = images.caution.height * WARNING_SCALE;
            this.y = this.groundY - this.height + VOLCANO_Y_OFFSET;

            if (this.timer <= 0) {
                this.state = 'ACTIVE';
            }
        } else {
            // Volcano animation
            this.animDelay++;
            if (this.animDelay > 10) {
                this.animFrame = (this.animFrame + 1) % 3;
                this.animDelay = 0;
            }

            // [FIX] Update dimensions and y based on CURRENT frame image to keep bottom anchored
            const volcanoImages = [images.volcano1, images.volcano2, images.volcano3];
            const currentImg = volcanoImages[this.animFrame];
            this.width = currentImg.width * VOLCANO_SCALE;
            this.height = currentImg.height * VOLCANO_SCALE;
            this.y = this.groundY - this.height + VOLCANO_Y_OFFSET; // Always keep bottom at groundY + offset
        }

        if (this.x + this.width + 100 < 0) { // Extra margin for large volcanoes
            this.remove = true;
        }
    }

    draw() {
        if (!allImagesLoaded) return;

        if (this.state === 'WARNING') {
            // [수정] 경고 상태 시작 후 처음 15프레임(약 0.25초) 동안만 아이콘을 그림
            if (60 - this.timer < VOLCANO_WARNING_DISPLAY_FRAMES) {
                const img = images.caution;
                const drawScale = WARNING_SCALE;
                ctx.drawImage(img, this.x, this.y, img.width * drawScale, img.height * drawScale);
            }
        } else {
            const volcanoImages = [images.volcano1, images.volcano2, images.volcano3];
            const img = volcanoImages[this.animFrame];
            const drawScale = VOLCANO_SCALE;
            // Use this.y which is calculated in update() to be anchored to groundY
            ctx.drawImage(img, this.x, this.y, img.width * drawScale, img.height * drawScale);
        }
    }

    collidesWith(trex) {
        if (this.state === 'WARNING') return false;

        const trexBox = trex.getHitbox();
        // [수정] 충돌 판정을 극단적으로 여유 있게 하기 위해 버퍼(여백) 크기를 더 늘림 (30 -> 45)
        // 사실상 화산 최하단 중앙의 아주 작은 영역만 히트박스로 남게 됨
        const buffer = 45 * VOLCANO_SCALE;

        // [수정] 애니메이션 프레임에 상관없이 고정된 히트박스 좌표/크기 사용
        const obsBox = {
            x: this.x + buffer,
            y: (this.groundY - this.hitboxHeight + VOLCANO_Y_OFFSET) + buffer,
            width: this.hitboxWidth - buffer * 2,
            height: this.hitboxHeight - buffer * 2
        };

        return !(
            trexBox.x + trexBox.width < obsBox.x ||
            trexBox.x > obsBox.x + obsBox.width ||
            trexBox.y + trexBox.height < obsBox.y ||
            trexBox.y > obsBox.y + obsBox.height
        );
    }
}
// VOLCANO FEATURE

// MONSTER EVENT
class Monster {
    constructor(x) {
        this.type = 'MONSTER';
        this.x = x;
        this.remove = false;
        this.animFrame = 0;
        this.animDelay = 0;

        // Initial dimensions (based on first image)
        this.width = 60; // Standard size for monster
        this.height = 60;
        this.y = 145 - this.height; // ground alignment

        // Fixed hitbox (similar to volcano or slightly more forgiving)
        this.hitboxWidth = 40;
        this.hitboxHeight = 40;
    }

    update() {
        this.x -= currentSpeed;

        // Animation
        this.animDelay++;
        if (this.animDelay > 10) {
            this.animFrame = this.animFrame === 0 ? 1 : 0;
            this.animDelay = 0;
        }

        if (this.x + this.width < 0) {
            this.remove = true;
        }
    }

    draw() {
        if (!allImagesLoaded) return;
        const img = this.animFrame === 0 ? images.monster : images.monster2;
        ctx.drawImage(img, this.x, this.y, this.width, this.height);
    }

    collidesWith(trex) {
        const trexBox = trex.getHitbox();
        const bufferX = (this.width - this.hitboxWidth) / 2;
        const bufferY = (this.height - this.hitboxHeight) / 2;

        const obsBox = {
            x: this.x + bufferX,
            y: this.y + bufferY,
            width: this.hitboxWidth,
            height: this.hitboxHeight
        };

        return !(
            trexBox.x + trexBox.width < obsBox.x ||
            trexBox.x > obsBox.x + obsBox.width ||
            trexBox.y + trexBox.height < obsBox.y ||
            trexBox.y > obsBox.y + obsBox.height
        );
    }
}
// MONSTER EVENT
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

// HEALTH FEATURE
class HealthSystem {
    constructor() {
        this.maxHealth = 3;
        this.currentHealth = this.maxHealth;
        this.invincibleDuration = 120; // 2 seconds at 60fps
        this.invincibleTimer = 0;
        this.blinkInterval = 10; // Blink every 10 frames
    }

    reset() {
        this.currentHealth = this.maxHealth;
        this.invincibleTimer = 0;
    }

    takeDamage() {
        if (this.invincibleTimer > 0) return false;

        this.currentHealth--;
        if (this.currentHealth > 0) {
            this.invincibleTimer = this.invincibleDuration;
            return false;
        } else {
            return true; // Game Over
        }
    }

    update() {
        if (this.invincibleTimer > 0) {
            this.invincibleTimer--;
        }
    }

    isInvincible() {
        return this.invincibleTimer > 0;
    }

    shouldDrawPlayer() {
        // If not invincible, always draw
        if (this.invincibleTimer <= 0) return true;

        // Blink effect: draw only if in specific intervals
        return Math.floor(this.invincibleTimer / this.blinkInterval) % 2 === 0;
    }

    draw() {
        if (!allImagesLoaded) return;

        const startX = 10;
        const startY = 10;
        const spacing = 5;
        const heartSize = 20; // 하트 크기를 고정 (공룡 44px 보다 작게)

        for (let i = 0; i < this.maxHealth; i++) {
            let img = (i < this.currentHealth) ? images.heart : images.heartEmpty;
            ctx.drawImage(img, startX + (heartSize + spacing) * i, startY, heartSize, heartSize);
        }
    }
}
// HEALTH FEATURE

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
const healthSystem = new HealthSystem(); // HEALTH FEATURE
const horizon = new Horizon();
const scoreBoard = new ScoreBoard();
const gameOverPanel = new GameOverPanel();
let obstacles = [];
let clouds = [];
let explosions = [];
let meteors = []; // METEOR FEATURE
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

// [수정] 장애물 생성: 생성 시점의 점수(score)로 모든 속성 결정
function spawnObstacle() {
    const score = Math.floor(distanceRan * 0.025);

    // 점수에 따라 장애물 타입 결정
    let type = 'CACTUS';
    if (score > 400 && Math.random() < 0.3) {
        type = 'BIRD';
    } else if (score > 200 && Math.random() < 0.15) {
        type = 'CACTUS_TRANSPARENT';
    }

    // [수정] 솟구침 여부는 생성 시점에 고정 (100점 이후 20% 확률 유지)
    let isRising = false;
    if (type === 'CACTUS' && score > 100 && Math.random() < 0.2) {
        isRising = true;
    }

    // VOLCANO FEATURE: Spawn volcano after 300 points
    if (score > 300 && Math.random() < VOLCANO_SPAWN_PROBABILITY) {
        obstacles.push(new Volcano());
        return; // Avoid spawning both cactus and volcano in the same frame if possible
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
    const score = Math.floor(distanceRan * 0.025);

    // 낮/밤 모드 체크
    checkNightMode();

    // 속도 증가 (프레임 단위 가속)
    if (currentSpeed < MAX_SPEED) {
        currentSpeed += ACCELERATION;
    }

    // 공룡 업데이트
    trex.update();

    // [DEBUG] 400점 이상 무조건 몬스터 이벤트 발생 (확률 제거)
    if (score >= 400 && lightningTimer === 0) {
        lightningTimer = 60; // 1초 (60fps 기준)
        lightningX = GAME_WIDTH / 2 + Math.random() * (GAME_WIDTH / 2 - 100);
        obstacles.push(new Monster(lightningX));

        console.log(`[DEBUG] Lightning spawned! score: ${score}, x: ${lightningX}`); // 콘솔 로그 추가
    }

    if (lightningTimer > 0) {
        lightningTimer--;
    }

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

    // 메테오 업데이트 및 충돌 체크 // METEOR FEATURE
    if (Math.random() < 0.01) { // 약 1% 확률로 생성 // METEOR FEATURE
        meteors.push(new Meteor()); // METEOR FEATURE
    } // METEOR FEATURE
    meteors.forEach(meteor => { // METEOR FEATURE
        meteor.update(); // METEOR FEATURE
        if (meteor.collidesWith(trex)) { // METEOR FEATURE
            // HEALTH FEATURE: Modified collision logic
            if (!healthSystem.isInvincible()) {
                if (healthSystem.takeDamage()) {
                    gameOver = true;
                    trex.crashed = true;
                }
            }
        } // METEOR FEATURE
    }); // METEOR FEATURE
    meteors = meteors.filter(meteor => !meteor.remove); // METEOR FEATURE

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
            // HEALTH FEATURE: Modified collision logic
            if (!healthSystem.isInvincible()) {
                if (healthSystem.takeDamage()) {
                    trex.crashed = true;
                    gameOver = true;

                    // 최고 점수 저장 (게임 오버 시에만)
                    const finalScore = Math.floor(distanceRan * 0.025);
                    if (finalScore > highScore) {
                        highScore = finalScore;
                        localStorage.setItem('highScore', highScore);
                    }
                }
            }
        }
    });
    obstacles = obstacles.filter(obstacle => !obstacle.remove);

    // 폭발 업데이트
    explosions.forEach(exp => exp.update());
    explosions = explosions.filter(exp => !exp.remove);

    // HEALTH FEATURE: Update health system
    healthSystem.update();
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

    // 메테오 그리기 // METEOR FEATURE
    meteors.forEach(meteor => meteor.draw()); // METEOR FEATURE

    // [수정] MONSTER EVENT: 색 반전 효과 시작
    if (lightningTimer > 0) {
        ctx.save();
        ctx.filter = 'invert(1)';
    }

    // 모든 객체 그리기
    horizon.draw();

    // 장애물
    obstacles.forEach(obstacle => obstacle.draw());

    // 공룡
    // HEALTH FEATURE: Blink effect
    if (healthSystem.shouldDrawPlayer()) {
        trex.draw();
    }

    // 폭발 (밤 모드 반전 효과 전후 위치 고려 - 반전 효과 전에 그려야 밤 모드에서 색 반전이 일어남)
    explosions.forEach(exp => exp.draw());

    // 점수
    // 점수
    scoreBoard.draw();

    // [추가] MONSTER EVENT: 번개를 가장 마지막에(위에) 그림
    if (lightningTimer > 0) {
        // 번개 이미지 애니메이션 (1, 2, 3 순환)
        const lImg = [images.lightning1, images.lightning2, images.lightning3][Math.floor(frameCount / 3) % 3];
        const lWidth = 40;
        const lHeight = GAME_HEIGHT;
        ctx.drawImage(lImg, lightningX + (60 - lWidth) / 2, 0, lWidth, lHeight);

        ctx.restore();
    }

    // HEALTH FEATURE: Draw hearts
    healthSystem.draw();

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
    meteors = []; // METEOR FEATURE
    explosions = [];
    trex.reset();
    healthSystem.reset(); // HEALTH FEATURE
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
