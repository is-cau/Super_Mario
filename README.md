# 超级马力欧 — Super Mario Bros 🍄

基于 **TypeScript + HTML5 Canvas** 的超级马力欧经典游戏复刻，纯前端项目。

🌐 **[在线体验 →](https://is-cau.github.io/Super_Mario/)**

## 🎮 操作方式

| 按键 | 功能 |
|------|------|
| ← → / A D | 左右移动 |
| ↑ / W / 空格 | 跳跃 |
| ESC | 退出（刷新页面返回） |

## 🚀 本地开发

```bash
npm install
npm run dev      # 启动开发服务器
npm run build    # 生产构建
```

## ✨ 游戏功能

- 🧱 砖块平台 + 重力物理
- ❓ 问号砖块（顶出金币/蘑菇）
- 🪙 金币收集
- 🍄 变大蘑菇
- 👾 栗子仔敌人（踩踏击杀）
- 🏁 终点旗帜通关
- 📷 相机跟随
- ❤️ 生命系统 + 无敌帧

## 🏗️ 技术栈

- **TypeScript** — 类型安全
- **Vite** — 极速构建
- **HTML5 Canvas** — 游戏渲染
- **GitHub Actions** — 自动部署到 GitHub Pages

## 🏗️ 项目结构

```
Super_Mario/
├── index.html           # 入口 HTML
├── src/
│   ├── main.ts          # 游戏入口
│   ├── game.ts          # 游戏主循环 + 碰撞
│   ├── sprites.ts       # 精灵类（玩家/敌人/道具）
│   ├── level.ts         # 关卡设计
│   └── settings.ts      # 游戏配置
├── .github/workflows/
│   └── deploy.yml       # 自动部署
└── vite.config.ts       # Vite 配置
```

## 📝 License

MIT
