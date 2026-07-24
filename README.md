# 像素大冒险 | Super Mario

一款使用 TypeScript 与 HTML5 Canvas 制作的复古横版闯关游戏。项目包含完整关卡、像素精灵、合成音效、Boss 战和响应式触屏操作。

**[在线游玩](https://is-cau.github.io/Super_Mario/)**

## 操作

| 操作 | 键盘 | 触屏 |
| --- | --- | --- |
| 移动 | `←` `→` / `A` `D` | 方向键 |
| 跳跃 / 二段跳 | `↑` / `W` / `Space` | A |
| 发射火球 | `J` | B |
| 冲刺 | 双击并按住移动键 | 双击并按住方向键 |
| 暂停 | `Esc` | 顶部暂停按钮 |

## 特色

- 完整的横版关卡、相机跟随和碰撞系统
- 栗子仔、乌龟、食人花与 Bowser Boss
- 蘑菇、火焰花、无敌星、隐藏砖块和 1UP
- 可变跳跃、二段跳、冲刺和踩怪连击
- Web Audio API 合成的 8-bit 音效与背景音乐
- 自适应桌面和移动端的街机界面与触控控制器
- 本地保存最高分和声音偏好

## 本地开发

需要 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
npm run preview
```

## 项目结构

```text
Super_Mario/
├── index.html
├── src/
│   ├── main.ts          # 页面交互与游戏循环
│   ├── game.ts          # 游戏状态、物理与碰撞
│   ├── sprites.ts       # 玩家、敌人、道具精灵
│   ├── level.ts         # 关卡数据
│   ├── audio.ts         # 合成音效与音乐
│   ├── background.ts    # 视差背景
│   └── style.css        # 响应式街机界面
└── .github/workflows/
    └── deploy.yml       # GitHub Pages 自动部署
```

推送到 `master` 后，GitHub Actions 会构建项目并部署到 GitHub Pages。

## 免责声明

本项目仅供编程技术学习与交流，非商业用途。超级马力欧角色及游戏设计版权归 Nintendo 所有。
