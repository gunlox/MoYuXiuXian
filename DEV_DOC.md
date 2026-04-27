# 摸鱼修仙 — 开发者文档

> **最新版本**：v3.7.0（2026-04-27）  
> **性质**：React + TypeScript + Vite 的纯前端单机放置修仙游戏。当前正式发版形态为单 HTML 文件；Electron 目录保留，但不属于当前默认发版链路。

---

## 1. 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript 5 |
| 构建 | Vite 6 |
| 样式 | TailwindCSS 3 |
| 单文件打包 | vite-plugin-singlefile |
| 测试 | Vitest |
| 桌面端 | Electron 41（保留可选支持） |

---

## 2. 当前项目结构（以代码为准）

```text
MoYuXiuXian/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── vite-env.d.ts
│   ├── components/                # 20个 UI 组件
│   │   ├── AchievementPanel.tsx
│   │   ├── AlchemyPanel.tsx
│   │   ├── AttributePanel.tsx
│   │   ├── BattlePanel.tsx
│   │   ├── BreakthroughPanel.tsx
│   │   ├── DisclaimerModal.tsx
│   │   ├── DungeonPanel.tsx
│   │   ├── EquipmentPanel.tsx
│   │   ├── FloatingText.tsx
│   │   ├── GameLog.tsx
│   │   ├── OfflineModal.tsx
│   │   ├── RealmInfo.tsx
│   │   ├── RebirthPanel.tsx
│   │   ├── ResourceBar.tsx
│   │   ├── SaveManager.tsx
│   │   ├── SaveSlotModal.tsx
│   │   ├── SectPanel.tsx
│   │   ├── SectSelectModal.tsx
│   │   ├── TechniquePanel.tsx
│   │   └── TutorialOverlay.tsx
│   ├── data/                      # 14个权威数据文件
│   │   ├── achievements.ts
│   │   ├── alchemy.ts
│   │   ├── dungeon.ts
│   │   ├── equipment.ts
│   │   ├── gameState.ts
│   │   ├── monsters.ts
│   │   ├── realms.ts
│   │   ├── rebirth.ts
│   │   ├── sect.ts
│   │   ├── sectPassives.ts
│   │   ├── sectShop.ts
│   │   ├── sectTasks.ts
│   │   ├── sectTrial.ts
│   │   └── sectUltimates.ts
│   ├── engine/                    # 5个引擎文件
│   │   ├── attributeCalc.ts
│   │   ├── audioEngine.ts
│   │   ├── battleEngine.ts
│   │   ├── gameEngine.ts
│   │   └── sectEngine.ts
│   ├── hooks/
│   │   ├── useGameLoop.ts
│   │   └── useSingleInstance.ts
│   └── __tests__/
│       ├── core.test.ts
│       └── sect-v3.7.0.test.ts
├── scripts/
│   └── injectPatchNote.ts
├── electron/
│   ├── main.cjs
│   └── launcher.bat
├── vite.config.ts
├── package.json
└── DEV_DOC.md
```

**权威约束**：

- 属性汇总唯一入口：`src/engine/attributeCalc.ts`
- 存档结构唯一入口：`src/data/gameState.ts`
- 数值规划核心入口：`src/data/realms.ts`、`src/data/equipment.ts`、`src/data/alchemy.ts`
- 掉落/离线/突破入口：`src/engine/gameEngine.ts`

---

## 3. 启动与运行流程

定义位置：`src/App.tsx`

当前启动顺序为：

1. `migrateLegacySave()` 先尝试把旧单存档迁移到槽位1
2. 显示 `DisclaimerModal`
3. 显示 `SaveSlotModal` 选择存档槽位或新建存档
4. 进入 `GameApp`
5. `GameApp` 内部接入 `useGameLoop`
6. 若是新档或未完成引导，显示 `TutorialOverlay`
7. 若尚未选择门派，显示 `SectSelectModal`

`App.tsx` 同时负责：

- 9个主 Tab 的切换
- 存档管理弹窗
- 离线收益弹窗
- 标签页标题设置
- 开发者工具弹窗（仅开发模式）
- 单实例保护失败时的阻止界面

---

## 4. 游戏状态与存档系统

定义位置：`src/data/gameState.ts`

### 4.1 GameState 核心字段分组

**基础进度**

- `realmIndex`
- `exp`
- `gold`
- `herbs`
- `fragments`
- `totalPlayTime`

**战斗与区域**

- `currentAreaId`
- `isBattling`
- `killCount`
- `breakthroughCount`
- `breakthroughFailCount`

**功法与装备**

- `equippedTechnique`
- `techniqueBag`
- `equippedArtifacts`
- `artifactBag`
- `autoSalvageQualities`
- `sessionAutoSalvageCount`
- `sessionAutoSalvageFragments`
- `masteredTechniques`

**丹药与秘境**

- `pills`
- `buffs`
- `breakthroughBonus`
- `stamina`
- `dungeonDailyCounts`
- `dungeonResetDate`

**长期成长**

- `sectId`
- `sectContribution`
- `sectLevel`
- `sectActivePassives`
- `sectDailyTasks`
- `sectDailyTaskDate`
- `sectGrowthTasksClaimed`
- `unlockedAchievements`
- `stats`
- `rebirthCount`
- `xianyuan`
- `rebirthPerks`
- `rebirthShopPurchases`

**界面与运行时**

- `customTabTitle`
- `logs`
- `lastSaveTime`

### 4.2 GameStats 字段

- `totalGoldEarned`
- `totalHerbsEarned`
- `alchemySuccessCount`
- `alchemyFailCount`
- `dungeonClearCount`
- `dungeonEnterCount`
- `maxRealmReached`

### 4.3 存档机制

- 主存档键：`moyu_slot_1` / `moyu_slot_2` / `moyu_slot_3`
- 旧兼容键：`moyu_xiuxian_save`
- 旧单存档会在启动时经 `migrateLegacySave()` 自动迁入槽位1
- `saveGameToSlot()` / `loadGameFromSlot()` 是当前主接口
- `saveGame()` / `loadGame()` / `clearSave()` 仍保留作旧接口兼容
- 所有字段迁移统一集中在 `migrateState()` 中

**新增 GameState 字段时必须同步**：

1. `GameState` interface
2. `createInitialState()`
3. `migrateState()`

---

## 5. 境界系统与基础数值

定义位置：`src/data/realms.ts`

### 5.1 境界结构

总计 **30层**：

| 大境界 | 索引范围 | 层数 |
|------|------|------|
| 练气 | 0 ~ 8 | 9 |
| 筑基 | 9 ~ 11 | 3 |
| 金丹 | 12 ~ 14 | 3 |
| 元婴 | 15 ~ 17 | 3 |
| 化神 | 18 ~ 20 | 3 |
| 渡劫 | 21 ~ 29 | 9 |

### 5.2 RealmLevel 字段

每层境界都定义了：

- `requiredExp`
- `expPerSecond`
- `goldPerSecond`
- `breakthroughCost`
- `breakthroughRate`
- `attributes.attack / defense / hp`

### 5.3 当前代码中的关键数值口径

- 境界基础属性最终由 `MAIN_ATTRIBUTE_SCALE = 10` 放大后写入 `REALM_TABLE`
- 渡劫九重基础属性固定为：
  - `attack = 10,000,000`
  - `defense = 7,500,000`
  - `hp = 100,000,000`
- 最低轮回境界：`realmIndex >= 23`（渡劫三重）

### 5.4 标准人口径（装备数值规划基准）

虽然玩家当前境界基础属性上限是 1000万 / 750万 / 1亿，但装备规划使用的“标准人”上限仍为：

- 攻击：`100,000,000`
- 防御：`75,000,000`
- 生命：`1,000,000,000`
- 暴击率上限：`100%`
- 暴击伤害加成上限：`5000%`
- 闪避上限：`75%`

这组基准当前直接体现在 `equipment.ts` 的装备基础值、百分比词条上限与档位比例计算中。

---

## 6. 属性计算总入口

定义位置：`src/engine/attributeCalc.ts`

### 6.1 主属性计算

主属性唯一入口：`calcFinalAttributes(state)`

```text
最终主属性 = floor((境界基础 × (1 + 功法倍率 + 门派倍率 + 轮回倍率 + 精通倍率) + 装备基础值 + 装备词条值) × (1 + 对应buff倍率 + 全属性buff倍率))
```

当前实现中：

- 境界基础：`getRealm(state.realmIndex).attributes`
- 功法倍率：`getTechBonuses(state.equippedTechnique)`
- 门派初始倍率：`getSect(state.sectId)?.bonus`
- 门派成长被动：`getSectGrowthBonuses(state)`
- 轮回倍率：`rebirthPerks.atkBonus / defBonus / hpBonus`
- 精通倍率：`getMasteryBonuses(masteredTechniques)`
- 装备基础：`getArtifactEnhancedBaseStats(...)`
- 装备词条：`getArtifactBonuses(art)`
- 主属性 buff：`atk_boost / def_boost / hp_boost / all_boost`

### 6.2 附加属性计算

附加属性唯一入口：`calcBonusAttributes(state)`

基础值与上限：

- `critRate`：基础 `0.05`，上限 `1.0`
- `critDmg`：基础 `0.10`，上限 `50.0`
- `dodge`：基础 `0`，上限 `0.75`

来源包括：

- 装备词条
- 装备基础百分比属性
- 当前装备功法
- 精通功法
- 门派暴击率
- 轮回暴击率
- 丹药 `crit_boost`

### 6.3 修炼速度倍率

入口：`getExpMultiplier(state)`

```text
expMul = 1
       + 当前功法 expBonus
       + 五件装备 expRate 词条
       + 丹药 exp_boost
       + 门派初始 expBonus
       + 门派成长被动 expBonus
       + 轮回 expBonus
       + 功法精通 expBonus
```

### 6.4 其他汇总函数

- 炼丹成功率加成：`getAlchemyBonus(state)`
- 掉落率加成：`getDropBonus(state)`
- 体力上限：`getStaminaMax(state)`
- 轮回突破率加成：`getBreakthroughPerkBonus(state)`
- 秘境奖励加成：`getDungeonBonus(state)`
- 战斗灵石收益加成：`getBattleGoldBonus(state)`

---

## 7. 功法系统

定义位置：`src/data/equipment.ts`

### 7.1 当前功法总数

当前代码共 **18本功法**：

- 白：7本
- 绿：2本
- 蓝：3本
- 紫：3本
- 橙：2本
- 红：1本

当前**没有 legend 功法**。

### 7.2 升级与精通规则

- 等级加成：`templateBonus × (1 + (level - 1) × 0.1)`
- 升级费用：`floor(upgradeCostBase × 1.5^currentLevel)`
- 精通加成：满级效果的 `50%`
- 精通叠加：多本可累加
- 精通记录：存于 `masteredTechniques`
- 轮回后：`masteredTechniques` 当前实现**不保留**

### 7.3 功法数值定位

`TECHNIQUE_TEMPLATES` 顶部注释已经说明当前功法设计目标：

- 功法整体目标贡献约占标准人的 `30%`
- 白功法是单属性专精
- 高品质功法逐步转向多属性综合成长

### 7.4 功法掉落

- 功法掉落逻辑定义在 `randomTechniqueDrop()`
- 最高掉落品质由 `getTechniqueDropMaxQualityIndex(realmIndex, rebirthCount)` 决定
- 当前功法掉落上限最高只到 `red`
- 已拥有 / 已装备 / 已精通的功法模板会被排除，不重复掉落

### 7.5 功法背包排序

- 功法背包显示由 `TechniquePanel.tsx` 中的 `sortedTechniqueBag` 统一排序
- 默认按功法品阶排序：高品阶在前、低品阶在后
- 已满级功法统一下沉到列表后部，避免影响当前可继续培养功法的查看
- 同品阶且未满级的功法，按当前已修炼等级从高到低排序
- 若前述条件完全相同，则按 `templateId` 做稳定排序，避免列表顺序抖动

---

## 8. 装备系统

定义位置：`src/data/equipment.ts`

### 8.1 装备槽位

- `weapon`
- `chest`
- `pants`
- `boots`
- `accessory`

### 8.2 装备模板与档位

- 当前共有 **115个装备模板**
  - 常规模板：`22个档位 × 5槽 = 110`
  - 传说模板：`5`
- `realmTier` 范围：`0 ~ 21`
  - `0` 对应练气
  - `21` 对应渡劫九重
  - legend 模板当前也使用 `realmTier = 21`

### 8.3 品质规则

品质顺序：

`white -> green -> blue -> purple -> orange -> red -> legend`

| 品质 | 词条数范围 | 强化上限 |
|------|------------|----------|
| white | 1~1 | 5 |
| green | 1~2 | 10 |
| blue | 1~3 | 15 |
| purple | 2~4 | 20 |
| orange | 3~5 | 30 |
| red | 4~6 | 50 |
| legend | 6~6 | 100 |

### 8.4 强化与分解

**强化只影响装备基础属性，不影响词条。**

- 强化倍率：`1 + progress × 1.5`
- `progress = min(level, maxLevel) / maxLevel`
- 满强化时，装备基础属性为原基础值的 `2.5倍`

强化费用：

- 灵石：`floor(base.gold × 1.5^level)`
- 碎片：`floor(base.frag × (1 + level × 0.5))`

分解收益来自 `getArtifactSalvageRewards(quality)`：

| 品质 | 灵石 | 碎片 |
|------|------|------|
| white | 30 | 2 |
| green | 200 | 4 |
| blue | 1000 | 6 |
| purple | 6000 | 10 |
| orange | 50000 | 16 |
| red | 300000 | 30 |
| legend | 4000000 | 100 |

### 8.5 装备基础属性

入口：`getArtifactBaseStats(slot, realmTier, rebirthCount)`

当前实现：

- `weapon`：只给攻击
- `chest`：只给生命
- `pants`：只给防御
- `boots`：只给闪避
- `accessory`：给暴击率 + 暴击伤害

主属性基础值采用：

```text
标准人主属性 × ARTIFACT_TIER_TOTAL_RATIO[t] × 20%
```

五转及以上：`rebirthCount >= 5` 时基础值额外乘 `2`

### 8.6 词条池与词条生成

当前5个槽位使用统一词条池，共7种：

- `atk`
- `def`
- `hp`
- `critRate`
- `critDmg`
- `dodge`
- `expRate`

**主属性/修炼速度词条**：

```text
baseRoll × QUALITY_VALUE_MULT × (1 + realmTier × 0.8) × fluctuation
```

其中：

- `fluctuation ∈ [0.75, 1.25]`
- `expRate` 有真实生效下限 `0.0001`（即 0.01%）

**百分比词条（当前已修正）**：

- `critRate`
- `critDmg`
- `dodge`

按当前代码规则：

```text
单件百分比词条范围
= 属性总上限 × 10% ÷ 5件 × [0.75, 1.25] × ARTIFACT_TIER_TOTAL_RATIO[t]
```

并通过 `getBoundedAffixValue()` 对旧存档异常词条做运行时限幅，显示层与实际生效共用同一套限幅逻辑。

### 8.7 掉落规则

装备掉落核心函数：`randomArtifactDrop(realmIndex, rebirthCount, slot?, targetRealmTier?)`

最高掉落品质：

- `0~8` -> `white`
- `9~11` -> `green`
- `12~14` -> `blue`
- `15~17` -> `purple`
- `18~20` -> `orange`
- `21~29` -> `red`
- `rebirthCount >= 5 && realmIndex >= 25` -> `legend`

红装档位限制：

- `realmIndex = 21` -> `r1`
- `realmIndex = 22` -> `r2`
- ...
- `realmIndex = 29` -> `r9`

传说模板只有五转且达到渡劫五重后才进入候选池。

---

## 9. 丹药与 Buff 系统

定义位置：`src/data/alchemy.ts`，UI：`src/components/AlchemyPanel.tsx`

### 9.1 当前丹药数量

当前共有 **25种丹药**：

- 白：2
- 绿：3
- 蓝：7
- 紫：7
- 橙：4
- 红：2

按大境界解锁分布：

| 大境界 | 解锁丹药 | 数量 |
|------|----------|------|
| 练气期 | 聚灵丹、回春丹、筑基丹、虎力丹、疾风丹 | 5 |
| 筑基期 | 活力丹、凝元丹、金刚丹、破境丹 | 4 |
| 金丹期 | 灵通丹、蛮力丹、护体丹 | 3 |
| 元婴期 | 续灵丹、化元丹、天元丹、元婴丹 | 4 |
| 化神期 | 悟道丹、战神丹、归元丹 | 3 |
| 渡劫期 | 渡劫丹、通天丹、九转金丹、混元仙丹、天髓丹、涅槃丹、太虚丹 | 6 |

### 9.2 配方字段

每个配方都定义：

- `quality`
- `effect`
- `herbCost`
- `goldCost`
- `successRate`
- `yield`
- `requiredRealmIndex`
- `maxUseRealmIndex?`

### 9.3 炼丹逻辑

- 成功率 = `min(1, recipe.successRate + getAlchemyBonus(state))`
- 炼丹成功：按 `yield` 增加到丹药背包
- 炼丹失败：消耗资源，无产出
- 炼丹统计：写入 `stats.alchemySuccessCount / alchemyFailCount`

### 9.4 Buff 规则

持续 Buff 统一按 `recipeId` 归并：

- 同种丹药重复服用：只延长持续时间，不叠加倍率
- 不同丹药：可同时存在并分别生效
- 最大可累计持续时间：`12小时`

特殊效果：

- `breakthrough_boost`：写入 `breakthroughBonus`，下次突破后清零
- `stamina_restore`：立即恢复体力
- `crit_exp_boost`：拆成 `exp_boost + crit_boost` 两个 Buff 条目

### 9.5 衰减与服用限制

`getPillDecayFactor(recipe, playerRealmIndex)` 使用大境界差做线性衰减：

| 高出大境界档数 | 系数 |
|------|------|
| 0 | 1.0 |
| 1 | 0.7 |
| 2 | 0.4 |
| 3 | 0.1 |
| >=4 | 0 |

当出现以下情况时禁止服用：

- 超过 `maxUseRealmIndex`
- 背包数量不足
- 衰减为 `0`
- 同种持续 Buff 已叠到 12 小时上限

### 9.6 炼丹界面当前行为

- 已解锁配方列表显示完整成本、效果与成功率
- 未解锁配方也会展示，并显示解锁条件
- 配方卡片根据 `requiredRealmIndex / maxUseRealmIndex` 自动显示：
  - `适用境界：...`
  - 或 `推荐境界：...起使用`

---

## 10. 讨伐区域系统

定义位置：`src/data/monsters.ts`

当前共有 **23个区域**：

- 常规区域：22个
- 五转专属区域：1个（`area_legend`）

### 10.1 解锁规则

入口：`getUnlockedAreas(realmIndex, rebirthCount)`

解锁条件：

```text
realmIndex >= requiredRealmIndex
&& (requiredRebirthCount === undefined || rebirthCount >= requiredRebirthCount)
```

`area_legend` 额外要求：

- `requiredRealmIndex = 25`
- `requiredRebirthCount = 5`

### 10.2 怪物结构

每个区域包含多只怪物，每只怪物定义：

- `attackMin / attackMax`
- `defense`
- `hpMin / hpMax`
- `expReward`
- `drops`

实际战斗属性并不是手写死表，而是通过 `buildMonsterStats(...)` 按区域阶段和怪物角色动态生成。

### 10.3 掉落类型

怪物基础掉落只包含三类：

- `gold`
- `herb`
- `fragment`

装备和功法掉落不是怪物表直接定义，而是在 `gameEngine.ts / applyBattleRewards()` 中追加判定。

---

## 11. 秘境系统

定义位置：`src/data/dungeon.ts`，UI：`src/components/DungeonPanel.tsx`

当前共有 **23个秘境**：

- 常规秘境：22个
- 五转专属秘境：1个（`dg_legend`）

### 11.1 模板字段

`DungeonTemplate` 包含：

- `requiredRealmIndex`
- `requiredRebirthCount?`
- `totalFloors`
- `staminaCost`
- `dailyLimit`
- `eventPool`
- `bossFloors`
- `rewardMultiplier`

### 11.2 解锁与体力

- 解锁函数：`getUnlockedDungeons(realmIndex, rebirthCount)`
- 体力上限：`100 + 大境界等级 × 20`（练气=100，筑基=120，金丹=140，元婴=160，化神=180，渡劫=200）
- 体力恢复速度：`0.05 + 大境界等级 × 0.01` 每秒（练气=0.05，渡劫=0.10）
- 轮回可额外提升体力上限：`rebirthPerks.staminaBonus`
- 相关函数：`getRealmStaminaMax(realmIndex)`, `getRealmStaminaRegen(realmIndex)`, `getStaminaMax(state)`, `getStaminaRegen(state)`

### 11.3 事件与探索

当前秘境事件类型：

- `treasure`
- `trap`
- `encounter`
- `boss`
- `spring`
- `empty`

单层探索入口：`exploreFloor(dungeon, floorNum, dungeonBonus, player?)`

奖励类型：

- `gold`、`exp`、`herb`、`fragment`、`pill`（丹药携带 `pillRecipeId`）

Boss 战胜率动态计算：

- 基础胜率 50%，每高出秘境要1级 +3%，每低于1级 -5%
- 胜率区间：30%~95%
- Boss 击败后 30% 概率掉落丹药（从秘境对应境界及以下的丹药池中随机抽取）
- 秘境奖励倍率受 `getDungeonBonus(state)` 影响

通关额外奖励：

- 全层通关后触发 `genClearBonus(dungeon, dungeonBonus)`
- 固定奖励：灵石 + 灵草 + 磎片
- 20% 概率额外掉落丹药

### 11.4 扫荡系统

- 每日首次通关某秘境后，记录到 `dungeonFirstClears[dungeonId]`
- 当日已首通的秘境可使用“扫荡”功能，一键获取平均奖励
- 扫荡体力消耗 = 正常消耗 × 70%（`SWEEP_STAMINA_DISCOUNT = 0.70`）
- 扫荡奖励由 `calcSweepRewards()` 计算，基于事件权重和Boss层数的期望值
- `dungeonFirstClears` 每日自动重置（随 `dungeonResetDate` 联动）

### 11.5 UI 优化

- 秘境列表按大境界分组显示，每组可折叠/展开
- 低于当前大境界的分组自动折叠
- 已解锁的最高级秘境标记“推荐”标签（金色高亮）
- 已首通秘境显示“✓已通关”标记和扫荡按钮
- 体力栏显示当前恢复速率和预估满体力时间

---

## 12. 战斗系统

定义位置：`src/data/monsters.ts`，`src/engine/battleEngine.ts`

### 12.1 单场战斗公式

战斗为回合制，最多 `50` 回合，玩家永远先手。

玩家基础伤害：

```text
max(player.attack - monster.defense × 0.5, player.attack × 0.1)
```

暴击后伤害：

```text
baseDmg × (1 + critDmg)
```

怪物伤害：

```text
max(monster.attack - player.defense × 0.5, monster.attack × 0.1)
```

当前代码里**没有“灵力”伤害项**。

### 12.2 附加属性在战斗中的作用

- `critRate`：决定玩家是否暴击
- `critDmg`：决定暴击倍率加成
- `dodge`：决定是否闪避怪物攻击

### 12.3 自动战斗循环

- 战斗间隔：`BATTLE_INTERVAL = 3000ms`
- 执行入口：`runOneAutoBattle()`
- UI 日志不是整场瞬间刷新，而是经 `useGameLoop` 以 `220ms` 步进回放

### 12.4 战后奖励链路

基础收益来自怪物本身：

- 修为
- 灵石
- 灵草
- 碎片

额外判定来自 `applyBattleRewards()`：

- 装备掉落：`10% + dropBonus`
- 功法掉落：`5% + dropBonus`

其中：

- 装备掉落走 `randomArtifactDrop(...)`
- 功法掉落走 `randomTechniqueDrop(...)`
- 已勾选的自动分解品质会直接转为灵石与碎片
- 装备面板支持“立即分解”按钮，可基于当前勾选品质一次性分解背包内所有匹配装备并汇总结算收益

### 12.5 离线与后台补偿

- 离线收益倍率：`OFFLINE_RATE = 0.8`
- 页面切后台时由 `visibilitychange` 记录隐藏时长
- 回前台后通过 `applyElapsedOfflineProgress(...)` 补偿
- 离线收益最多结算 `24小时`

---

## 13. 成就系统

定义位置：`src/data/achievements.ts`，领取检查位于 `src/components/AchievementPanel.tsx`

当前共有 **34个成就**。

### 13.1 条件类型

- `realm_reach`
- `kill_count`
- `breakthrough_count`
- `play_time`
- `gold_total`
- `dungeon_clear`
- `alchemy_count`
- `herb_total`

### 13.2 奖励类型

- `gold`
- `herb`
- `fragment`
- `exp`

### 13.3 存档字段

- 已领取记录：`unlockedAchievements`
- 统计来源：`stats`

当前 AchievementPanel 已实现可领取优先排序与即时领取反馈。

---

## 14. 门派系统

定义位置：`src/data/sect.ts`、`src/data/sectPassives.ts`、`src/data/sectTasks.ts`、`src/engine/sectEngine.ts`、`src/components/SectPanel.tsx`

### 14.1 门派选择

门派在开局通过 `SectSelectModal` 选择，之后写入 `sectId`，当前实现**不可更改**。

| 门派 | 初始加成 |
|------|----------|
| 剑宗 | 攻击+15%，暴击率+5% |
| 丹宗 | 修炼+5%，生命+5%，炼丹成功率+15% |
| 体修宗 | 攻击+5%，防御+12%，生命+12% |
| 灵宗 | 修炼+15%，暴击率+3% |
| 福地宗 | 修炼+5%，炼丹成功率+5%，掉落率+15% |

每个门派都有 `initialTechniqueId` 字段，拜入时赠送对应白色功法。

### 14.2 门派成长系统（v3.6.0）

门派深度化后，门派不再只是初始加成，而是一个可持续成长的系统。

**核心循环**：完成任务 → 获得贡献 → 累积升级 → 解锁被动

**门派等级**：最高5级，等级阈值定义在 `SECT_LEVEL_REQUIREMENTS`（`sectPassives.ts`）。

**门派被动**（`SECT_PASSIVES`）：每个门派定义多个里程碑被动，门派等级达标后自动解锁。被动效果类型包括：
- `expBonus` — 修炼速度
- `atkBonus` / `defBonus` / `hpBonus` — 主属性
- `critRateBonus` — 暴击率
- `alchemyBonus` — 炼丹成功率
- `dropBonus` — 掉落率
- `breakthroughBonus` — 突破成功率
- `dungeonBonus` — 秘境奖励
- `battleGoldBonus` — 战斗灵石

被动加成通过 `getSectGrowthBonuses(state)` 汇总，接入 `attributeCalc.ts` 中所有属性计算函数。

### 14.3 门派任务

**日常任务**（每日刷新2个）：
- 任务池定义在 `SECT_TASKS`（`sectTasks.ts`），按 `category: 'daily'` 筛选
- 每日凌晨自动刷新，由 `ensureSectDailyTasks()` 在游戏加载和 tick 时调用
- 进度通过 `updateSectTaskProgress(state, event)` 推进，支持的事件类型包括：
  `battle_win`、`breakthrough_success`、`alchemy_attempt`、`alchemy_success`、`dungeon_enter`、`dungeon_clear`
- 完成后自动发放贡献奖励

**成长任务**（一次性里程碑）：
- 按 `category: 'growth'` 筛选
- 达标后手动领取，领取记录存于 `sectGrowthTasksClaimed`
- 提供大量贡献奖励

### 14.4 门派引擎

`sectEngine.ts` 提供以下核心函数：

- `ensureSectDailyTasks(state)` — 检查并刷新日常任务
- `updateSectTaskProgress(state, event)` — 推进任务进度
- `claimGrowthTask(state, taskId)` — 领取成长任务奖励
- `refreshSectLevelAndPassives(state)` — 刷新等级与被动
- `getSectGrowthBonuses(state)` — 汇总已激活被动加成

### 14.5 任务接入点

门派任务进度在以下位置被推进：

- `gameEngine.ts`：战斗胜利（`battle_win`）、突破成功（`breakthrough_success`）
- `AlchemyPanel.tsx`：炼丹尝试（`alchemy_attempt`）、炼丹成功（`alchemy_success`）
- `DungeonPanel.tsx`：进入秘境（`dungeon_enter`）、通关秘境（`dungeon_clear`）

### 14.6 门派存档字段

| 字段 | 说明 |
|------|------|
| `sectContribution` | 当前累计贡献 |
| `sectLevel` | 当前门派等级（0~5）|
| `sectActivePassives` | 已激活的被动 ID 列表 |
| `sectDailyTasks` | 当日日常任务（含进度）|
| `sectDailyTaskDate` | 日常任务日期标记 |
| `sectGrowthTasksClaimed` | 已领取的成长任务 ID 列表 |

---

## 15. 轮回（转生）系统

定义位置：`src/data/rebirth.ts`，UI：`src/components/RebirthPanel.tsx`

### 15.1 转生条件与奖励

- 转生条件：`realmIndex >= 23`
- 仙缘奖励：

```text
base = 3 + max(0, realmIndex - 23)
reward = ceil(base × (1 + rebirthCount × 0.1))
```

> v3.6.0 修复：原公式使用 `floor` 向下取整，导致部分转生次数加成被吞（如九重第2次转生 `floor(9×1.1)=9` 与第1次相同）。改为 `ceil` 向上取整后每次转生保证仙缘增长。

### 15.2 轮回后保留内容

- `sectId`
- `unlockedAchievements`
- `stats`（并刷新 `maxRealmReached`）
- `totalPlayTime`
- `rebirthCount`
- `xianyuan`
- `rebirthPerks`
- `rebirthShopPurchases`
- 按 `expRetain` 保留的部分修为

### 15.3 轮回后重置内容

- 境界
- 装备与装备背包
- 功法背包与当前装备功法
- 丹药与 Buff
- 灵石 / 灵草 / 碎片
- 自动战斗状态
- `masteredTechniques`

### 15.4 轮回商店

当前共有 **13种轮回商店项**，覆盖：

- 修炼速度
- 攻击 / 防御 / 生命
- 暴击率
- 炼丹成功率
- 掉落率
- 初始灵石
- 体力上限
- 突破成功率
- 秘境奖励
- 战斗灵石收益
- 修为传承

---

## 16. 游戏主循环与运行时行为

定义位置：`src/hooks/useGameLoop.ts` + `src/engine/gameEngine.ts`

### 16.1 定时器

| 项目 | 间隔 | 作用 |
|------|------|------|
| 主 Tick | `100ms` | 推进修为、灵石、Buff 倒计时、体力恢复、秘境日期重置 |
| 自动战斗 | `3000ms` | 发起一场讨伐 |
| 自动保存 | `10000ms` | 保存到当前槽位 |
| 战斗日志回放 | `220ms` | 逐条播放战斗日志 |

### 16.2 核心推进函数

- `advanceGameTime()`：推进资源、Buff、体力、日期
- `runOneAutoBattle()`：执行一场战斗并结算奖励
- `attemptBreakthrough()`：执行突破判定
- `resolveOfflineProgress()`：统一离线结算入口

### 16.3 离线弹窗

- 启动时会先计算 `calcOfflineGains(initialState)`
- 若离线时间 `>= 60秒`，显示 `OfflineModal`
- 新档不显示离线收益弹窗

### 16.4 页面隐藏行为

- 隐藏前先补一次前台尚未结算的可见时长
- 恢复后按隐藏秒数追加后台补偿
- 战斗与普通 Tick 在页面隐藏时不直接跑前台循环，而是交由补偿逻辑一次性处理

---

## 17. 开发与构建

### 17.1 常用命令

```bash
npm run dev
npm test
npm run build
```

### 17.2 当前构建配置

- 版本号唯一来源：`package.json.version`
- 前端显示版本号注入：`__APP_VERSION__`
- 更新弹窗注入：`scripts/injectPatchNote.ts`
- 单文件输出插件：`vite-plugin-singlefile`
- 构建输出目录：`D:/AiWork/MoYuJJBOOM`
- 构建后文件名：`摸鱼修仙JJBOOM特供版v{version}.html`

### 17.3 开发者工具

仅在开发模式显示，当前按钮能力包括：

- 添加 100 个聚灵丹
- 添加测试资源
- 一键添加所有功法书
- 当前功法满级并精通

### 17.4 当前测试状态

- 核心测试文件：`src/__tests__/core.test.ts`
- 当前已通过：`116 / 116`

---

## 18. 版本控制与开源

### 18.1 Git 仓库

- **远程仓库**：https://github.com/gunlox/MoYuXiuXian
- **开源协议**：GPL-3.0
- **默认分支**：`main`（稳定发版分支）
- **初始提交**：v3.5.0（2026-04-04）

### 18.2 分支规范

| 类型 | 命名格式 | 示例 |
|------|----------|------|
| 版本开发 | `dev/v{版本号}` | `dev/v3.6.0` |
| 新功能 | `feature/{功能名}` | `feature/gold-shop` |
| 修 bug | `fix/{问题描述}` | `fix/pill-decay-bug` |

- 小改动可直接在 `main` 上提交
- 大功能从 `main` 迁出分支，开发完毕后合并回 `main`

### 18.3 提交规范

提交信息建议使用前缀：

- `feat:` 新功能
- `fix:` 修复 bug
- `refactor:` 重构
- `docs:` 文档更新
- `test:` 测试相关
- `release:` 发版

### 18.4 发版与标签

每次正式发版在 `main` 上打 Tag：

```bash
git tag -a v3.6.0 -m "版本说明"
git push origin v3.6.0
```

可在 GitHub Releases 页面上传构建好的单 HTML 文件供玩家下载。

### 18.5 .gitignore 排除规则

当前 `.gitignore` 排除以下内容：

- `node_modules/`、`dist/`、`release/`、`out/`
- IDE 配置（`.vscode/`、`.idea/`、`.windsurf/`、`.trae/`）
- 环境变量文件（`.env`、`.env.*`）
- TypeScript 编译缓存（`tsconfig.tsbuildinfo`）
- 内部开发文档（`CheckListDoc/`、`DevelopmentDoc/`、`Doc/`、`other/`、`数值体系审查报告.md`）

---

## 19. 开发注意事项

1. **属性计算不要分散实现**
   - `attributeCalc.ts` 是唯一属性汇总入口。
   - 任何新加成来源都应汇总到这里，而不是在 UI 或战斗逻辑里重复加值。

2. **新增 GameState 字段必须走完整迁移链路**
   - `interface`
   - `createInitialState()`
   - `migrateState()`

3. **React StrictMode 下必须保持不可变更新**
   - 不要直接改数组元素或对象字段。
   - 背包、丹药、装备、日志都必须使用不可变写法。

4. **`masteredTechniques` 当前设计为轮回后重置**
   - 文档、UI 和逻辑都要保持一致。

5. **装备百分比词条已有专门限幅逻辑**
   - `critRate / critDmg / dodge` 的生成、显示和生效必须共用当前标准人口径。
   - 修改时要同时检查 `generateAffixes()`、`getBoundedAffixValue()` 和显示层调用。

6. **强化只影响装备基础属性，不影响词条**
   - 装备词条值由 `getArtifactBonuses()` 汇总。
   - 强化倍率只作用在 `getArtifactEnhancedBaseStats()`。

7. **文档应以代码为最终标准**
   - 若设计稿、旧文档、测试注释与当前实现冲突，优先相信当前可运行代码。

---

## 20. 版本更新日志

### v3.6.0（2026-04-04）

**门派深度化系统上线**
- 门派不再只是初始加成，拜入后可在"门派"页签接取日常任务和成长任务
- 完成任务获得门派贡献，贡献累积提升门派等级（最高5级），解锁里程碑被动加成
- 五大门派各有独特被动方向：剑宗（攻暴）、丹宗（炼丹/修炼）、体修宗（防御/生命）、灵宗（修炼/突破）、福地宗（掉落/秘境）
- 每日刷新2个日常任务，支持战斗、突破、炼丹、秘境等事件自动推进进度
- 成长任务为一次性里程碑目标，达标后可领取大量贡献奖励

**新增文件**
- `src/components/SectPanel.tsx` — 门派页签 UI
- `src/data/sectPassives.ts` — 门派等级阈值与被动定义
- `src/data/sectTasks.ts` — 门派任务配置
- `src/engine/sectEngine.ts` — 门派成长核心逻辑

**属性计算接入**
- `attributeCalc.ts` 中所有属性计算函数（主属性、修炼速度、炼丹、掉落、突破、秘境、战斗灵石）均已接入门派成长被动

**仙缘公式修复**
- 修复转生仙缘计算因 `Math.floor` 向下取整导致转生次数加成被吞的问题（如九重第2次转生 `floor(9×1.1)=9` 与第1次相同）
- 改用 `Math.ceil` 向上取整，确保每次转生都能获得更多仙缘

**新手引导更新**
- "选择门派"步骤新增门派成长系统说明（任务→贡献→等级→被动）
- 结尾步骤新增提醒：别忘了每天去门派页签完成日常任务

**数据结构变更**
- `GameState` 新增字段：`sectContribution`、`sectLevel`、`sectActivePassives`、`sectDailyTasks`、`sectDailyTaskDate`、`sectGrowthTasksClaimed`
- 旧存档通过 `migrateState()` 自动补齐

**测试与构建**
- 核心测试已扩展并通过：`npm test`（116/116）
- 本次按既有单 HTML 发版规范输出构建产物

---

### v3.5.0（2026-04-01）

**丹药系统大幅扩充（大境界全覆盖）**
- 丹药配方从 14 种扩展为 **25 种**，新增 11 种丹药，覆盖筑基、金丹、元婴、化神、渡劫各阶段
- 体力恢复丹形成完整升级链：回春丹 → 活力丹 → 续灵丹 → 归元丹 → 天髓丹
- 突破丹形成完整升级链：筑基丹 → 破境丹 → 元婴丹 → 渡劫丹 → 涅槃丹
- 炼丹引导和配方说明同步强化，低阶丹药在高境界衰减、同类持续丹药只延长时间不叠倍率的规则继续保留

**新手引导全面改版**
- 引导从 8 步扩展为 **10 步**，覆盖门派、修炼、讨伐、功法、装备、炼丹、秘境、成就与轮回等完整主链路
- 新增“选择门派”步骤，并给出五大门派特点与新手推荐
- 各步骤新增 `tab` 对应与 `tip` 小贴士，内容区支持滚动，结尾按钮文案调整为“选择门派，开始修仙！”

**秘境系统与体力体验优化**
- Boss 战胜率按玩家境界与秘境要求境界差动态计算，范围控制在 30%~95%
- Boss 击败后可概率掉落丹药，全层通关后增加额外奖励宝箱
- 首通后解锁“一键扫荡”，扫荡体力消耗按原消耗的 70% 结算
- 体力系统随大境界成长：上限 `100 + 大境界等级 × 20`，恢复速度 `0.05 + 大境界等级 × 0.01` 每秒
- 秘境 UI 支持按大境界折叠分组、推荐标记、已通关标识与扫荡入口

**装备战力显示功能上线**
- 装备面板新增“装备战力”展示：已穿戴装备与背包装备都可直接查看单件静态评分
- 背包装备新增与当前同槽位已穿戴装备的战力差值展示，支持 `↑+X` / `↓-X` / `≈0` / `可装备` 四种状态
- 装备按钮在更优装备场景下可显示为“替换装备”，帮助玩家更快做出换装决策

**角色战力口径统一**
- 将角色属性面板中的战力公式统一抽离为公共函数：`attack + defense + floor(hp / 10)`
- 明确区分“装备战力”（单件装备比较评分）与“角色战力”（角色整体主属性展示值）两套概念

**实现细节与数值边界**
- 装备战力仅计算装备基础属性与词条属性，不计强化加成
- 装备战力明确不计入 `expRate`，避免成长效率词条抬高战斗评分
- 新增 `getArtifactBonusesWithoutEnhance()`，将装备评分口径与真实属性计算口径解耦
- 新增 `getArtifactPower()`，作为单件装备战力的统一计算入口

**BUG修复与文档同步**
- 修复装备战力曾错误受轮回倍率影响的问题；同一件装备在不同轮回次数下显示的装备战力现保持一致
- 清理 `getArtifactPower()` 中已无实际作用的冗余参数，避免后续继续误用角色成长变量参与装备评分
- 同步补齐装备战力功能的策划文档、开发文档与 checklist 文档，并将版本弹窗说明更新为 `v3.5.0`

**测试与构建**
- 核心测试已扩展并通过：`npm test` / `vitest run`（108/108）
- 本次继续按既有单 HTML 发版规范输出构建产物，并同步更新版本弹窗与开发者文档

---

### v2.0.1（2026-03-28）
**BUG修复**
- 传说品质装备分解碎片数量错误（实际只给1碎片），已修正为正确值100碎片（`src/components/EquipmentPanel.tsx`）

---

### v2.0.0（2026-03-28）
**大版本重构 — 全系统扩展与数值重平衡**

**系统扩展**
- **讨伐区域**：从6个扩展为 **23个 + 1个五转专属**，每个境界档一个独立区域，`Area` 接口新增 `requiredRebirthCount` 字段
- **秘境**：从8个扩展为 **23个 + 1个五转专属**，`DungeonTemplate` 新增 `requiredRebirthCount` 字段，五转渡劫五重解锁鸿蒙始源之地
- **装备槽位**：从3槽（weapon/armor/accessory）扩展为 **5槽**（weapon/chest/pants/boots/accessory）
- **装备品质**：新增 **传说品质**（legend，黄色），五转渡劫五重解锁，5件套
- **红品分档**：从3档扩展为 **9档**（r1~r9），渡劫每一重对应一个强度档，`randomArtifactDrop` 新增 `maxRedTier` 参数限制掉落档次
- **掉落控制**：新增 `getMaxRedTier(realmIndex)` 函数，`getMaxDropQuality` 新增 `rebirthCount` 参数支持传说品掉落判断

**数值重平衡**
- **全境界成长数值重设**（`src/data/realms.ts`）：基于期望停留时长精确设计 `requiredExp`，计入各境界段功法/精通的实际 `expMultiplier`
  - 练气×1.07 / 筑基×1.25 / 金丹×1.50 / 元婴×2.00 / 化神×2.75 / 渡劫×5.25
- **妖兽产出全面校准**（`src/data/monsters.ts`）：23个区域妖兽 `expReward` 和金币掉落与新境界数值体系对齐

**BUG修复**
- **修为溢出保留**（`src/engine/gameEngine.ts`）：突破成功后不再清零修为，改为 `exp = max(0, exp - requiredExp)`，溢出部分自动进入下一境界进度

**文档**
- 开发者文档全面更新至 v2.0.0，补充成长数值设计表、装备品质档位表、掉落限制规则、新接口字段说明

---

### v1.0.4（2026-03-28）
**BUG修复**
- 渡劫丹 `maxUseRealmIndex` 错误设为26（七重天劫），导致渡劫七重以上无法使用，已修正为29（覆盖完整渡劫期21-29）；`requiredRealmIndex` 同步从15修正为21

### v1.0.3（2026-03-28）
**新功能**
- 自定义浏览器标签页标题（底部 🏷️ 按钮）
- 开发者工具（底部 🔧 按钮，仅开发模式）
- 后台运行收益补偿（Page Visibility API）
- 丹药 buff 时间叠加，最多12小时
- buff 时间已满弹窗提示，不扣除丹药
- 未解锁丹药展示完整信息（名称/品质/解锁条件）

**BUG修复**
- 最小化后台不再暂停游戏（改为收益补偿）
- 轮回不再清零累计修炼时间和统计数据
- 服用丹药在 StrictMode 下可能扣2个（改用 map 不可变更新）

**数值优化**
- 修为速度显示格式：`40.00/秒 (25.00+15.00)`
- 装备分解碎片按品质给予（白1/绿2/蓝5/紫10/橙20/红50）

### v1.0.5（2026-03-28）
**新功能**
- 功法精通系统：功法升至满级自动精通，永久获得满级效果的50%加成，多本可叠加
- 装备面板新增"已精通功法"展示区域
- 开发者工具新增：一键添加所有功法书、当前功法满级并精通

### v1.0.6（2026-03-28）
**深度优化扩展**
- **秘境系统**：新增3个高级秘境（剑冢遗迹/化神期解锁、星辰塔/渡劫四重解锁、仙界裂隙/渡劫七重解锁），总计8个秘境
- **成就系统**：新增15个成就，覆盖化神境界、渡劫九重、高击杀数、大额炼丹、秘境百通、千万灵石等维度，总计35个成就
- **轮回商店**：新增5个永久加成道具（体魄强化+体力上限、破境之悟+突破率、秘境探索者+秘境奖励、战斗精通+战斗金币、修为传承+转生保留修为），总计13个商店道具
- **丹药系统**：新增5个丹药配方（回春丹/体力恢复、疾风丹/短时修炼、护体丹/生命加成、悟道丹/灵力修炼双加成、涅槃丹/神品突破丹），总计15个丹药
- **装备系统**：新增3个功法（烈焰诀蓝/玄冰心法紫/天罡北斗功橙）和9个法宝（各品质武器防具饰品补全），功法总计13个、法宝总计27个

**数据结构变更**
- `RebirthPerks` 新增5个字段：`staminaBonus`、`breakthroughBonus`、`dungeonBonus`、`battleGoldBonus`、`expRetain`
- `PillEffect` 新增效果类型：`stamina_restore`、`hp_boost`、`crit_exp_boost`
- `ActiveBuff.type` 新增：`hp_boost`、`crit_boost`

---

## 打包发布规范

### 输出文件命名规则
每次发布的构建产物（单HTML文件）必须按以下格式命名：

```
摸鱼修仙JJBOOM特供版v{版本号}.html
```

示例：`摸鱼修仙JJBOOM特供版v3.0.0.html`

### 发版操作步骤
1. 修改 `package.json` 中的 `version` 字段为新版本号
2. 更新 `scripts/injectPatchNote.ts` 中的 `PATCH_NOTES` 内容与发版日期
3. 更新 `DEV_DOC.md` 末尾的版本记录
4. 运行测试：`npm test`（确保全部通过）
5. 执行打包：`npm run build`
6. 输出目录：`dist/`，产物文件名自动重命名为规范格式

### 版本弹窗机制
- 插件位置：`scripts/injectPatchNote.ts`
- 构建版本号统一读取 `package.json.version`
- 仅在 `npm run build` 时注入，开发模式（`npm run dev`）不受影响
- 玩家首次打开新版本时弹出，点击确认后写入 `localStorage`，不再重复弹出
- 每次发版只需更新 `package.json.version`、`PATCH_NOTES` 与文档版本记录即可

---

### v3.4.5（2026-04-01）
**装备背包交互优化**
- 装备背包新增“立即分解”按钮，按当前勾选的自动分解品质，立即批量分解背包中对应品质装备
- 批量分解会一次性汇总本次获得的灵石与碎片，并写入游戏日志，减少逐件点按操作
- 当当前勾选品质没有可分解装备时，按钮禁用；若状态变化导致无目标，也会追加提示日志

**功法背包排序优化**
- 功法背包默认改为按功法品阶排序，高品质优先显示
- 已满级功法统一下沉到列表后部，优先展示仍可培养的功法
- 同品阶未满级功法按当前等级从高到低排列，方便连续培养与切换

**文档与版本同步**
- 同步更新 `DEV_DOC.md` 中的系统说明与版本记录
- 项目版本号升级为 `v3.4.5`，构建输出文件名与版本弹窗随 `package.json.version` 自动同步

**测试与构建**
- 本次按既有单 HTML 发版流程重新执行构建

---

### v3.4.2（2026-03-31）

**文档全文同步更新**
- 开发者文档已按当前代码实现重新梳理，覆盖项目结构、启动流程、存档体系、属性计算、功法、装备、丹药、讨伐、秘境、战斗、门派、轮回与主循环
- 校正文档中与当前实现不一致的旧描述，包括构建产物命名、区域/秘境数量、战斗公式、强化作用范围与各系统章节的实现口径

**版本与发版链路同步**
- 按“19:30 以后修改内容归入 v3.4.2”的规则，将本次修改统一归档到 `v3.4.2`
- 同步更新 `package.json`、`scripts/injectPatchNote.ts` 与 `DEV_DOC.md` 中的版本号和发版记录

**测试与构建**
- 本次发版继续按既有规范执行：先跑 `npm test`，再执行 `npm run build`

---

### v3.4.1（2026-03-31）

**装备分解紧急修复**
- 修复手动分解装备时，因点击排队与状态更新延迟导致的重复分解结算问题
- `EquipmentPanel.tsx` 的手动分解逻辑新增幂等校验：若目标装备已不在背包中，则后续排队点击不再重复发放奖励
- 分解按钮新增短暂“处理中”禁用态，减少玩家在界面未及时反馈时的连续点按误操作

**装备词条数值修正**
- 修复百分比词条沿用主属性倍率链路导致的暴击率、暴击伤害、闪避数值严重超标问题
- `critRate` / `critDmg` / `dodge` 词条现改为按标准人口径计算：词条基础总占比 10%、五件装备平分、单件保留 ±25% 浮动，并随 `ARTIFACT_TIER_TOTAL_RATIO` 按境界档位缩放
- 为旧存档超标百分比词条增加运行时限幅校正，词条显示与实际生效统一使用同一套限幅逻辑

**炼丹界面优化**
- 炼丹配方列表新增丹药适用境界/推荐境界标注，基于 `requiredRealmIndex` 与 `maxUseRealmIndex` 自动生成显示文案
- 对有限定使用区间的丹药显示“适用境界”，其余丹药显示“推荐境界起使用”，方便玩家判断当前阶段最适合炼制和服用的丹药

**发版说明补充**
- 由于 `v3.4.0` 尚未对外同步，本次 `v3.4.1` 的构建弹窗额外包含 `v3.4.0` 主要更新内容，便于一次性对外说明

**测试与构建**
- 当前核心测试已通过：`npm test`（80/80）
- 正式构建已按规范重新输出 `v3.4.1` 版本产物

---

### v3.4.0（2026-03-31）

**构建与版本管理统一**
- 版本号改为统一以 `package.json.version` 为唯一来源，右下角版本号、构建输出文件名与版本更新弹窗自动同步
- `vite.config.ts` 通过构建常量注入前端版本信息，避免多处手动改版本号造成正式包显示不一致
- 发版补丁弹窗改为接收构建版本参数，正式打包时自动使用当前版本号

**战斗与离线体验优化**
- 战斗日志改为逐条播放，每回合伤害、事件和血条状态按步骤展示，不再整场战斗结束后一次性刷出
- 离线收益弹窗新增“恢复体力”显示，帮助玩家确认秘境体力在离线期间的恢复结果
- 保留离线体力恢复既有逻辑，并补充测试锁定该行为

**装备与成长显示修正**
- 修复装备面板中 `expRate` 词条显示 `0.0%` 的问题，提升修炼速度词条显示精度
- 为 `expRate` 增加 `0.01%` 的真实生效下限，新生成装备与旧存档低值词条均按该下限实际生效
- 补充测试覆盖低值 `expRate`、被旧四舍五入截断为 `0` 的词条以及新生成词条下限规则

**成就与丹药界面优化**
- 成就列表新增动态排序：可领取成就自动置顶，领取后立即下沉到已完成区域
- 丹药衰减提示文案改为更直观的“丹药效果-xx%”形式，便于玩家理解实际损失比例
- 激活中的丹药 BUFF 倒计时统一改为整数秒显示，去除浮点秒噪音
- 激活中的丹药 BUFF 颜色改为与丹药本身品质一致，视觉反馈与丹药背包保持统一

**测试与稳定性补强**
- 补充高进阶讨伐区域真实奖励链路测试，确认不会回退到低境界装备模板
- 追加离线体力恢复、BUFF 时间格式化、`expRate` 下限等测试用例
- 当前核心测试已扩展并通过：`npm test`（78/78）

---

### v3.0.0（2026-03-29）
**属性重平衡（全系统重算）**
- 引入「标准人」基准：ATK=100,000,000 / DEF=75,000,000 / HP=1,000,000,000
- 属性来源分配：境界10% / 装备基础20% / 装备强化词条40% / 功法30%
- 重算所有境界属性（渡劫九重目标：ATK=10,000,000 / DEF=7,500,000 / HP=100,000,000）
- 重算装备基础属性（tier21：武器ATK=20,000,000 / 裤子DEF=15,000,000 / 上衣HP=200,000,000）
- 重算词条数值（金色+100强化tier21，5件合计提供标准人40%属性）
- 重算功法倍率（红品满级总倍率≈3.0×）
- 重算所有怪物属性（基准为各境界玩家境界+装备≈30%标准人战力，3~8秒击杀）

**境界停留时间对齐**
- 按设计停留时长重算各境界所需修为（`src/data/realms.ts`）
- 练气期9层合计从~1.49h修正为~0.49h（≈0.5h目标）

**讨伐UI调整**
- 战斗区域（当前区域信息+控制按钮+血条+妖兽列表+战斗日志）移至上方
- 地图区域选择移至下方

**装备系统扩展**
- 新增词条类型 `expRate`（修炼速度），7种词条全面对齐
- 所有5个装备槽位词条池统一为7种：攻击/防御/气血/暴击率/暴击伤害/闪避/修炼速度
- `getArtifactBonuses` 返回值新增 `expRate` 字段
- `getExpMultiplier` 接入装备 `expRate` 词条加成
- `AttributePanel` 修炼速度标签更新为"修炼加持"（含装备来源）
- `renderArtBonuses` 新增修炼速度展示

**功法系统扩展**
- 白色功法从2本扩展至7本，每本专精一种属性：
  - 吐纳术（修炼速度）/ 炼体术（气血）/ 力劲诀（攻击）/ 硬气功（防御）
  - 灵眼术（暴击率）/ 破甲诀（暴击伤害）/ 轻身诀（闪避）
- 功法总数：19本

**数据结构变更**
- `AffixType` 新增 `'expRate'`
- `AFFIX_BASE` 新增 `expRate: [0.0001, 0.0002]`（金色tier21单词条约5%~10%）
- `SLOT_AFFIX_POOL` 所有槽位统一为7种词条
- `TECHNIQUE_TEMPLATES` 新增5本白色功法（tech_w3~tech_w7）

**BUG修复**
- 修复 `expRate` 词条基础值过高（原值导致金色tier21单词条≈534%，修正为≈5~10%）
- 修复 `renderArtBonuses` 遗漏 `expRate` 展示
- 修复 `AttributePanel` 修炼速度标签仅显示功法来源

**测试体系**
- 引入 Vitest 测试框架
- 新增 `src/__tests__/core.test.ts`，共59个测试用例
- 覆盖：数据完整性 / 格式化工具 / 属性计算 / 装备词条 / 功法系统 / 战斗引擎 / 游戏引擎 / expRate集成
- 运行命令：`npm test`

---

### v3.1.0（2026-03-29）

**境界数值重平衡（Sheet3）**
- 依据新数值体验表（Sheet3）重新校准各境界所需修为（`src/data/realms.ts`）
- 期望停留时长调整为：练气 `0.05/0.05/0.05/0.1/0.1/0.1/0.2/0.2/0.25h`，筑基 `0.5/0.5/1h`，金丹 `0.8/1.2/2h`，元婴 `1.5/2.5/4h`，化神 `3/4/6h`，渡劫 `5/5.5/7/6/7/10/9/11/14h`
- expMultiplier 基准更新：练气×1.07 / 筑基×1.26 / 金丹×1.51 / 元婴×1.90 / 化神×2.49 / 渡劫×3.40
- `requiredExp` 按 `expPerSecond × 停留秒数 × expMultiplier` 重算，与当前修炼速度体系对齐

**属性体系重新划分**
- 标准人仍为：ATK=100,000,000 / DEF=75,000,000 / HP=1,000,000,000
- 属性来源按 Sheet1 固定为：境界10% / 装备基础20% / 词条基础10% / 强化+100额外30% / 功法30%
- 装备基础主属性改为按真实境界档位比例直接取值，不再线性插值
- 主属性词条保留产出时 `±25%` 波动；强化曲线改为 `1 + level × 0.03`，使 `+100` 时总倍率为 `4.0`
- `expRate` 词条基础值同步下调，修为产出回到“功法主导、词条补充”的分配

**战斗节奏重设计**
- 依据 Sheet2 重新设计各期代表玩家裸属性基准（`monsters.ts`）：
  | 境界期 | ATK |
  | --- | --- |
  | 练气期 | 50,000 |
  | 筑基期 | 250,000 |
  | 金丹期 | 550,000 |
  | 元婴期 | 1,150,000 |
  | 化神期 | 2,250,000 |
  | 渡劫期 | 6,000,000 |
- 各档怪物统一划分为 `weak / mid / strong / boss` 四档，并按战斗公式反推攻击/防御/血量
- 每档怪物都由“目标回合数 + 玩家掉血比例”自动生成，避免继续手填数百个属性值

**怪物属性重设计**
- 23个常规区域 + 1个五转专属区域的怪物，现统一使用区域蓝图 + 节奏公式生成最终属性
- 五转专属区域沿用渡劫节奏模板，并在最终属性上额外乘以 `1.83` 强度倍率
- 区域名称、掉落、经验奖励保留，战斗属性由公式统一推导

**丹药系统升级**
- 新增高境界服用低境界丹药效果衰减机制（`src/data/alchemy.ts`）
- 新增 `getMajorRealmTier(realmIndex)`：将子境界索引映射为6档大境界（0=练气~5=渡劫）
- 新增 `getPillDecayFactor(recipe, playerRealmIndex)`：衰减系数 = `max(0, 1 - n×0.3)`
- 高出4档及以上效果归零，服用时弹窗提示"效果已衰减至零，此丹药对你毫无作用"
- `exp_boost` 类型 buff 改为独立叠加（每次服用推入新条目，各自独立计时）
- `crit_exp_boost`（悟道丹）的修炼加成部分同样改为独立叠加

**BUG修复**
- 修复旧存档装备 `level` 字段缺失（`undefined`）导致 `getArtifactBonuses` 计算产生 NaN，进而暴击率显示 NaN% 的问题（`src/data/equipment.ts`，`art.level ?? 0`）

---

### v3.2.0（2026-03-30）

**Sheet1 属性体系重做**
- 标准人基准维持为：ATK=100,000,000 / DEF=75,000,000 / HP=1,000,000,000
- 属性来源正式拆分为：境界10% / 装备基础20% / 词条基础10% / 强化+100额外30% / 功法30%
- 装备基础主属性改为按真实境界档位比例直接取值，不再使用线性插值
- 主属性词条产出保留 `±25%` 波动，强化曲线改为 `1 + level × 0.03`
- `expRate` 词条基础值同步下调，修为收益重新回到“功法主导、词条补充”

**Sheet2 怪物节奏公式化**
- `src/data/monsters.ts` 改为“区域蓝图 + 节奏公式生成”结构
- 怪物按 `weak / mid / strong / boss` 四档，根据目标回合数与玩家掉血比例自动反推攻击/防御/生命
- 23个常规区域与五转专属区域全部接入统一战斗节奏公式，后续调参只需改模板参数

**Sheet3 境界进度重算**
- `src/data/realms.ts` 中各子境界 `requiredExp` 全量按停留时长目标重算
- 停留时长调整为：练气 `0.05~0.25h`，筑基 `0.5/0.5/1h`，金丹 `0.8/1.2/2h`，元婴 `1.5/2.5/4h`，化神 `3/4/6h`，渡劫 `5~14h`
- `requiredExp = expPerSecond × 停留秒数 × expMultiplier`，与当前修炼速度体系直接对齐

**发版与工程整理**
- 首次运行版本弹窗更新为 `v3.2.0` 简略说明，且仍然仅在 `npm run build` 时注入，不影响开发模式
- 清理怪物表中遗留的旧手填战斗数值注释与占位说明，保留当前权威实现
- 测试已通过：`npm test`（59/59）
