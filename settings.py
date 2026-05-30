"""
超级玛丽游戏配置
Super Mario Bros — Game Settings
"""

# 屏幕设置
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600
FPS = 60

# 物理参数
GRAVITY = 0.8
PLAYER_ACC = 0.5
PLAYER_FRICTION = -0.12
PLAYER_JUMP = -15
MAX_SPEED = 8

# 颜色
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
SKY_BLUE = (107, 140, 255)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)
YELLOW = (255, 255, 0)
BROWN = (139, 69, 19)
ORANGE = (255, 165, 0)
GOLD = (255, 215, 0)

# 瓦片大小
TILE_SIZE = 40

# 游戏状态
STATE_MENU = "menu"
STATE_PLAYING = "playing"
STATE_GAMEOVER = "gameover"
STATE_WIN = "win"
