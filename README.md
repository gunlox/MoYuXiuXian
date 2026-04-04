# 摸鱼修仙 / MoYu XiuXian

> 大道三千，摸鱼为先 🐟

一款中国风修仙主题放置类 Web 游戏。纯前端单机，无需服务器，打开浏览器即可修仙。

<!-- 如果你有截图，替换下面的路径 -->
<!-- ![游戏截图](./screenshots/demo.png) -->

## ✨ 功能特性

- **挂机修炼** — 自动积累修为和灵石，从练气一路修炼到渡劫飞升
- **30层境界** — 练气、筑基、金丹、元婴、化神、渡劫，六大境界三十层突破
- **回合制战斗** — 24个讨伐区域挂机讨伐妖兽，自动战斗结算奖励
- **18本功法** — 白/绿/蓝/紫/橙/红六个品质，满级可精通获得永久加成
- **装备系统** — 5个槽位、7种品质（含传说）、7种词条、强化与分解
- **25种丹药** — 覆盖全部大境界，含衰减机制，低阶丹药高境界效果递减
- **24个秘境** — 多层探索、Boss 战、首通后一键扫荡
- **5大门派** — 剑宗、丹宗、体修宗、灵宗、福地宗各有专属加成
- **轮回系统** — 飞升后转生，仙缘兑换13种永久加成
- **34个成就** — 里程碑式目标，领取丰厚奖励
- **存档管理** — 3个存档槽位 + JSON导入导出
- **10步新手引导** — 完整覆盖游戏主链路
- **离线收益** — 关闭浏览器后重新打开自动补偿离线时间收益
- **响应式布局** — 手机 / 平板 / PC 全适配

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript 5 |
| 构建 | Vite 6 |
| 样式 | TailwindCSS 3 |
| 单文件打包 | vite-plugin-singlefile |
| 测试 | Vitest（108+ 用例） |
| 桌面端 | Electron 41（可选） |

## 🚀 快速开始

```bash
# 克隆仓库
git clone https://github.com/gunlox/MoYuXiuXian.git
cd MoYuXiuXian

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

浏览器访问 http://localhost:5173 开始修仙！

## 📦 构建

```bash
# 运行测试
npm test

# 构建生产版本（单 HTML 文件）
npm run build
```

构建产物输出到 `dist/` 目录，生成单个 HTML 文件，可直接部署到任意静态托管服务或本地双击打开。

## 📁 项目结构

```text
src/
├── components/     # 19 个 UI 组件
├── data/           # 9 个权威数据文件（境界/装备/丹药/怪物/秘境/成就/门派/轮回/存档）
├── engine/         # 4 个引擎文件（属性计算/战斗/游戏逻辑/音效）
├── hooks/          # 游戏主循环 Hook
└── __tests__/      # 核心测试
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

开发前建议阅读 `DEV_DOC.md` 了解项目架构与开发约束。

## 📄 开源协议

本项目基于 [GPL-3.0](LICENSE) 协议开源。

## ⭐ Star History

如果觉得有趣，欢迎给个 Star ⭐
