# 🦖 공룡 게임 (Dino Game)

Chrome 오프라인 공룡 게임 스타일 - 생명 3개 시스템 적용!

![Python](https://img.shields.io/badge/Python-3.8+-blue?logo=python&logoColor=white)
![Pygame](https://img.shields.io/badge/Pygame-2.5.0+-green?logo=python&logoColor=white)
![Version](https://img.shields.io/badge/version-3.0-orange)

## 🎮 바로 플레이하기

**GitHub Pages에서 즉시 플레이**: [여기를 클릭하세요!](https://rjsdnr0911.github.io/Paka/)

브라우저에서 바로 게임을 즐길 수 있습니다. 설치 불필요!

### 조작 방법
- **스페이스바** 또는 **↑**: 점프
- **↓**: 숙이기
- 게임 오버 후 **스페이스바**: 재시작

## ✨ 주요 기능

### 💖 새로운! 하트 시스템
- ❤️ **생명 3개** - 장애물에 부딪혀도 2번 더 기회가 있습니다!
- ✨ **무적 시간** - 충돌 후 1초간 무적 상태 (깜빡임 효과)
- 🎨 **픽셀아트 하트** - Chrome 스타일의 흑백 하트 UI

### 🎮 게임플레이
- ✅ **공룡 캐릭터** - Chrome 공룡게임과 동일한 픽셀아트 스타일
- ✅ **점프 & 숙이기** - 스페이스바/위 화살표로 점프, 아래 화살표로 숙이기
- ✅ **2가지 선인장 타입** - 단일, 더블 선인장
- ✅ **날아다니는 새** - 날개 펄럭이는 애니메이션
- ✅ **Chrome 스타일 UI** - 실제 공룡게임과 동일한 흑백 디자인

### 💎 UI/UX
- 📊 **실시간 점수** - 현재 점수와 최고 점수 표시 (Chrome 스타일)
- 🏆 **최고 점수 저장** - localStorage/JSON 파일에 자동 저장
- 💖 **하트 표시** - 상단에 남은 생명 표시
- 🎭 **부드러운 애니메이션** - 60 FPS 고정 프레임
- 🖥️ **크로스 플랫폼** - 웹(모든 브라우저) + Python(Windows, Mac, Linux)

## 🚀 실행 방법

### 방법 1: 웹 브라우저 (추천!)

**가장 간단한 방법** - 설치 불필요!

1. **GitHub Pages**: [https://rjsdnr0911.github.io/Paka/](https://rjsdnr0911.github.io/Paka/)
2. 또는 로컬에서: `index.html` 파일을 브라우저에서 열기

### 방법 2: Python 버전

**필수 요구사항**:
- Python 3.8 이상
- pygame 라이브러리

**실행 단계**:

```bash
# 1. 레포지토리 클론
git clone https://github.com/rjsdnr0911/Paka.git
cd Paka

# 2. pygame 설치
pip install pygame

# 3. 게임 실행
python dino_game.py
```

## 🎯 조작법

| 키 | 동작 |
|---|---|
| `스페이스바` 또는 `↑` | 점프 |
| `↓` | 숙이기 |
| `ESC` 또는 `P` | 일시정지/재개 |

## 🎮 게임 규칙

1. **목표**: 장애물을 피하면서 최대한 오래 생존하기
2. **생명**: 3개의 하트로 시작, 충돌 시 1개씩 감소
3. **무적 시간**: 충돌 후 1초간 무적 (공룡이 깜빡임)
4. **점수**: 시간이 지날수록 자동으로 증가
5. **난이도**: 100점마다 게임 속도 증가, 장애물 생성 간격 감소
6. **새 등장**: 점수 100점 이상부터 새가 등장

## 📁 파일 구조

```
Paka/
├── index.html           # 웹 게임 (GitHub Pages)
├── game.js             # 게임 로직 (JavaScript)
├── dino_game.py        # Python 버전
├── code-viewer.html    # Python 코드 복사 웹사이트
├── requirements.txt    # Python 의존성
├── high_score.json     # 최고 점수 저장 (자동 생성)
├── README.md          # 프로젝트 문서
└── web_version/       # 웹 버전 백업
    ├── index.html
    └── game.js
```

## 🏗️ 코드 구조

### JavaScript 버전 (game.js)

```javascript
- dino              // 공룡 캐릭터 객체
- Obstacle          // 장애물 클래스 (선인장, 새)
- Cloud             // 구름 클래스
- drawHearts()      // 하트 UI 그리기
- update()          // 게임 업데이트
- draw()            // 게임 렌더링
```

### Python 버전 (dino_game.py)

```python
- Dino              # 공룡 캐릭터 클래스
- Obstacle          # 장애물 클래스 (선인장, 새)
- Cloud             # 구름 클래스
- Game              # 메인 게임 클래스
```

### 주요 상수

```javascript
// JavaScript & Python 공통
SCREEN_WIDTH = 600    // 화면 너비
SCREEN_HEIGHT = 150   // 화면 높이
FPS = 60             // 프레임레이트
GRAVITY = 0.6        // 중력
JUMP_POWER = -10     // 점프 힘
GROUND_Y = 97        // 바닥 Y 좌표
```

## 🎯 게임 특징 상세

### 💖 하트 시스템
- **3개의 생명**: 게임 시작 시 하트 3개
- **충돌 처리**: 장애물에 부딪히면 하트 1개 감소
- **무적 시간**: 충돌 후 60프레임(1초) 동안 무적
- **시각 효과**: 무적 상태에서 공룡과 하트가 깜빡임
- **중복 충돌 방지**: 동일 장애물에 여러 번 부딪히지 않도록 처리

### 장애물 시스템
- **2종류의 선인장**: Single (단일), Double (더블) - Chrome 게임과 동일
- **날아다니는 새**: 날개 펄럭이는 애니메이션
- **스마트 스폰**: 점수 100점 이상부터 새 등장 (10% 확률)
- **충돌 감지**: 여유 있는 히트박스로 공정한 게임플레이

### UI 시스템
- **Chrome 스타일 점수**: 5자리 숫자, Courier New 폰트
- **최고 점수**: "HI" 접두사와 함께 표시
- **흑백 디자인**: #535353 (진한 회색), #c9c9c9 (연한 회색), 흰 배경
- **픽셀아트**: 모든 요소가 픽셀 단위로 그려짐

## 📊 게임 난이도 곡선

```javascript
// 100점마다 속도 증가
if (score % 100 === 0) {
    gameSpeed += 0.5
    obstacleInterval = max(50, obstacleInterval - 5)
}

// 새 등장 확률
if (score > 100 && random() < 0.1) {
    spawnBird()  // 10% 확률
}
```

## 🔧 커스터마이징

### JavaScript 버전 (game.js)

`game.js` 파일 상단의 변수를 수정:

```javascript
let gameSpeed = 6;          // 초기 속도
let gravity = 0.6;          // 중력
const jumpPower = -10;      // 점프 힘
let lives = 3;              // 하트 개수
```

### Python 버전 (dino_game.py)

```python
SCREEN_WIDTH = 600      # 화면 너비
SCREEN_HEIGHT = 150     # 화면 높이
GRAVITY = 0.6          # 중력
JUMP_POWER = -10       # 점프 힘
FPS = 60               # 프레임레이트
```

## 🎨 기술 스택

### 웹 버전
- **HTML5 Canvas** - 2D 렌더링
- **JavaScript (ES6+)** - 게임 로직
- **localStorage** - 최고 점수 저장
- **GitHub Pages** - 호스팅

### Python 버전
- **Python 3.8+** - 프로그래밍 언어
- **Pygame 2.5.0+** - 게임 개발 라이브러리
- **JSON** - 최고 점수 저장

## 🐛 개선 예정

- [ ] 사운드 효과 (점프, 충돌, 게임오버)
- [ ] BGM 추가
- [ ] 모바일 터치 컨트롤 개선
- [ ] 더 많은 장애물 변형
- [ ] 난이도 선택 옵션

## 🤝 기여

Pull Request를 환영합니다! 개선 사항이나 버그 제보는 이슈로 등록해주세요.

## 📜 라이센스

이 프로젝트는 교육 목적으로 만들어졌습니다.

## 🙏 감사의 말

Chrome 오프라인 공룡 게임에서 영감을 받았습니다.

---

## 🆚 웹 버전 vs Python 버전

| 기능 | 웹 버전 | Python 버전 |
|-----|--------|------------|
| 실행 환경 | 브라우저 | Python 3.8+ |
| 설치 | 불필요 | pygame 필요 |
| 크로스 플랫폼 | ✅ | ✅ |
| 오프라인 플레이 | ✅ | ✅ |
| 성능 | 60 FPS | 60 FPS 고정 |
| 커스터마이징 | 쉬움 | 쉬움 |
| 모바일 지원 | ✅ | ❌ |
| GitHub Pages | ✅ | ❌ |
| 하트 시스템 | ✅ | ✅ |

**추천**: 웹 버전! 설치 없이 바로 플레이 가능합니다.

---

## 🎯 게임 팁

1. **하트 관리**: 3개의 생명이 있으니 너무 조심스럽게 플레이하지 마세요
2. **무적 시간 활용**: 충돌 후 1초간 무적이므로 다음 장애물 준비 시간을 확보하세요
3. **타이밍**: 장애물을 정확히 파악하고 최적의 타이밍에 점프하세요
4. **숙이기 활용**: 새는 점프보다 숙이기가 더 안전합니다
5. **속도 적응**: 게임이 빨라질수록 미리 장애물을 인지하는 것이 중요합니다

---

**즐거운 게임 되세요!** 🎮🦖💖

최고 점수에 도전해보세요! 💪
