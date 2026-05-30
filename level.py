"""
关卡设计 — 瓦片地图生成
"""

import pygame
from settings import *
from sprites import Platform, QuestionBlock, Coin, Goomba, Flag


# 关卡地图 (20列 x 15行，每格 40px)
# G=地面, B=砖块, ?=问号砖, -=空, C=金币, E=敌人, F=终点旗
LEVEL_1 = [
    "--------------------",
    "--------------------",
    "--------------------",
    "--------------------",
    "--------------------",
    "--------------------",
    "--------------------",
    "------?---?---?----",
    "--------BB---------",
    "----?----------?---",
    "--------------------",
    "-----BBB-----BBB---",
    "---E-------------E-",
    "-CC--CC----------F-",
    "GGGGGGGGGGGGGGGGGGG",
]


def build_level(level_data):
    """根据地图数据构建精灵组"""
    platforms = pygame.sprite.Group()
    question_blocks = pygame.sprite.Group()
    coins = pygame.sprite.Group()
    enemies = pygame.sprite.Group()
    flag_group = pygame.sprite.Group()
    all_sprites = pygame.sprite.Group()

    for row_idx, row in enumerate(level_data):
        for col_idx, char in enumerate(row):
            x = col_idx * TILE_SIZE
            y = row_idx * TILE_SIZE

            if char == "G":
                plat = Platform(x, y, TILE_SIZE, TILE_SIZE, BROWN)
                platforms.add(plat)
                all_sprites.add(plat)
            elif char == "B":
                plat = Platform(x, y, TILE_SIZE, TILE_SIZE, (200, 150, 50))
                platforms.add(plat)
                all_sprites.add(plat)
            elif char == "?":
                qb = QuestionBlock(x, y)
                question_blocks.add(qb)
                platforms.add(qb)
                all_sprites.add(qb)
            elif char == "C":
                coin = Coin(x + 10, y + 10)
                coins.add(coin)
                all_sprites.add(coin)
            elif char == "E":
                goomba = Goomba(x, y)
                enemies.add(goomba)
                all_sprites.add(goomba)
            elif char == "F":
                flag = Flag(x, y)
                flag_group.add(flag)
                all_sprites.add(flag)

    return {
        "platforms": platforms,
        "question_blocks": question_blocks,
        "coins": coins,
        "enemies": enemies,
        "flag": flag_group,
        "all_sprites": all_sprites,
    }
