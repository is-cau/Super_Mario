"""
精灵模块 — 玩家、敌人、道具、砖块
"""

import pygame
from settings import *


class Player(pygame.sprite.Sprite):
    """马里奥玩家角色"""

    def __init__(self, x, y):
        super().__init__()
        self.image = pygame.Surface((30, 40))
        self.image.fill(RED)
        # 画一个简单的马里奥
        pygame.draw.rect(self.image, RED, (0, 0, 30, 40))
        pygame.draw.rect(self.image, BLUE, (5, 12, 20, 15))  # 背带裤
        pygame.draw.rect(self.image, (255, 200, 150), (10, 2, 10, 10))  # 脸
        pygame.draw.rect(self.image, BROWN, (8, 0, 14, 5))  # 帽子
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y
        self.pos = pygame.Vector2(x, y)
        self.vel = pygame.Vector2(0, 0)
        self.acc = pygame.Vector2(0, 0)
        self.on_ground = False
        self.facing_right = True
        self.lives = 3
        self.coins = 0
        self.score = 0
        self.big = False
        self.invincible = False
        self.invincible_timer = 0

    def update(self, platforms):
        self.acc = pygame.Vector2(0, GRAVITY)
        keys = pygame.key.get_pressed()

        if keys[pygame.K_LEFT] or keys[pygame.K_a]:
            self.acc.x = -PLAYER_ACC
            self.facing_right = False
        if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
            self.acc.x = PLAYER_ACC
            self.facing_right = True

        # 摩擦力
        self.acc.x += self.vel.x * PLAYER_FRICTION
        self.vel += self.acc
        # 限速
        if abs(self.vel.x) < 0.1:
            self.vel.x = 0
        self.vel.x = max(-MAX_SPEED, min(self.vel.x, MAX_SPEED))

        self.pos += self.vel + 0.5 * self.acc

        # 边界
        if self.pos.x < 0:
            self.pos.x = 0
        if self.pos.x > SCREEN_WIDTH - self.rect.width:
            self.pos.x = SCREEN_WIDTH - self.rect.width

        self.rect.x = self.pos.x
        self.rect.y = self.pos.y

        # 平台碰撞
        self.on_ground = False
        hits = pygame.sprite.spritecollide(self, platforms, False)
        for plat in hits:
            if self.vel.y > 0:  # 下落中
                if self.rect.bottom <= plat.rect.centery:
                    self.rect.bottom = plat.rect.top
                    self.pos.y = self.rect.y
                    self.vel.y = 0
                    self.on_ground = True
            elif self.vel.y < 0:  # 上升中撞到
                self.rect.top = plat.rect.bottom
                self.pos.y = self.rect.y
                self.vel.y = 0

        # 无敌计时
        if self.invincible:
            self.invincible_timer -= 1
            if self.invincible_timer <= 0:
                self.invincible = False

        # 掉出屏幕
        if self.rect.top > SCREEN_HEIGHT:
            self.lives -= 1
            return "dead"

        return None

    def jump(self):
        if self.on_ground:
            self.vel.y = PLAYER_JUMP

    def grow(self):
        if not self.big:
            self.big = True
            self.image = pygame.Surface((30, 60))
            self.image.fill(RED)
            pygame.draw.rect(self.image, RED, (0, 0, 30, 60))
            pygame.draw.rect(self.image, BLUE, (5, 30, 20, 18))
            pygame.draw.rect(self.image, (255, 200, 150), (10, 2, 10, 10))
            pygame.draw.rect(self.image, BROWN, (8, 0, 14, 5))
            old_bottom = self.rect.bottom
            self.rect = self.image.get_rect()
            self.rect.bottom = old_bottom
            self.rect.x = self.pos.x
            self.pos.y = self.rect.y

    def shrink(self):
        if self.big:
            self.big = False
            self.image = pygame.Surface((30, 40))
            self.image.fill(RED)
            pygame.draw.rect(self.image, RED, (0, 0, 30, 40))
            pygame.draw.rect(self.image, BLUE, (5, 12, 20, 15))
            pygame.draw.rect(self.image, (255, 200, 150), (10, 2, 10, 10))
            pygame.draw.rect(self.image, BROWN, (8, 0, 14, 5))
            old_bottom = self.rect.bottom
            self.rect = self.image.get_rect()
            self.rect.bottom = old_bottom
            self.rect.x = self.pos.x
            self.pos.y = self.rect.y


class Platform(pygame.sprite.Sprite):
    """砖块/地面"""

    def __init__(self, x, y, width, height, color=BROWN):
        super().__init__()
        self.image = pygame.Surface((width, height))
        self.image.fill(color)
        # 砖块纹理
        pygame.draw.rect(self.image, (color[0] - 20, color[1] - 20, color[2] - 20),
                         (0, 0, width, height), 2)
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y


class QuestionBlock(pygame.sprite.Sprite):
    """问号砖块 — 顶出金币/蘑菇"""

    def __init__(self, x, y):
        super().__init__()
        self.image = pygame.Surface((TILE_SIZE, TILE_SIZE))
        self.image.fill(GOLD)
        pygame.draw.rect(self.image, (180, 150, 0), (0, 0, TILE_SIZE, TILE_SIZE), 2)
        font = pygame.font.Font(None, 28)
        text = font.render("?", True, BROWN)
        self.image.blit(text, (12, 8))
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y
        self.used = False
        self.contains = "coin"  # coin 或 mushroom

    def hit(self):
        if not self.used:
            self.used = True
            self.image.fill((100, 100, 100))
            pygame.draw.rect(self.image, (60, 60, 60), (0, 0, TILE_SIZE, TILE_SIZE), 2)
            return self.contains
        return None


class Coin(pygame.sprite.Sprite):
    """金币"""

    def __init__(self, x, y):
        super().__init__()
        self.image = pygame.Surface((20, 20), pygame.SRCALPHA)
        pygame.draw.circle(self.image, GOLD, (10, 10), 10)
        pygame.draw.circle(self.image, YELLOW, (8, 8), 4)
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y
        self.collected = False


class Mushroom(pygame.sprite.Sprite):
    """蘑菇 — 变大"""

    def __init__(self, x, y):
        super().__init__()
        self.image = pygame.Surface((30, 30))
        self.image.fill(GREEN)
        pygame.draw.circle(self.image, WHITE, (8, 8), 5)
        pygame.draw.circle(self.image, WHITE, (22, 12), 5)
        pygame.draw.circle(self.image, WHITE, (12, 20), 4)
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y
        self.vel = pygame.Vector2(1, 0)
        self.collected = False

    def update(self, platforms):
        self.vel.y += GRAVITY * 0.5
        self.rect.x += self.vel.x
        self.rect.y += self.vel.y

        # 平台碰撞
        hits = pygame.sprite.spritecollide(self, platforms, False)
        for plat in hits:
            if self.vel.y > 0:
                self.rect.bottom = plat.rect.top
                self.vel.y = 0
            elif self.vel.y < 0:
                self.rect.top = plat.rect.bottom
                self.vel.y = 0

        # 碰墙反弹
        hits = pygame.sprite.spritecollide(self, platforms, False)
        for plat in hits:
            if abs(self.rect.right - plat.rect.left) < 5:
                self.vel.x = -abs(self.vel.x)
            elif abs(self.rect.left - plat.rect.right) < 5:
                self.vel.x = abs(self.vel.x)


class Goomba(pygame.sprite.Sprite):
    """板栗仔敌人"""

    def __init__(self, x, y):
        super().__init__()
        self.image = pygame.Surface((30, 30))
        self.image.fill(BROWN)
        # 画脸
        pygame.draw.rect(self.image, (200, 150, 100), (5, 5, 20, 10))  # 脸
        pygame.draw.circle(self.image, BLACK, (10, 10), 3)  # 左眼
        pygame.draw.circle(self.image, BLACK, (20, 10), 3)  # 右眼
        # 脚
        pygame.draw.rect(self.image, BLACK, (3, 22, 8, 6))
        pygame.draw.rect(self.image, BLACK, (19, 22, 8, 6))
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y
        self.vel = pygame.Vector2(-1, 0)
        self.alive = True

    def update(self, platforms):
        if not self.alive:
            self.kill()
            return

        self.vel.y += GRAVITY
        self.rect.x += self.vel.x
        self.rect.y += self.vel.y

        # 平台碰撞
        hits = pygame.sprite.spritecollide(self, platforms, False)
        for plat in hits:
            if self.vel.y > 0:
                self.rect.bottom = plat.rect.top
                self.vel.y = 0
            elif self.vel.y < 0:
                self.rect.top = plat.rect.bottom
                self.vel.y = 0

        # 碰墙反弹
        for plat in hits:
            if abs(self.rect.right - plat.rect.left) < 5:
                self.vel.x = -abs(self.vel.x)
            elif abs(self.rect.left - plat.rect.right) < 5:
                self.vel.x = abs(self.vel.x)


class Flag(pygame.sprite.Sprite):
    """终点旗帜"""

    def __init__(self, x, y):
        super().__init__()
        self.image = pygame.Surface((10, 200))
        self.image.fill(WHITE)
        # 旗杆
        pygame.draw.rect(self.image, (150, 150, 150), (4, 0, 2, 200))
        # 旗帜
        pygame.draw.polygon(self.image, GREEN, [(6, 5), (30, 20), (6, 35)])
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y
