import { getMajorRealmTier, PILL_RECIPES } from './alchemy';

// ============ 秘境事件类型 ============

export type DungeonEventType = 'treasure' | 'trap' | 'encounter' | 'boss' | 'spring' | 'empty';

/** 秘境事件 */
export interface DungeonEvent {
  type: DungeonEventType;
  title: string;
  description: string;
  /** 事件结果（由探索引擎填充） */
}

/** 秘境层定义 */
export interface DungeonFloor {
  floor: number;
  events: { type: DungeonEventType; weight: number }[];
  /** Boss层标记 */
  isBoss: boolean;
}

/** 秘境定义 */
export interface DungeonTemplate {
  id: string;
  name: string;
  description: string;
  requiredRealmIndex: number;
  /** 额外要求的最低转生次数（可选，用于五转专属秘境） */
  requiredRebirthCount?: number;
  totalFloors: number;
  /** 每次进入消耗体力 */
  staminaCost: number;
  /** 每日可进入次数 */
  dailyLimit: number;
  /** 事件权重池（非Boss层） */
  eventPool: { type: DungeonEventType; weight: number }[];
  /** Boss层数（如5, 10层有Boss） */
  bossFloors: number[];
  /** 奖励倍率（基于境界） */
  rewardMultiplier: number;
}

/** 秘境探索结果 */
export interface ExploreResult {
  floor: number;
  eventType: DungeonEventType;
  title: string;
  description: string;
  rewards: ExploreReward[];
  damage: number; // 受到的伤害(扣体力)
  completed: boolean; // 本层是否完成(Boss可能失败)
}

export interface ExploreReward {
  type: 'gold' | 'exp' | 'herb' | 'fragment' | 'pill';
  name: string;
  amount: number;
  /** 丹药奖励时携带 recipeId，用于加入背包 */
  pillRecipeId?: string;
}

// ============ 秘境模板（23个，每境界档一个）============

export const DUNGEON_TEMPLATES: DungeonTemplate[] = [

  // ── 练气期（白品）──
  {
    id: 'dg_lq', name: '灵虚洞天', description: '练气弟子的初入秘境，暗藏微末机缘',
    requiredRealmIndex: 0, totalFloors: 5, staminaCost: 10, dailyLimit: 3,
    eventPool: [{ type: 'treasure', weight: 25 }, { type: 'trap', weight: 20 }, { type: 'encounter', weight: 15 }, { type: 'spring', weight: 15 }, { type: 'empty', weight: 25 }],
    bossFloors: [5], rewardMultiplier: 1,
  },

  // ── 筑基初期（绿品低）──
  {
    id: 'dg_zj1', name: '幽冥古墓', description: '上古大能的陵寝，藏有筑基初期宝物',
    requiredRealmIndex: 9, totalFloors: 6, staminaCost: 18, dailyLimit: 3,
    eventPool: [{ type: 'treasure', weight: 22 }, { type: 'trap', weight: 22 }, { type: 'encounter', weight: 18 }, { type: 'spring', weight: 12 }, { type: 'empty', weight: 26 }],
    bossFloors: [6], rewardMultiplier: 3,
  },

  // ── 筑基中期（绿品中）──
  {
    id: 'dg_zj2', name: '矿洞秘府', description: '深藏矿洞的古修秘府，筑基中期修士的试炼',
    requiredRealmIndex: 10, totalFloors: 7, staminaCost: 22, dailyLimit: 3,
    eventPool: [{ type: 'treasure', weight: 22 }, { type: 'trap', weight: 24 }, { type: 'encounter', weight: 18 }, { type: 'spring', weight: 10 }, { type: 'empty', weight: 26 }],
    bossFloors: [7], rewardMultiplier: 5,
  },

  // ── 筑基后期（绿品高）──
  {
    id: 'dg_zj3', name: '荒古秘窟', description: '遗迹深处的古修秘窟，筑基后期宝物沉眠于此',
    requiredRealmIndex: 11, totalFloors: 8, staminaCost: 26, dailyLimit: 2,
    eventPool: [{ type: 'treasure', weight: 21 }, { type: 'trap', weight: 25 }, { type: 'encounter', weight: 20 }, { type: 'spring', weight: 9 }, { type: 'empty', weight: 25 }],
    bossFloors: [4, 8], rewardMultiplier: 8,
  },

  // ── 金丹初期（蓝品低）──
  {
    id: 'dg_jd1', name: '天火熔炉', description: '远古炼器圣地，金丹初期天材地宝蕴于此',
    requiredRealmIndex: 12, totalFloors: 9, staminaCost: 30, dailyLimit: 2,
    eventPool: [{ type: 'treasure', weight: 20 }, { type: 'trap', weight: 27 }, { type: 'encounter', weight: 22 }, { type: 'spring', weight: 8 }, { type: 'empty', weight: 23 }],
    bossFloors: [5, 9], rewardMultiplier: 12,
  },

  // ── 金丹中期（蓝品中）──
  {
    id: 'dg_jd2', name: '玄冰秘境', description: '万年冰封的神秘洞天，金丹中期修士的磨砺',
    requiredRealmIndex: 13, totalFloors: 10, staminaCost: 34, dailyLimit: 2,
    eventPool: [{ type: 'treasure', weight: 20 }, { type: 'trap', weight: 28 }, { type: 'encounter', weight: 22 }, { type: 'spring', weight: 7 }, { type: 'empty', weight: 23 }],
    bossFloors: [5, 10], rewardMultiplier: 18,
  },

  // ── 金丹后期（蓝品高）──
  {
    id: 'dg_jd3', name: '幽冥秘地', description: '阴气凝结的地底秘地，金丹后期强者留下的遗宝',
    requiredRealmIndex: 14, totalFloors: 10, staminaCost: 38, dailyLimit: 2,
    eventPool: [{ type: 'treasure', weight: 19 }, { type: 'trap', weight: 29 }, { type: 'encounter', weight: 23 }, { type: 'spring', weight: 7 }, { type: 'empty', weight: 22 }],
    bossFloors: [5, 10], rewardMultiplier: 25,
  },

  // ── 元婴初期（紫品低）──
  {
    id: 'dg_yy1', name: '万妖秘境', description: '万妖之主的禁地，元婴初期宝物遍布',
    requiredRealmIndex: 15, totalFloors: 11, staminaCost: 42, dailyLimit: 2,
    eventPool: [{ type: 'treasure', weight: 18 }, { type: 'trap', weight: 30 }, { type: 'encounter', weight: 25 }, { type: 'spring', weight: 7 }, { type: 'empty', weight: 20 }],
    bossFloors: [4, 8, 11], rewardMultiplier: 35,
  },

  // ── 元婴中期（紫品中）──
  {
    id: 'dg_yy2', name: '魔域秘窟', description: '万魔聚集的古老秘窟，元婴中期宝物沉睡',
    requiredRealmIndex: 16, totalFloors: 12, staminaCost: 46, dailyLimit: 2,
    eventPool: [{ type: 'treasure', weight: 17 }, { type: 'trap', weight: 31 }, { type: 'encounter', weight: 26 }, { type: 'spring', weight: 6 }, { type: 'empty', weight: 20 }],
    bossFloors: [4, 8, 12], rewardMultiplier: 50,
  },

  // ── 元婴后期（紫品高）──
  {
    id: 'dg_yy3', name: '星陨秘境', description: '陨星坠落所形成的神秘洞天，元婴后期至宝',
    requiredRealmIndex: 17, totalFloors: 12, staminaCost: 50, dailyLimit: 2,
    eventPool: [{ type: 'treasure', weight: 17 }, { type: 'trap', weight: 31 }, { type: 'encounter', weight: 26 }, { type: 'spring', weight: 6 }, { type: 'empty', weight: 20 }],
    bossFloors: [4, 8, 12], rewardMultiplier: 70,
  },

  // ── 化神初期（橙品低）──
  {
    id: 'dg_hs1', name: '剑冢遗迹', description: '上古剑修的埋骨之地，化神初期宝物留存',
    requiredRealmIndex: 18, totalFloors: 12, staminaCost: 50, dailyLimit: 2,
    eventPool: [{ type: 'treasure', weight: 18 }, { type: 'trap', weight: 30 }, { type: 'encounter', weight: 25 }, { type: 'spring', weight: 7 }, { type: 'empty', weight: 20 }],
    bossFloors: [4, 8, 12], rewardMultiplier: 100,
  },

  // ── 化神中期（橙品中）──
  {
    id: 'dg_hs2', name: '太古战场遗迹', description: '神魔大战遗留的战场秘境，化神中期宝物',
    requiredRealmIndex: 19, totalFloors: 13, staminaCost: 55, dailyLimit: 2,
    eventPool: [{ type: 'treasure', weight: 17 }, { type: 'trap', weight: 31 }, { type: 'encounter', weight: 26 }, { type: 'spring', weight: 6 }, { type: 'empty', weight: 20 }],
    bossFloors: [5, 9, 13], rewardMultiplier: 140,
  },

  // ── 化神后期（橙品高）──
  {
    id: 'dg_hs3', name: '三清道宫秘境', description: '三清道祖的隐秘道场，化神后期绝世宝物',
    requiredRealmIndex: 20, totalFloors: 14, staminaCost: 58, dailyLimit: 1,
    eventPool: [{ type: 'treasure', weight: 17 }, { type: 'trap', weight: 32 }, { type: 'encounter', weight: 27 }, { type: 'spring', weight: 5 }, { type: 'empty', weight: 19 }],
    bossFloors: [5, 10, 14], rewardMultiplier: 190,
  },

  // ── 渡劫一重（红品r1）──
  {
    id: 'dg_dj1', name: '混沌秘界·一重', description: '天地法则崩坏之秘境，渡劫一重天劫宝物',
    requiredRealmIndex: 21, totalFloors: 14, staminaCost: 60, dailyLimit: 1,
    eventPool: [{ type: 'treasure', weight: 16 }, { type: 'trap', weight: 32 }, { type: 'encounter', weight: 28 }, { type: 'spring', weight: 5 }, { type: 'empty', weight: 19 }],
    bossFloors: [5, 10, 14], rewardMultiplier: 250,
  },

  // ── 渡劫二重（红品r2）──
  {
    id: 'dg_dj2', name: '混沌秘界·二重', description: '二重天劫余威弥漫，渡劫二重修士的禁地',
    requiredRealmIndex: 22, totalFloors: 15, staminaCost: 63, dailyLimit: 1,
    eventPool: [{ type: 'treasure', weight: 16 }, { type: 'trap', weight: 33 }, { type: 'encounter', weight: 28 }, { type: 'spring', weight: 4 }, { type: 'empty', weight: 19 }],
    bossFloors: [5, 10, 15], rewardMultiplier: 320,
  },

  // ── 渡劫三重（红品r3）──
  {
    id: 'dg_dj3', name: '混沌秘界·三重', description: '三重天诛之力凝聚，渡劫三重宝物沉睡',
    requiredRealmIndex: 23, totalFloors: 15, staminaCost: 66, dailyLimit: 1,
    eventPool: [{ type: 'treasure', weight: 15 }, { type: 'trap', weight: 33 }, { type: 'encounter', weight: 29 }, { type: 'spring', weight: 4 }, { type: 'empty', weight: 19 }],
    bossFloors: [5, 10, 15], rewardMultiplier: 400,
  },

  // ── 渡劫四重（红品r4）──
  {
    id: 'dg_dj4', name: '星辰塔·四重', description: '直通星空的神秘高塔，渡劫四重层级',
    requiredRealmIndex: 24, totalFloors: 16, staminaCost: 68, dailyLimit: 1,
    eventPool: [{ type: 'treasure', weight: 15 }, { type: 'trap', weight: 34 }, { type: 'encounter', weight: 29 }, { type: 'spring', weight: 4 }, { type: 'empty', weight: 18 }],
    bossFloors: [4, 8, 12, 16], rewardMultiplier: 500,
  },

  // ── 渡劫五重（红品r5）──
  {
    id: 'dg_dj5', name: '星辰塔·五重', description: '玄冥之气弥漫的塔层，渡劫五重宝物',
    requiredRealmIndex: 25, totalFloors: 17, staminaCost: 70, dailyLimit: 1,
    eventPool: [{ type: 'treasure', weight: 15 }, { type: 'trap', weight: 34 }, { type: 'encounter', weight: 29 }, { type: 'spring', weight: 4 }, { type: 'empty', weight: 18 }],
    bossFloors: [4, 9, 13, 17], rewardMultiplier: 620,
  },

  // ── 渡劫六重（红品r6）──
  {
    id: 'dg_dj6', name: '仙界裂隙·六重', description: '连接仙界的时空裂缝深处，渡劫六重宝物',
    requiredRealmIndex: 26, totalFloors: 18, staminaCost: 72, dailyLimit: 1,
    eventPool: [{ type: 'treasure', weight: 15 }, { type: 'trap', weight: 35 }, { type: 'encounter', weight: 30 }, { type: 'spring', weight: 3 }, { type: 'empty', weight: 17 }],
    bossFloors: [5, 10, 15, 18], rewardMultiplier: 780,
  },

  // ── 渡劫七重（红品r7）──
  {
    id: 'dg_dj7', name: '仙界裂隙·七重', description: '仙界能量最为浓郁的裂隙层，渡劫七重',
    requiredRealmIndex: 27, totalFloors: 20, staminaCost: 75, dailyLimit: 1,
    eventPool: [{ type: 'treasure', weight: 15 }, { type: 'trap', weight: 35 }, { type: 'encounter', weight: 30 }, { type: 'spring', weight: 3 }, { type: 'empty', weight: 17 }],
    bossFloors: [5, 10, 15, 20], rewardMultiplier: 980,
  },

  // ── 渡劫八重（红品r8）──
  {
    id: 'dg_dj8', name: '鸿蒙虚空秘境', description: '鸿蒙之气充盈的绝顶秘境，渡劫八重宝物',
    requiredRealmIndex: 28, totalFloors: 22, staminaCost: 78, dailyLimit: 1,
    eventPool: [{ type: 'treasure', weight: 14 }, { type: 'trap', weight: 36 }, { type: 'encounter', weight: 31 }, { type: 'spring', weight: 3 }, { type: 'empty', weight: 16 }],
    bossFloors: [5, 11, 17, 22], rewardMultiplier: 1200,
  },

  // ── 渡劫九重（红品r9）──
  {
    id: 'dg_dj9', name: '九天极境', description: '九重天之上的绝顶秘境，渡劫九重无上宝物',
    requiredRealmIndex: 29, totalFloors: 25, staminaCost: 80, dailyLimit: 1,
    eventPool: [{ type: 'treasure', weight: 14 }, { type: 'trap', weight: 36 }, { type: 'encounter', weight: 32 }, { type: 'spring', weight: 2 }, { type: 'empty', weight: 16 }],
    bossFloors: [5, 10, 15, 20, 25], rewardMultiplier: 1500,
  },

  // ── 五转渡劫五重（传说品，需5转）──
  {
    id: 'dg_legend', name: '鸿蒙始源秘境', description: '五转轮回方可感知的始源秘境，传说宝物的唯一来源',
    requiredRealmIndex: 25, requiredRebirthCount: 5, totalFloors: 30, staminaCost: 100, dailyLimit: 1,
    eventPool: [{ type: 'treasure', weight: 20 }, { type: 'trap', weight: 30 }, { type: 'encounter', weight: 30 }, { type: 'spring', weight: 5 }, { type: 'empty', weight: 15 }],
    bossFloors: [5, 10, 15, 20, 25, 30], rewardMultiplier: 5000,
  },
];

export function getDungeonTemplate(id: string): DungeonTemplate | undefined {
  return DUNGEON_TEMPLATES.find(d => d.id === id);
}

export function getUnlockedDungeons(realmIndex: number, rebirthCount: number = 0): DungeonTemplate[] {
  return DUNGEON_TEMPLATES.filter(d =>
    realmIndex >= d.requiredRealmIndex &&
    (d.requiredRebirthCount === undefined || rebirthCount >= d.requiredRebirthCount)
  );
}

// ============ 体力系统 ============

/** 基础体力上限 */
export const BASE_STAMINA = 100;
/** 每个大境界额外增加的体力上限 */
export const STAMINA_PER_MAJOR_REALM = 20;
/** 基础每秒恢复体力 */
export const BASE_STAMINA_REGEN = 0.05;
/** 每个大境界额外增加的每秒恢复量 */
export const STAMINA_REGEN_PER_MAJOR_REALM = 0.01;
/** 扫荡体力消耗折扣（70%） */
export const SWEEP_STAMINA_DISCOUNT = 0.70;

/** 旧版兼容常量（仅保留引用，等于基础值） */
export const MAX_STAMINA = BASE_STAMINA;
export const STAMINA_REGEN_PER_SEC = BASE_STAMINA_REGEN;

/** 根据境界索引计算体力上限基础值（不含轮回加成） */
export function getRealmStaminaMax(realmIndex: number): number {
  const tier = getMajorRealmTier(realmIndex);
  return BASE_STAMINA + tier * STAMINA_PER_MAJOR_REALM;
}

/** 根据境界索引计算体力恢复速度（每秒） */
export function getRealmStaminaRegen(realmIndex: number): number {
  const tier = getMajorRealmTier(realmIndex);
  return BASE_STAMINA_REGEN + tier * STAMINA_REGEN_PER_MAJOR_REALM;
}

// ============ 探索引擎 ============

/** 从事件池中随机选择事件类型 */
function rollEvent(pool: { type: DungeonEventType; weight: number }[]): DungeonEventType {
  const total = pool.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * total;
  for (const e of pool) {
    roll -= e.weight;
    if (roll <= 0) return e.type;
  }
  return 'empty';
}

/** 生成宝箱事件 */
function genTreasure(mul: number): ExploreResult {
  const rewards: ExploreReward[] = [];
  const goldAmount = Math.floor((50 + Math.random() * 100) * mul);
  rewards.push({ type: 'gold', name: '灵石', amount: goldAmount });
  if (Math.random() < 0.4) {
    rewards.push({ type: 'herb', name: '灵草', amount: Math.floor(1 + Math.random() * 3 * Math.sqrt(mul)) });
  }
  if (Math.random() < 0.2) {
    rewards.push({ type: 'fragment', name: '装备碎片', amount: Math.floor(1 + Math.random() * 2) });
  }
  return {
    floor: 0, eventType: 'treasure',
    title: '💰 发现宝箱！',
    description: '你发现了一个散发着灵光的宝箱',
    rewards, damage: 0, completed: true,
  };
}

/** 生成陷阱事件 */
function genTrap(mul: number): ExploreResult {
  const damage = Math.floor(3 + Math.random() * 5);
  const rewards: ExploreReward[] = [];
  // 陷阱有小概率也有奖励（破解机关）
  if (Math.random() < 0.3) {
    rewards.push({ type: 'exp', name: '修为', amount: Math.floor(30 * mul) });
  }
  const traps = ['毒雾阵', '落石机关', '幻阵', '封印结界', '地火喷涌'];
  return {
    floor: 0, eventType: 'trap',
    title: `⚠️ ${traps[Math.floor(Math.random() * traps.length)]}！`,
    description: '你触发了暗藏的机关',
    rewards, damage, completed: true,
  };
}

/** 生成奇遇事件 */
function genEncounter(mul: number): ExploreResult {
  const encounters = [
    { title: '🧙 遇到隐世高人', desc: '一位神秘老者传授你修炼心得', rewardType: 'exp' as const },
    { title: '🌸 灵草花海', desc: '一片稀有灵草丛生', rewardType: 'herb' as const },
    { title: '💎 灵石矿脉', desc: '发现了一处灵石矿', rewardType: 'gold' as const },
  ];
  const enc = encounters[Math.floor(Math.random() * encounters.length)];
  const rewards: ExploreReward[] = [];
  if (enc.rewardType === 'exp') {
    rewards.push({ type: 'exp', name: '修为', amount: Math.floor(100 * mul) });
  } else if (enc.rewardType === 'herb') {
    rewards.push({ type: 'herb', name: '灵草', amount: Math.floor(2 + Math.random() * 4 * Math.sqrt(mul)) });
  } else {
    rewards.push({ type: 'gold', name: '灵石', amount: Math.floor(200 * mul) });
  }
  return {
    floor: 0, eventType: 'encounter',
    title: enc.title, description: enc.desc,
    rewards, damage: 0, completed: true,
  };
}

/** 生成灵泉事件 */
function genSpring(): ExploreResult {
  const staminaRestore = Math.floor(10 + Math.random() * 15);
  return {
    floor: 0, eventType: 'spring',
    title: '🌊 发现灵泉！',
    description: `清澈的灵泉恢复了你 ${staminaRestore} 点体力`,
    rewards: [], damage: -staminaRestore, // 负数表示恢复
    completed: true,
  };
}

/** 生成空房间 */
function genEmpty(): ExploreResult {
  const empties = ['空无一物的石室', '残破的修炼洞府', '已被搜刮一空的密室', '静谧的回廊'];
  return {
    floor: 0, eventType: 'empty',
    title: '🏚️ 空房间',
    description: empties[Math.floor(Math.random() * empties.length)],
    rewards: [], damage: 0, completed: true,
  };
}

/** 玩家属性快照（用于Boss胜率计算） */
export interface PlayerPower {
  attack: number;
  defense: number;
  hp: number;
  realmIndex: number;
}

/**
 * 根据玩家战力和秘境难度动态计算Boss胜率。
 * 基础胜率50%，根据玩家境界与秘境境界的差值上下浮动。
 * 玩家境界越高于秘境要求，胜率越高（上限95%）；反之降低（下限30%）。
 */
function calcBossWinRate(player: PlayerPower, dungeonRealmIndex: number): number {
  const BASE_WIN_RATE = 0.50;
  const realmDiff = player.realmIndex - dungeonRealmIndex;
  // 每高出1级加3%，每低于1级减5%
  const bonus = realmDiff >= 0 ? realmDiff * 0.03 : realmDiff * 0.05;
  return Math.min(0.95, Math.max(0.30, BASE_WIN_RATE + bonus));
}

/** 根据秘境所需境界，选取可掉落的丹药池 */
function getDungeonPillPool(dungeonRealmIndex: number): string[] {
  return PILL_RECIPES
    .filter(p => p.requiredRealmIndex <= dungeonRealmIndex)
    .map(p => p.id);
}

/** 生成Boss事件 */
function genBoss(mul: number, floorNum: number, player?: PlayerPower, dungeonRealmIndex?: number): ExploreResult {
  const bosses = [
    { name: '守墓石魔', desc: '沉睡万年的石魔苏醒了' },
    { name: '幽冥鬼将', desc: '阴气凝聚化成的厉鬼' },
    { name: '远古傀儡', desc: '上古大能留下的守护傀儡' },
    { name: '血煞魔君', desc: '被封印的魔道强者' },
    { name: '混沌凶兽', desc: '混沌之中诞生的太古凶兽' },
  ];
  const boss = bosses[Math.min(Math.floor(floorNum / 5), bosses.length - 1)];

  // 动态胜率：有玩家属性时使用动态计算，否则回退70%固定值
  const winRate = (player && dungeonRealmIndex !== undefined)
    ? calcBossWinRate(player, dungeonRealmIndex)
    : 0.70;
  const victory = Math.random() < winRate;
  const rewards: ExploreReward[] = [];

  if (victory) {
    rewards.push({ type: 'gold', name: '灵石', amount: Math.floor(500 * mul) });
    rewards.push({ type: 'exp', name: '修为', amount: Math.floor(300 * mul) });
    if (Math.random() < 0.5) {
      rewards.push({ type: 'herb', name: '灵草', amount: Math.floor(3 + Math.random() * 5 * Math.sqrt(mul)) });
    }
    if (Math.random() < 0.3) {
      rewards.push({ type: 'fragment', name: '装备碎片', amount: Math.floor(2 + Math.random() * 3) });
    }
    // Boss击杀30%概率掉落丹药
    if (dungeonRealmIndex !== undefined && Math.random() < 0.30) {
      const pool = getDungeonPillPool(dungeonRealmIndex);
      if (pool.length > 0) {
        const pillId = pool[Math.floor(Math.random() * pool.length)];
        const pill = PILL_RECIPES.find(p => p.id === pillId);
        if (pill) {
          rewards.push({ type: 'pill', name: pill.name, amount: 1, pillRecipeId: pill.id });
        }
      }
    }
  }

  return {
    floor: 0, eventType: 'boss',
    title: victory ? `⚔️ 击败【${boss.name}】！` : `💀 败给【${boss.name}】`,
    description: victory
      ? `${boss.desc}——但你将其击败！（胜率${Math.round(winRate * 100)}%）`
      : `${boss.desc}——你不敌败退（胜率${Math.round(winRate * 100)}%）`,
    rewards,
    damage: victory ? Math.floor(5 + Math.random() * 8) : Math.floor(10 + Math.random() * 10),
    completed: victory,
  };
}

/** 执行一层探索 */
export function exploreFloor(dungeon: DungeonTemplate, floorNum: number, dungeonBonus = 0, player?: PlayerPower): ExploreResult {
  const isBoss = dungeon.bossFloors.includes(floorNum);
  const mul = dungeon.rewardMultiplier * (1 + dungeonBonus);

  let result: ExploreResult;

  if (isBoss) {
    result = genBoss(mul, floorNum, player, dungeon.requiredRealmIndex);
  } else {
    const eventType = rollEvent(dungeon.eventPool);
    switch (eventType) {
      case 'treasure': result = genTreasure(mul); break;
      case 'trap': result = genTrap(mul); break;
      case 'encounter': result = genEncounter(mul); break;
      case 'spring': result = genSpring(); break;
      default: result = genEmpty(); break;
    }
  }

  result.floor = floorNum;
  return result;
}

/** 生成通关额外奖励宝箱（全层通关后调用） */
export function genClearBonus(dungeon: DungeonTemplate, dungeonBonus = 0): ExploreReward[] {
  const mul = dungeon.rewardMultiplier * (1 + dungeonBonus);
  const rewards: ExploreReward[] = [];
  rewards.push({ type: 'gold', name: '灵石', amount: Math.floor(300 * mul) });
  rewards.push({ type: 'herb', name: '灵草', amount: Math.floor(2 + Math.random() * 4 * Math.sqrt(mul)) });
  rewards.push({ type: 'fragment', name: '装备碎片', amount: Math.floor(1 + Math.random() * 3) });
  // 通关20%概率额外掉丹药
  if (Math.random() < 0.20) {
    const pool = getDungeonPillPool(dungeon.requiredRealmIndex);
    if (pool.length > 0) {
      const pillId = pool[Math.floor(Math.random() * pool.length)];
      const pill = PILL_RECIPES.find(p => p.id === pillId);
      if (pill) {
        rewards.push({ type: 'pill', name: pill.name, amount: 1, pillRecipeId: pill.id });
      }
    }
  }
  return rewards;
}

/** 计算扫荡平均奖励（模拟一次完整通关的期望值） */
export function calcSweepRewards(dungeon: DungeonTemplate, dungeonBonus = 0): ExploreReward[] {
  const mul = dungeon.rewardMultiplier * (1 + dungeonBonus);
  const floors = dungeon.totalFloors;
  const bossCount = dungeon.bossFloors.length;
  const normalCount = floors - bossCount;

  // 普通层平均奖励（基于事件权重期望）
  const totalWeight = dungeon.eventPool.reduce((s, e) => s + e.weight, 0);
  const treasureW = (dungeon.eventPool.find(e => e.type === 'treasure')?.weight ?? 0) / totalWeight;
  const encounterW = (dungeon.eventPool.find(e => e.type === 'encounter')?.weight ?? 0) / totalWeight;

  let gold = Math.floor(normalCount * treasureW * 75 * mul); // 宝箱平均灵石
  let exp = Math.floor(normalCount * encounterW * 100 * mul / 3); // 奇遇1/3概率给修为
  let herbs = Math.floor(normalCount * (treasureW * 0.4 + encounterW / 3) * 2 * Math.sqrt(mul));
  let fragments = Math.floor(normalCount * treasureW * 0.2 * 1.5);

  // Boss层奖励（按75%平均胜率估算）
  const bossWinAvg = 0.75;
  gold += Math.floor(bossCount * bossWinAvg * 500 * mul);
  exp += Math.floor(bossCount * bossWinAvg * 300 * mul);
  herbs += Math.floor(bossCount * bossWinAvg * 0.5 * 5 * Math.sqrt(mul));
  fragments += Math.floor(bossCount * bossWinAvg * 0.3 * 3);

  // 通关奖励
  gold += Math.floor(300 * mul);
  herbs += Math.floor(4 * Math.sqrt(mul));
  fragments += 2;

  const rewards: ExploreReward[] = [];
  if (gold > 0) rewards.push({ type: 'gold', name: '灵石', amount: gold });
  if (exp > 0) rewards.push({ type: 'exp', name: '修为', amount: exp });
  if (herbs > 0) rewards.push({ type: 'herb', name: '灵草', amount: herbs });
  if (fragments > 0) rewards.push({ type: 'fragment', name: '装备碎片', amount: fragments });

  return rewards;
}
