# 超级玛丽 — Super Mario Bros 🍄

基于 Pygame 的超级玛丽经典游戏复刻。

## 🎮 操作方式

| 按键 | 功能 |
|------|------|
| ← → / A D | 左右移动 |
| ↑ / W / 空格 | 跳跃 |
| ESC | 退出游戏 |

## 🚀 运行

```bash
pip install -r requirements.txt
python main.py
```

## ✨ 功能

- 🧱 砖块平台物理碰撞
- ❓ 问号砖块（顶出金币/蘑菇）
- 🪙 金币收集
- 🍄 变大蘑菇
- 👾 栗子仔敌人（踩踏击杀）
- 🏁 终点旗帜通关
- 📷 相机跟随
- ❤️ 生命系统
- ⭐ 无敌帧

## 🏗️ 项目结构

```
Super_Mario/
├── main.py          # 游戏主程序
├── sprites.py       # 精灵（玩家、敌人、道具）
├── level.py         # 关卡设计
├── settings.py      # 游戏参数配置
└── requirements.txt # 依赖
```

## 📝 License

MIT
