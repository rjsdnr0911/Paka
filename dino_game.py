#!/usr/bin/env python3
"""
공룡 게임 (Dino Game) - Python Pygame 버전
Chrome 오프라인 공룡 게임 스타일
"""

import pygame
import random
import sys
import json
import os

# 초기화
pygame.init()

# 화면 설정
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 200
FPS = 60

# 색상
WHITE = (255, 255, 255)
GRAY = (83, 83, 83)
LIGHT_GRAY = (201, 201, 201)

# 게임 설정
GRAVITY = 0.6
JUMP_POWER = -13
GROUND_Y = 130


class Dino:
    """공룡 캐릭터"""
    def __init__(self):
        self.x = 50
        self.y = GROUND_Y - 62
        self.width = 58
        self.height = 62
        self.vy = 0
        self.grounded = True
        self.ducking = False
        self.jump_power = JUMP_POWER
        self.frame = 0

    def update(self):
        self.vy += GRAVITY
        self.y += self.vy

        ground_y = GROUND_Y - (29 if self.ducking else self.height)
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
            pygame.draw.rect(screen, GRAY, (self.x, self.y + 33, self.width, 29))
        else:
            # 머리
            pygame.draw.rect(screen, GRAY, (self.x + 29, self.y, 29, 29))
            # 눈
            pygame.draw.rect(screen, WHITE, (self.x + 40, self.y + 8, 8, 8))

            # 몸통
            pygame.draw.rect(screen, GRAY, (self.x + 20, self.y + 29, 38, 33))

            # 팔
            pygame.draw.rect(screen, GRAY, (self.x + 20, self.y + 29, 11, 20))

            # 다리
            leg_offset = 5 if (self.frame // 5) % 2 == 0 else 0
            pygame.draw.rect(screen, GRAY, (self.x + 21, self.y + 56, 9, 13 + leg_offset))
            pygame.draw.rect(screen, GRAY, (self.x + 40, self.y + 56, 9, 13 - leg_offset))

            # 꼬리
            pygame.draw.rect(screen, GRAY, (self.x, self.y + 33, 21, 13))

    def get_hitbox(self):
        if self.ducking:
            return pygame.Rect(self.x + 5, self.y + 33, self.width - 10, 29)
        return pygame.Rect(self.x + 5, self.y + 5, self.width - 10, self.height - 10)


class Obstacle:
    """장애물 클래스"""
    def __init__(self, obstacle_type=None):
        self.x = SCREEN_WIDTH
        self.passed = False

        if obstacle_type == 'bird':
            self.type = 'bird'
            self.width = 53
            self.height = 40
            self.y = 80
            self.frame = 0
        else:
            self.type = obstacle_type if obstacle_type in ['cactus', 'cactus2'] else random.choice(['cactus', 'cactus2'])

            if self.type == 'cactus':
                self.width = 23
                self.height = 47
            else:  # cactus2
                self.width = 45
                self.height = 47

            self.y = GROUND_Y - self.height

    def update(self, game_speed):
        self.x -= game_speed
        if self.type == 'bird':
            self.frame += 1

    def draw(self, screen):
        if self.type == 'bird':
            # 새
            pygame.draw.rect(screen, GRAY, (self.x + 13, self.y + 13, 27, 13))
            # 날개
            wing_y = self.y if (self.frame // 5) % 2 == 0 else self.y + 7
            pygame.draw.rect(screen, GRAY, (self.x, wing_y, 16, 11))
            pygame.draw.rect(screen, GRAY, (self.x + 37, wing_y, 16, 11))
        elif self.type == 'cactus':
            # 단일 선인장
            pygame.draw.rect(screen, GRAY, (self.x + 5, self.y, 12, self.height))
            pygame.draw.rect(screen, GRAY, (self.x, self.y + 16, 11, 20))
        else:  # cactus2
            # 더블 선인장
            pygame.draw.rect(screen, GRAY, (self.x + 5, self.y, 12, self.height))
            pygame.draw.rect(screen, GRAY, (self.x, self.y + 16, 11, 20))
            pygame.draw.rect(screen, GRAY, (self.x + 28, self.y, 12, self.height))
            pygame.draw.rect(screen, GRAY, (self.x + 35, self.y + 16, 11, 20))

    def is_off_screen(self):
        return self.x + self.width < 0

    def collides_with(self, dino):
        dino_hitbox = dino.get_hitbox()
        obstacle_hitbox = pygame.Rect(self.x + 2, self.y + 2, self.width - 4, self.height - 4)
        return dino_hitbox.colliderect(obstacle_hitbox)


class Cloud:
    """구름"""
    def __init__(self):
        self.x = SCREEN_WIDTH + random.randint(0, 133)
        self.y = random.randint(13, 80)
        self.width = 61
        self.height = 19

    def update(self, game_speed):
        self.x -= game_speed * 0.2

    def draw(self, screen):
        pygame.draw.rect(screen, LIGHT_GRAY, (self.x, self.y, self.width, self.height))
        pygame.draw.rect(screen, LIGHT_GRAY, (self.x + 13, self.y - 7, 35, 7))

    def is_off_screen(self):
        return self.x + self.width < 0


class Game:
    """메인 게임 클래스"""
    def __init__(self):
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("공룡 게임")
        self.clock = pygame.time.Clock()
        self.font = pygame.font.SysFont('courier', 16, bold=False)

        self.reset_game()
        self.high_score = self.load_high_score()

    def reset_game(self):
        self.dino = Dino()
        self.obstacles = []
        self.clouds = []

        # 초기 구름 생성
        for i in range(3):
            cloud = Cloud()
            cloud.x = random.randint(0, SCREEN_WIDTH)
            self.clouds.append(cloud)

        self.game_speed = 6
        self.score = 0
        self.obstacle_timer = 0
        self.obstacle_interval = 75
        self.cloud_timer = 0

        self.running = True
        self.game_started = False
        self.game_over = False

        # 하트 시스템
        self.lives = 3
        self.invincible = False
        self.invincible_timer = 0

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

    def draw_hearts(self):
        """하트 그리기 (픽셀아트 스타일)"""
        heart_size = 3
        start_x = 13
        start_y = 16
        spacing = 40

        for i in range(3):
            x = start_x + i * spacing
            y = start_y

            # 색상 결정
            if i < self.lives:
                # 채워진 하트
                color = LIGHT_GRAY if (self.invincible and self.invincible_timer % 10 < 5) else GRAY
            else:
                # 빈 하트 (외곽선)
                color = LIGHT_GRAY

            # 하트 모양 픽셀아트
            # 상단 두 개의 원
            pygame.draw.rect(self.screen, color, (x + heart_size * 1, y, heart_size * 2, heart_size))
            pygame.draw.rect(self.screen, color, (x + heart_size * 4, y, heart_size * 2, heart_size))

            # 중간 넓은 부분
            pygame.draw.rect(self.screen, color, (x, y + heart_size, heart_size * 7, heart_size))
            pygame.draw.rect(self.screen, color, (x, y + heart_size * 2, heart_size * 7, heart_size))

            # 아래로 좁아지는 부분
            pygame.draw.rect(self.screen, color, (x + heart_size, y + heart_size * 3, heart_size * 5, heart_size))
            pygame.draw.rect(self.screen, color, (x + heart_size * 2, y + heart_size * 4, heart_size * 3, heart_size))
            pygame.draw.rect(self.screen, color, (x + heart_size * 3, y + heart_size * 5, heart_size, heart_size))

            # 빈 하트인 경우 내부를 흰색으로
            if i >= self.lives:
                pygame.draw.rect(self.screen, WHITE, (x + heart_size * 2, y + heart_size, heart_size, heart_size))
                pygame.draw.rect(self.screen, WHITE, (x + heart_size * 4, y + heart_size, heart_size, heart_size))
                pygame.draw.rect(self.screen, WHITE, (x + heart_size * 1, y + heart_size * 2, heart_size * 5, heart_size))
                pygame.draw.rect(self.screen, WHITE, (x + heart_size * 2, y + heart_size * 3, heart_size * 3, heart_size))
                pygame.draw.rect(self.screen, WHITE, (x + heart_size * 3, y + heart_size * 4, heart_size, heart_size))

    def spawn_obstacle(self):
        rand = random.random()
        if rand < 0.1 and self.score > 100:
            self.obstacles.append(Obstacle('bird'))
        elif rand < 0.5:
            self.obstacles.append(Obstacle('cactus'))
        else:
            self.obstacles.append(Obstacle('cactus2'))

    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False

            elif event.type == pygame.KEYDOWN:
                if event.key in (pygame.K_SPACE, pygame.K_UP):
                    if not self.game_started:
                        self.game_started = True
                    elif self.game_over:
                        self.reset_game()
                        self.game_started = True
                    else:
                        self.dino.jump()

                elif event.key == pygame.K_DOWN and self.game_started and not self.game_over:
                    self.dino.duck(True)

            elif event.type == pygame.KEYUP:
                if event.key == pygame.K_DOWN:
                    self.dino.duck(False)

    def update(self):
        if not self.game_started or self.game_over:
            return

        # 공룡 업데이트
        self.dino.update()

        # 무적 타이머 업데이트
        if self.invincible:
            self.invincible_timer += 1
            if self.invincible_timer > 60:  # 약 1초 무적
                self.invincible = False
                self.invincible_timer = 0

        # 점수 업데이트
        self.score += 0.1

        # 속도 증가
        if int(self.score) % 100 == 0 and int(self.score) > 0:
            self.game_speed += 0.5
            self.obstacle_interval = max(50, self.obstacle_interval - 5)

        # 장애물 생성
        self.obstacle_timer += 1
        if self.obstacle_timer > self.obstacle_interval:
            self.spawn_obstacle()
            self.obstacle_timer = 0

        # 장애물 업데이트
        for obstacle in self.obstacles[:]:
            obstacle.update(self.game_speed)

            # 충돌 체크 (무적 상태가 아닐 때만)
            if not self.invincible and obstacle.collides_with(self.dino) and not obstacle.passed:
                obstacle.passed = True  # 중복 충돌 방지
                self.lives -= 1

                if self.lives <= 0:
                    # 게임 오버
                    self.game_over = True
                    final_score = int(self.score)
                    if final_score > self.high_score:
                        self.high_score = final_score
                        self.save_high_score()
                else:
                    # 하트가 남아있으면 무적 시간 부여
                    self.invincible = True
                    self.invincible_timer = 0

            if obstacle.is_off_screen():
                self.obstacles.remove(obstacle)

        # 구름 업데이트
        self.cloud_timer += 1
        if self.cloud_timer > 200:
            self.clouds.append(Cloud())
            self.cloud_timer = 0

        for cloud in self.clouds[:]:
            cloud.update(self.game_speed)
            if cloud.is_off_screen():
                self.clouds.remove(cloud)

    def draw(self):
        # 배경 (흰색)
        self.screen.fill(WHITE)

        # 구름
        for cloud in self.clouds:
            cloud.draw(self.screen)

        # 바닥
        pygame.draw.line(self.screen, GRAY, (0, GROUND_Y), (SCREEN_WIDTH, GROUND_Y), 3)

        # 바닥 패턴
        offset = int(self.score * 2) % 27
        for i in range(-offset, SCREEN_WIDTH, 27):
            pygame.draw.rect(self.screen, GRAY, (i, GROUND_Y + 3, 13, 3))

        # 점수
        score_text = str(int(self.score)).zfill(5)
        hi_text = f'HI {str(self.high_score).zfill(5)}'

        score_surf = self.font.render(score_text, True, GRAY)
        hi_surf = self.font.render(hi_text, True, GRAY)

        self.screen.blit(hi_surf, (SCREEN_WIDTH - 173, 13))
        self.screen.blit(score_surf, (SCREEN_WIDTH - 80, 13))

        # 하트
        self.draw_hearts()

        if self.game_started and not self.game_over:
            # 공룡 (무적 상태면 깜빡임)
            if not self.invincible or self.invincible_timer % 6 < 3:
                self.dino.draw(self.screen)

            # 장애물
            for obstacle in self.obstacles:
                obstacle.draw(self.screen)

        elif self.game_over:
            # 공룡 (죽은 상태)
            self.dino.draw(self.screen)
            for obstacle in self.obstacles:
                obstacle.draw(self.screen)

            # 게임 오버 텍스트
            game_over_font = pygame.font.SysFont('courier', 19, bold=True)
            game_over_surf = game_over_font.render('G A M E  O V E R', True, GRAY)
            game_over_rect = game_over_surf.get_rect(center=(SCREEN_WIDTH // 2, 40))
            self.screen.blit(game_over_surf, game_over_rect)

            restart_font = pygame.font.SysFont('courier', 13, bold=False)
            restart_surf = restart_font.render('Press SPACE to restart', True, GRAY)
            restart_rect = restart_surf.get_rect(center=(SCREEN_WIDTH // 2, 67))
            self.screen.blit(restart_surf, restart_rect)

            # 재시작 아이콘
            icon_font = pygame.font.SysFont('arial', 27)
            icon_surf = icon_font.render('↻', True, GRAY)
            icon_rect = icon_surf.get_rect(center=(SCREEN_WIDTH // 2, 93))
            self.screen.blit(icon_surf, icon_rect)

        else:
            # 시작 화면
            self.dino.draw(self.screen)

            start_font = pygame.font.SysFont('courier', 13, bold=False)
            start_surf = start_font.render('Press SPACE to start', True, GRAY)
            start_rect = start_surf.get_rect(center=(SCREEN_WIDTH // 2, 80))
            self.screen.blit(start_surf, start_rect)

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
