#!/usr/bin/env python3
"""
공룡 게임 (Dino Game) - Python Pygame 버전
Chrome 오프라인 공룡 게임을 재현하고 크게 개선한 버전
"""

import pygame
import random
import sys
import json
import os
from dataclasses import dataclass
from typing import List, Tuple
from enum import Enum

# 초기화
pygame.init()

# 화면 설정
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 400
FPS = 60

# 색상
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
GRAY = (128, 128, 128)
DARK_GRAY = (44, 62, 80)
LIGHT_GRAY = (149, 165, 166)
GREEN = (39, 174, 96)
DARK_GREEN = (34, 153, 84)
ORANGE = (243, 156, 18)
GOLD = (241, 196, 15)
SKY_BLUE = (224, 246, 255)
NIGHT_BLUE = (44, 62, 80)
MOON_WHITE = (236, 240, 241)

# 게임 설정
GRAVITY = 0.8
JUMP_POWER = -15
GROUND_Y = 300
INITIAL_GAME_SPEED = 9


class TimeOfDay(Enum):
    """낮/밤 모드"""
    DAY = "day"
    NIGHT = "night"


@dataclass
class Particle:
    """파티클 효과"""
    x: float
    y: float
    vx: float
    vy: float
    size: float
    life: float
    decay: float
    color: Tuple[int, int, int]

    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.life -= self.decay

    def draw(self, screen):
        if self.life > 0:
            alpha = int(255 * self.life)
            surf = pygame.Surface((int(self.size * 2), int(self.size * 2)), pygame.SRCALPHA)
            color_with_alpha = (*self.color, alpha)
            pygame.draw.circle(surf, color_with_alpha, (int(self.size), int(self.size)), int(self.size))
            screen.blit(surf, (int(self.x - self.size), int(self.y - self.size)))

    def is_dead(self):
        return self.life <= 0


class Dino:
    """공룡 캐릭터"""
    def __init__(self):
        self.x = 50
        self.y = GROUND_Y
        self.width = 44
        self.height = 52
        self.vy = 0
        self.grounded = True
        self.ducking = False
        self.jump_power = JUMP_POWER
        self.frame = 0

    def update(self):
        # 중력 적용
        self.vy += GRAVITY
        self.y += self.vy

        # 바닥 체크
        ground_y = GROUND_Y if not self.ducking else GROUND_Y + 26
        if self.y >= ground_y:
            self.y = ground_y
            self.vy = 0
            self.grounded = True
        else:
            self.grounded = False

        self.frame += 1

    def jump(self):
        if self.grounded and not self.ducking:
            self.vy = self.jump_power
            self.grounded = False
            return True
        return False

    def duck(self, is_ducking):
        if self.grounded:
            self.ducking = is_ducking

    def draw(self, screen):
        if self.ducking:
            # 숙인 자세
            duck_y = self.y
            # 몸통
            pygame.draw.rect(screen, DARK_GRAY, (self.x, duck_y, 50, 20))
            # 머리
            pygame.draw.rect(screen, DARK_GRAY, (self.x + 40, duck_y - 8, 20, 16))
            # 눈
            pygame.draw.rect(screen, WHITE, (self.x + 50, duck_y - 4, 4, 4))
            # 꼬리
            pygame.draw.rect(screen, GRAY, (self.x - 10, duck_y + 5, 15, 8))
        else:
            # 머리
            pygame.draw.rect(screen, DARK_GRAY, (self.x + 20, self.y, 24, 18))
            # 입
            pygame.draw.rect(screen, WHITE, (self.x + 38, self.y + 10, 6, 2))
            # 눈
            pygame.draw.rect(screen, WHITE, (self.x + 32, self.y + 4, 6, 6))
            pygame.draw.rect(screen, BLACK, (self.x + 34, self.y + 6, 2, 2))

            # 몸통
            pygame.draw.rect(screen, DARK_GRAY, (self.x + 14, self.y + 18, 26, 28))
            # 배
            pygame.draw.rect(screen, GRAY, (self.x + 18, self.y + 24, 18, 18))

            # 팔
            arm_offset = 2 if (self.frame // 3) % 2 == 0 else 0
            pygame.draw.rect(screen, DARK_GRAY, (self.x + 12, self.y + 22 + arm_offset, 8, 12))

            # 꼬리
            points = [(self.x + 10, self.y + 24), (self.x, self.y + 20), (self.x + 4, self.y + 32)]
            pygame.draw.polygon(screen, GRAY, points)

            # 다리
            leg_offset = 6 if (self.frame // 3) % 2 == 0 else 0
            # 왼쪽 다리
            pygame.draw.rect(screen, DARK_GRAY, (self.x + 16, self.y + 46, 8, 12 + leg_offset))
            pygame.draw.rect(screen, DARK_GRAY, (self.x + 14, self.y + 58 + leg_offset, 12, 4))
            # 오른쪽 다리
            pygame.draw.rect(screen, DARK_GRAY, (self.x + 28, self.y + 46, 8, 12 - leg_offset))
            pygame.draw.rect(screen, DARK_GRAY, (self.x + 26, self.y + 58 - leg_offset, 12, 4))

    def get_hitbox(self):
        if self.ducking:
            return pygame.Rect(self.x + 5, self.y, 45, 20)
        return pygame.Rect(self.x + 10, self.y + 5, 34, 52)


class Obstacle:
    """장애물 클래스"""
    def __init__(self, obstacle_type=None):
        self.x = SCREEN_WIDTH
        self.passed = False

        if obstacle_type == 'bird':
            self.type = 'bird'
            self.width = 40
            self.height = 30
            self.y = GROUND_Y - self.height - (60 if random.random() > 0.5 else 100)
            self.wing_frame = 0
        else:
            types = ['single', 'double', 'triple', 'tall', 'small']
            self.type = obstacle_type if obstacle_type in types else random.choice(types)

            if self.type == 'single':
                self.width, self.height = 20, 50
            elif self.type == 'double':
                self.width, self.height = 40, 50
            elif self.type == 'triple':
                self.width, self.height = 60, 50
            elif self.type == 'tall':
                self.width, self.height = 20, 70
            else:  # small
                self.width, self.height = 30, 30

            self.y = GROUND_Y - self.height

    def update(self, game_speed):
        self.x -= game_speed
        if self.type == 'bird':
            self.wing_frame += 0.3

    def draw(self, screen):
        if self.type == 'bird':
            # 새 그리기
            # 몸통
            pygame.draw.rect(screen, GRAY, (self.x + 10, self.y + 10, 20, 12))
            # 머리
            pygame.draw.rect(screen, GRAY, (self.x + 26, self.y + 8, 12, 10))
            # 눈
            pygame.draw.rect(screen, WHITE, (self.x + 32, self.y + 10, 3, 3))
            # 부리
            pygame.draw.rect(screen, (231, 76, 60), (self.x + 38, self.y + 12, 4, 2))

            # 날개
            wing_up = (self.wing_frame % 20) < 10
            if wing_up:
                pygame.draw.rect(screen, GRAY, (self.x + 8, self.y + 2, 18, 8))
                pygame.draw.rect(screen, GRAY, (self.x + 14, self.y + 22, 18, 8))
            else:
                pygame.draw.rect(screen, GRAY, (self.x + 8, self.y + 12, 18, 8))
                pygame.draw.rect(screen, GRAY, (self.x + 14, self.y + 12, 18, 8))
        else:
            self._draw_cactus(screen)

    def _draw_cactus(self, screen):
        if self.type == 'single':
            self._draw_single_cactus(screen, self.x, self.y, self.height)
        elif self.type == 'double':
            self._draw_single_cactus(screen, self.x, self.y, self.height)
            self._draw_single_cactus(screen, self.x + 22, self.y, self.height)
        elif self.type == 'triple':
            for i in range(3):
                self._draw_single_cactus(screen, self.x + i * 22, self.y, self.height)
        elif self.type == 'tall':
            self._draw_single_cactus(screen, self.x, self.y, self.height, tall=True)
        else:  # small
            for i in range(3):
                pygame.draw.rect(screen, GREEN, (self.x + i * 10, self.y + 10, 8, 20))
                pygame.draw.rect(screen, GREEN, (self.x + i * 10 + 2, self.y + 6, 4, 8))

    def _draw_single_cactus(self, screen, x, y, height, tall=False):
        # 메인 줄기
        pygame.draw.rect(screen, GREEN, (x + 6, y, 12, height))

        if tall:
            pygame.draw.rect(screen, GREEN, (x, y + 15, 10, 25))
            pygame.draw.rect(screen, GREEN, (x + 16, y + 20, 10, 20))
        else:
            pygame.draw.rect(screen, GREEN, (x, y + 12, 10, 20))
            pygame.draw.rect(screen, GREEN, (x, y + 12, 6, 4))
            pygame.draw.rect(screen, GREEN, (x + 14, y + 18, 10, 15))
            pygame.draw.rect(screen, GREEN, (x + 18, y + 18, 6, 4))

        # 가시
        for i in range(3):
            pygame.draw.rect(screen, DARK_GREEN, (x + 4, y + 10 + i * 12, 2, 2))
            pygame.draw.rect(screen, DARK_GREEN, (x + 16, y + 10 + i * 12, 2, 2))

    def is_off_screen(self):
        return self.x + self.width < 0

    def collides_with(self, dino):
        dino_hitbox = dino.get_hitbox()
        obstacle_hitbox = pygame.Rect(self.x + 5, self.y + 5, self.width - 10, self.height - 10)
        return dino_hitbox.colliderect(obstacle_hitbox)


class Background:
    """배경 요소"""
    def __init__(self):
        self.mountains = [
            {'x': i * 200 - 100, 'height': random.randint(60, 140), 'width': random.randint(100, 250)}
            for i in range(5)
        ]
        self.clouds = [
            {'x': random.randint(0, SCREEN_WIDTH), 'y': random.randint(30, 150), 'speed': random.uniform(1, 2)}
            for _ in range(5)
        ]
        self.stars = [
            {'x': random.randint(0, SCREEN_WIDTH), 'y': random.randint(0, GROUND_Y - 50),
             'size': random.randint(1, 3), 'twinkle': random.uniform(0, 6.28)}
            for _ in range(50)
        ]
        self.sun_angle = 0

    def update(self, game_speed, time_of_day):
        # 산 업데이트
        for mountain in self.mountains:
            mountain['x'] -= game_speed * 0.1
            if mountain['x'] + mountain['width'] < 0:
                mountain['x'] = SCREEN_WIDTH

        # 구름 업데이트
        for cloud in self.clouds:
            cloud['x'] -= cloud['speed'] * 0.6
            if cloud['x'] < -100:
                cloud['x'] = SCREEN_WIDTH + 50

        # 별 반짝임
        for star in self.stars:
            star['twinkle'] += 0.05

        self.sun_angle += 0.01

    def draw(self, screen, time_of_day, score):
        # 배경색
        if time_of_day == TimeOfDay.NIGHT:
            screen.fill(NIGHT_BLUE)
        else:
            screen.fill(SKY_BLUE)

        # 별 (밤에만)
        if time_of_day == TimeOfDay.NIGHT:
            for star in self.stars:
                alpha = int((abs(pygame.math.Vector2(1, 0).rotate(star['twinkle'] * 57.3).x) + 1) / 2 * 255)
                surf = pygame.Surface((star['size'] * 2, star['size'] * 2), pygame.SRCALPHA)
                color = (*WHITE, alpha)
                pygame.draw.circle(surf, color, (star['size'], star['size']), star['size'])
                screen.blit(surf, (star['x'], star['y']))

        # 해/달
        sun_x, sun_y = 700, 60
        if time_of_day == TimeOfDay.DAY:
            # 해
            pygame.draw.circle(screen, ORANGE, (sun_x, sun_y), 30)
            # 햇살
            for i in range(8):
                angle = (360 / 8) * i + self.sun_angle * 57.3
                rad = angle * 0.0174533
                start_x = sun_x + int(35 * pygame.math.Vector2(1, 0).rotate(angle).x)
                start_y = sun_y + int(35 * pygame.math.Vector2(1, 0).rotate(angle).y)
                end_x = sun_x + int(50 * pygame.math.Vector2(1, 0).rotate(angle).x)
                end_y = sun_y + int(50 * pygame.math.Vector2(1, 0).rotate(angle).y)
                pygame.draw.line(screen, ORANGE, (start_x, start_y), (end_x, end_y), 3)
        else:
            # 달
            pygame.draw.circle(screen, MOON_WHITE, (sun_x, sun_y), 30)
            pygame.draw.circle(screen, LIGHT_GRAY, (sun_x - 8, sun_y - 5), 6)
            pygame.draw.circle(screen, LIGHT_GRAY, (sun_x + 5, sun_y + 8), 4)

        # 산
        color = GRAY if time_of_day == TimeOfDay.NIGHT else LIGHT_GRAY
        for mountain in self.mountains:
            points = [
                (mountain['x'], GROUND_Y),
                (mountain['x'] + mountain['width'] / 2, GROUND_Y - mountain['height']),
                (mountain['x'] + mountain['width'], GROUND_Y)
            ]
            pygame.draw.polygon(screen, color, points)

        # 구름
        if time_of_day == TimeOfDay.NIGHT:
            cloud_color = (189, 195, 199, 100)
        else:
            cloud_color = (236, 240, 241, 230)

        for cloud in self.clouds:
            surf = pygame.Surface((70, 40), pygame.SRCALPHA)
            pygame.draw.circle(surf, cloud_color, (18, 20), 18)
            pygame.draw.circle(surf, cloud_color, (35, 20), 24)
            pygame.draw.circle(surf, cloud_color, (55, 20), 18)
            pygame.draw.circle(surf, cloud_color, (25, 12), 16)
            pygame.draw.circle(surf, cloud_color, (45, 12), 16)
            screen.blit(surf, (int(cloud['x']), int(cloud['y'])))


class Game:
    """메인 게임 클래스"""
    def __init__(self):
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("🦖 공룡 게임 (Dino Game)")
        self.clock = pygame.time.Clock()
        self.font = pygame.font.Font(None, 36)
        self.big_font = pygame.font.Font(None, 72)
        self.small_font = pygame.font.Font(None, 24)

        self.reset_game()
        self.high_score = self.load_high_score()

    def reset_game(self):
        self.dino = Dino()
        self.obstacles: List[Obstacle] = []
        self.particles: List[Particle] = []
        self.background = Background()

        self.game_speed = INITIAL_GAME_SPEED
        self.score = 0
        self.combo = 0
        self.max_combo = 0
        self.obstacle_timer = 0
        self.obstacle_interval = 70
        self.time_of_day = TimeOfDay.DAY

        self.running = True
        self.game_started = False
        self.game_over = False
        self.paused = False

    def load_high_score(self):
        try:
            if os.path.exists('high_score.json'):
                with open('high_score.json', 'r') as f:
                    data = json.load(f)
                    return data.get('high_score', 0)
        except:
            pass
        return 0

    def save_high_score(self):
        try:
            with open('high_score.json', 'w') as f:
                json.dump({'high_score': self.high_score}, f)
        except:
            pass

    def spawn_obstacle(self):
        bird_chance = min(0.3, self.score / 5000)
        if random.random() < bird_chance:
            self.obstacles.append(Obstacle('bird'))
        else:
            self.obstacles.append(Obstacle())

    def create_particles(self, x, y, count, color):
        for _ in range(count):
            particle = Particle(
                x=x + random.uniform(-10, 10),
                y=y + random.uniform(-5, 5),
                vx=random.uniform(-2, -1),
                vy=random.uniform(-2, 2),
                size=random.uniform(2, 5),
                life=1.0,
                decay=random.uniform(0.01, 0.02),
                color=color
            )
            self.particles.append(particle)

    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False

            elif event.type == pygame.KEYDOWN:
                # 일시정지
                if event.key in (pygame.K_ESCAPE, pygame.K_p) and self.game_started and not self.game_over:
                    self.paused = not self.paused

                # 점프
                elif event.key in (pygame.K_SPACE, pygame.K_UP):
                    if not self.game_started:
                        self.game_started = True
                    elif self.game_over:
                        self.reset_game()
                        self.game_started = True
                    elif not self.paused:
                        if self.dino.jump():
                            self.create_particles(self.dino.x + 20, self.dino.y + self.dino.height, 5, LIGHT_GRAY)

                # 숙이기
                elif event.key == pygame.K_DOWN and self.game_started and not self.paused:
                    self.dino.duck(True)

            elif event.type == pygame.KEYUP:
                if event.key == pygame.K_DOWN:
                    self.dino.duck(False)

    def update(self):
        if not self.game_started or self.game_over or self.paused:
            return

        # 공룡 업데이트
        self.dino.update()

        # 배경 업데이트
        self.background.update(self.game_speed, self.time_of_day)

        # 점수 업데이트
        self.score += 1

        # 속도 증가
        if self.score % 200 == 0 and self.score > 0:
            self.game_speed += 0.8
            self.obstacle_interval = max(40, self.obstacle_interval - 3)

        # 낮/밤 전환
        if self.score % 1000 == 0 and self.score > 0:
            self.time_of_day = TimeOfDay.NIGHT if self.time_of_day == TimeOfDay.DAY else TimeOfDay.DAY

        # 장애물 생성
        self.obstacle_timer += 1
        if self.obstacle_timer > self.obstacle_interval:
            self.spawn_obstacle()
            self.obstacle_timer = 0

        # 장애물 업데이트
        for obstacle in self.obstacles[:]:
            obstacle.update(self.game_speed)

            # 충돌 체크
            if obstacle.collides_with(self.dino):
                self.game_over = True
                final_score = self.score // 10
                if final_score > self.high_score:
                    self.high_score = final_score
                    self.save_high_score()
                return

            # 통과 체크 (콤보)
            if not obstacle.passed and obstacle.x + obstacle.width < self.dino.x:
                obstacle.passed = True
                self.combo += 1
                self.max_combo = max(self.max_combo, self.combo)

                if self.combo % 5 == 0:
                    self.create_particles(self.dino.x + 20, self.dino.y + 20, 10, GOLD)

            # 화면 밖으로 나간 장애물 제거
            if obstacle.is_off_screen():
                self.obstacles.remove(obstacle)

        # 파티클 업데이트
        for particle in self.particles[:]:
            particle.update()
            if particle.is_dead():
                self.particles.remove(particle)

        # 달리기 먼지
        if self.dino.grounded and random.random() > 0.7:
            self.create_particles(self.dino.x + 10, self.dino.y + self.dino.height + 5, 1, LIGHT_GRAY)

    def draw(self):
        # 배경 그리기
        self.background.draw(self.screen, self.time_of_day, self.score)

        # 바닥 그리기
        color = GRAY if self.time_of_day == TimeOfDay.NIGHT else DARK_GRAY
        pygame.draw.line(self.screen, color, (0, GROUND_Y), (SCREEN_WIDTH, GROUND_Y), 3)

        # 바닥 패턴
        for i in range(0, SCREEN_WIDTH, 30):
            offset = (self.score * 3) % 30
            pygame.draw.rect(self.screen, color, (i - offset, GROUND_Y + 5, 12, 3))
            if i % 60 == 0:
                pygame.draw.rect(self.screen, color, (i - offset + 15, GROUND_Y + 8, 4, 2))

        # 파티클 그리기
        for particle in self.particles:
            particle.draw(self.screen)

        if self.game_started and not self.game_over:
            # 공룡 그리기
            self.dino.draw(self.screen)

            # 장애물 그리기
            for obstacle in self.obstacles:
                obstacle.draw(self.screen)

            # 점수 표시
            score_text = self.font.render(f'점수: {self.score // 10}', True, DARK_GRAY)
            self.screen.blit(score_text, (20, 20))

            high_score_text = self.font.render(f'최고: {self.high_score}', True, DARK_GRAY)
            self.screen.blit(high_score_text, (20, 60))

            # 콤보 표시
            if self.combo > 0:
                combo_text = self.font.render(f'콤보 x{self.combo}', True, GOLD)
                self.screen.blit(combo_text, (20, 100))

            # 일시정지 화면
            if self.paused:
                overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
                overlay.fill((0, 0, 0, 180))
                self.screen.blit(overlay, (0, 0))

                pause_text = self.big_font.render('일시정지', True, WHITE)
                pause_rect = pause_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 20))
                self.screen.blit(pause_text, pause_rect)

                help_text = self.small_font.render('ESC 또는 P 키를 눌러 재개', True, WHITE)
                help_rect = help_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 30))
                self.screen.blit(help_text, help_rect)

        elif self.game_over:
            # 게임 오버 화면
            overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
            overlay.fill((0, 0, 0, 180))
            self.screen.blit(overlay, (0, 0))

            game_over_text = self.big_font.render('게임 오버!', True, WHITE)
            game_over_rect = game_over_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 60))
            self.screen.blit(game_over_text, game_over_rect)

            score_text = self.font.render(f'점수: {self.score // 10}', True, WHITE)
            score_rect = score_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 10))
            self.screen.blit(score_text, score_rect)

            combo_text = self.font.render(f'최대 콤보: {self.max_combo}', True, GOLD)
            combo_rect = combo_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 30))
            self.screen.blit(combo_text, combo_rect)

            restart_text = self.small_font.render('스페이스바를 눌러 다시 시작', True, WHITE)
            restart_rect = restart_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 70))
            self.screen.blit(restart_text, restart_rect)

        else:
            # 시작 화면
            self.dino.y = GROUND_Y
            self.dino.draw(self.screen)

            title_text = self.big_font.render('🦖 공룡 게임', True, DARK_GRAY)
            title_rect = title_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 40))
            self.screen.blit(title_text, title_rect)

            start_text = self.font.render('스페이스바를 눌러 시작하세요!', True, DARK_GRAY)
            start_rect = start_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 10))
            self.screen.blit(start_text, start_rect)

            help_text = self.small_font.render('↑ 점프 | ↓ 숙이기 | ESC/P 일시정지', True, GRAY)
            help_rect = help_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 50))
            self.screen.blit(help_text, help_rect)

        pygame.display.flip()

    def run(self):
        """메인 게임 루프"""
        while self.running:
            self.handle_events()
            self.update()
            self.draw()
            self.clock.tick(FPS)

        pygame.quit()
        sys.exit()


def main():
    """게임 시작"""
    game = Game()
    game.run()


if __name__ == '__main__':
    main()
