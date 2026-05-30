"""
超级玛丽游戏复刻 — 主程序
Super Mario Bros Remake in Pygame

操作说明：
  方向键/WASD — 移动
  空格键/↑ — 跳跃
  ESC — 退出
"""

import pygame
import sys
from settings import *
from sprites import Player
from level import build_level, LEVEL_1


class Game:
    """游戏主类"""

    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("超级玛丽 — Super Mario Bros")
        self.clock = pygame.time.Clock()
        self.font_large = pygame.font.Font(None, 48)
        self.font_small = pygame.font.Font(None, 28)
        self.state = STATE_MENU
        self.camera_x = 0

    def reset_level(self):
        """重置关卡"""
        level = build_level(LEVEL_1)
        self.platforms = level["platforms"]
        self.question_blocks = level["question_blocks"]
        self.coins = level["coins"]
        self.enemies = level["enemies"]
        self.flag = level["flag"]
        self.all_sprites = level["all_sprites"]
        self.mushrooms = pygame.sprite.Group()

        # 创建玩家
        self.player = Player(80, SCREEN_HEIGHT - 200)
        self.all_sprites.add(self.player)

    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False

            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    return False

                if self.state == STATE_MENU:
                    if event.key == pygame.K_RETURN or event.key == pygame.K_SPACE:
                        self.state = STATE_PLAYING
                        self.reset_level()

                elif self.state == STATE_PLAYING:
                    if event.key == pygame.K_SPACE or event.key == pygame.K_UP or event.key == pygame.K_w:
                        self.player.jump()

                elif self.state in (STATE_GAMEOVER, STATE_WIN):
                    if event.key == pygame.K_RETURN or event.key == pygame.K_SPACE:
                        self.state = STATE_MENU

        return True

    def update(self):
        if self.state != STATE_PLAYING:
            return

        result = self.player.update(self.platforms)
        if result == "dead":
            if self.player.lives <= 0:
                self.state = STATE_GAMEOVER
            else:
                # 重生
                self.player.pos = pygame.Vector2(80, SCREEN_HEIGHT - 200)
                self.player.vel = pygame.Vector2(0, 0)
                self.player.shrink()
                self.player.invincible = True
                self.player.invincible_timer = 120
            return

        # 敌人更新
        for enemy in self.enemies:
            enemy.update(self.platforms)

        # 蘑菇更新
        for mushroom in self.mushrooms:
            mushroom.update(self.platforms)

        # 相机跟随
        self.camera_x = max(0, self.player.rect.centerx - SCREEN_WIDTH // 3)

        # --- 碰撞检测 ---

        # 金币收集
        coin_hits = pygame.sprite.spritecollide(self.player, self.coins, True)
        for _ in coin_hits:
            self.player.coins += 1
            self.player.score += 100

        # 蘑菇收集
        mushroom_hits = pygame.sprite.spritecollide(self.player, self.mushrooms, True)
        for _ in mushroom_hits:
            self.player.grow()
            self.player.score += 200

        # 敌人碰撞
        if not self.player.invincible:
            enemy_hits = pygame.sprite.spritecollide(self.player, self.enemies, False)
            for enemy in enemy_hits:
                if self.player.vel.y > 0 and self.player.rect.bottom < enemy.rect.centery:
                    # 踩死敌人
                    enemy.alive = False
                    enemy.kill()
                    self.player.vel.y = -8
                    self.player.score += 500
                else:
                    # 受伤
                    if self.player.big:
                        self.player.shrink()
                        self.player.invincible = True
                        self.player.invincible_timer = 90
                    else:
                        self.player.lives -= 1
                        if self.player.lives <= 0:
                            self.state = STATE_GAMEOVER
                        else:
                            self.player.pos = pygame.Vector2(80, SCREEN_HEIGHT - 200)
                            self.player.vel = pygame.Vector2(0, 0)
                            self.player.invincible = True
                            self.player.invincible_timer = 120

        # 问号砖碰撞（从下方顶）
        for qb in self.question_blocks:
            if not qb.used and self.player.vel.y < 0:
                if abs(self.player.rect.top - qb.rect.bottom) < 15 and abs(
                        self.player.rect.centerx - qb.rect.centerx) < 25:
                    reward = qb.hit()
                    self.player.vel.y = 0
                    if reward == "coin":
                        self.player.coins += 1
                        self.player.score += 200
                    elif reward == "mushroom":
                        m = pygame.sprite.Sprite()
                        from sprites import Mushroom
                        m = Mushroom(qb.rect.x, qb.rect.y - 35)
                        self.mushrooms.add(m)
                        self.all_sprites.add(m)

        # 终点旗帜
        flag_hits = pygame.sprite.spritecollide(self.player, self.flag, False)
        if flag_hits:
            self.player.score += 1000
            self.state = STATE_WIN

    def draw(self):
        self.screen.fill(SKY_BLUE)

        if self.state == STATE_MENU:
            self._draw_menu()
        elif self.state == STATE_PLAYING:
            self._draw_game()
        elif self.state == STATE_GAMEOVER:
            self._draw_game_over()
        elif self.state == STATE_WIN:
            self._draw_win()

        pygame.display.flip()

    def _draw_menu(self):
        title = self.font_large.render("超级玛丽", True, RED)
        title2 = self.font_large.render("Super Mario Bros", True, WHITE)
        prompt = self.font_small.render("按 ENTER / SPACE 开始游戏", True, WHITE)
        controls = self.font_small.render("方向键移动 | 空格跳跃 | ESC退出", True, YELLOW)

        self.screen.blit(title, (SCREEN_WIDTH // 2 - title.get_width() // 2, 150))
        self.screen.blit(title2, (SCREEN_WIDTH // 2 - title2.get_width() // 2, 210))
        self.screen.blit(prompt, (SCREEN_WIDTH // 2 - prompt.get_width() // 2, 350))
        self.screen.blit(controls, (SCREEN_WIDTH // 2 - controls.get_width() // 2, 400))

        # 画一个装饰性马里奥
        mario_preview = pygame.Surface((60, 80))
        mario_preview.fill(RED)
        pygame.draw.rect(mario_preview, BLUE, (10, 30, 40, 30))
        pygame.draw.rect(mario_preview, (255, 200, 150), (20, 5, 20, 20))
        pygame.draw.rect(mario_preview, BROWN, (15, 0, 30, 10))
        self.screen.blit(mario_preview, (SCREEN_WIDTH // 2 - 30, 270))

    def _draw_game(self):
        # 所有精灵偏移绘制
        for sprite in self.all_sprites:
            self.screen.blit(sprite.image,
                             (sprite.rect.x - self.camera_x, sprite.rect.y))

        # 绘制 UI（不受相机影响）
        lives_text = self.font_small.render(f"❤ x{self.player.lives}", True, WHITE)
        coins_text = self.font_small.render(f"🪙 x{self.player.coins}", True, WHITE)
        score_text = self.font_small.render(f"Score: {self.player.score}", True, WHITE)
        self.screen.blit(lives_text, (20, 20))
        self.screen.blit(coins_text, (120, 20))
        self.screen.blit(score_text, (SCREEN_WIDTH - 200, 20))

        # 无敌闪烁效果
        if self.player.invincible and self.player.invincible_timer % 6 < 3:
            overlay = pygame.Surface((self.player.rect.width, self.player.rect.height))
            overlay.set_alpha(100)
            overlay.fill(WHITE)
            self.screen.blit(overlay,
                             (self.player.rect.x - self.camera_x, self.player.rect.y))

    def _draw_game_over(self):
        self.screen.fill(BLACK)
        text = self.font_large.render("GAME OVER", True, RED)
        score = self.font_small.render(f"最终得分: {self.player.score}", True, WHITE)
        prompt = self.font_small.render("按 ENTER 返回菜单", True, WHITE)
        self.screen.blit(text, (SCREEN_WIDTH // 2 - text.get_width() // 2, 200))
        self.screen.blit(score, (SCREEN_WIDTH // 2 - score.get_width() // 2, 280))
        self.screen.blit(prompt, (SCREEN_WIDTH // 2 - prompt.get_width() // 2, 380))

    def _draw_win(self):
        self.screen.fill(BLACK)
        text = self.font_large.render("YOU WIN!", True, GOLD)
        score = self.font_small.render(f"最终得分: {self.player.score}", True, WHITE)
        coin_text = self.font_small.render(f"金币: {self.player.coins}", True, WHITE)
        prompt = self.font_small.render("按 ENTER 返回菜单", True, WHITE)
        self.screen.blit(text, (SCREEN_WIDTH // 2 - text.get_width() // 2, 180))
        self.screen.blit(score, (SCREEN_WIDTH // 2 - score.get_width() // 2, 260))
        self.screen.blit(coin_text, (SCREEN_WIDTH // 2 - coin_text.get_width() // 2, 300))
        self.screen.blit(prompt, (SCREEN_WIDTH // 2 - prompt.get_width() // 2, 380))

    def run(self):
        running = True
        while running:
            self.clock.tick(FPS)
            running = self.handle_events()
            self.update()
            self.draw()

        pygame.quit()
        sys.exit()


if __name__ == "__main__":
    game = Game()
    game.run()
