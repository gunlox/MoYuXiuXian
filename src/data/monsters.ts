/** 掉落物定义 */
export interface Drop {
  type: 'gold' | 'herb' | 'fragment';
  name: string;
  amount: number;
  chance: number; // 0~1
}

/** 妖兽定义 */
export interface Monster {
  id: string;
  name: string;
  /** 攻击力下限（战斗时随机实例化） */
  attackMin: number;
  /** 攻击力上限（战斗时随机实例化） */
  attackMax: number;
  /** 防御力（固定值） */
  defense: number;
  /** 生命值下限（战斗时随机实例化） */
  hpMin: number;
  /** 生命值上限（战斗时随机实例化） */
  hpMax: number;
  expReward: number;
  drops: Drop[];
}

/** 区域定义 */
export interface Area {
  id: string;
  name: string;
  description: string;
  requiredRealmIndex: number; // 需要达到的境界索引才能解锁
  /** 额外要求的最低转生次数（可选，用于五转专属区域） */
  requiredRebirthCount?: number;
  monsters: Monster[];
}

interface MonsterBlueprint {
  id: string;
  name: string;
  expReward: number;
  drops: Drop[];
}

interface AreaBlueprint {
  id: string;
  name: string;
  description: string;
  requiredRealmIndex: number;
  requiredRebirthCount?: number;
  monsters: MonsterBlueprint[];
}

type StageKey = 'lq' | 'zj' | 'jd' | 'yy' | 'hs' | 'dj';
type MonsterRole = 'weak' | 'mid' | 'strong' | 'boss';

const STAGE_PLAYER_BASE: Record<StageKey, { attack: number; defense: number; hp: number }> = {
  lq: { attack: 50000, defense: 37500, hp: 500000 },
  zj: { attack: 250000, defense: 187500, hp: 2500000 },
  jd: { attack: 550000, defense: 412500, hp: 5500000 },
  yy: { attack: 1150000, defense: 862500, hp: 11500000 },
  hs: { attack: 2250000, defense: 1687500, hp: 22500000 },
  dj: { attack: 6000000, defense: 4500000, hp: 60000000 },
};

const ROLE_DEFENSE_FACTOR: Record<MonsterRole, number> = {
  weak: 0.1,
  mid: 0.2,
  strong: 0.3,
  boss: 0.4,
};

const STAGE_PACING: Record<StageKey, Record<MonsterRole, { rounds: [number, number]; loss: [number, number] }>> = {
  lq: {
    weak: { rounds: [2, 3], loss: [0.05, 0.10] },
    mid: { rounds: [2, 4], loss: [0.10, 0.15] },
    strong: { rounds: [3, 5], loss: [0.20, 0.40] },
    boss: { rounds: [5, 10], loss: [0.30, 0.50] },
  },
  zj: {
    weak: { rounds: [2, 4], loss: [0.10, 0.15] },
    mid: { rounds: [3, 5], loss: [0.20, 0.40] },
    strong: { rounds: [5, 10], loss: [0.40, 0.60] },
    boss: { rounds: [10, 15], loss: [0.60, 0.80] },
  },
  jd: {
    weak: { rounds: [4, 6], loss: [0.20, 0.40] },
    mid: { rounds: [5, 8], loss: [0.40, 0.60] },
    strong: { rounds: [10, 15], loss: [0.60, 0.80] },
    boss: { rounds: [20, 30], loss: [0.60, 1.00] },
  },
  yy: {
    weak: { rounds: [5, 8], loss: [0.30, 0.40] },
    mid: { rounds: [6, 12], loss: [0.35, 0.60] },
    strong: { rounds: [10, 15], loss: [0.50, 0.80] },
    boss: { rounds: [30, 50], loss: [0.80, 1.10] },
  },
  hs: {
    weak: { rounds: [6, 12], loss: [0.30, 0.40] },
    mid: { rounds: [8, 15], loss: [0.40, 0.60] },
    strong: { rounds: [15, 25], loss: [0.60, 1.00] },
    boss: { rounds: [30, 50], loss: [0.90, 1.20] },
  },
  dj: {
    weak: { rounds: [8, 15], loss: [0.40, 0.60] },
    mid: { rounds: [10, 20], loss: [0.60, 1.00] },
    strong: { rounds: [15, 30], loss: [0.90, 1.20] },
    boss: { rounds: [40, 60], loss: [1.20, 1.60] },
  },
};

function getStageKey(area: AreaBlueprint): StageKey {
  if (area.requiredRebirthCount && area.requiredRebirthCount >= 5) return 'dj';
  if (area.requiredRealmIndex >= 21) return 'dj';
  if (area.requiredRealmIndex >= 18) return 'hs';
  if (area.requiredRealmIndex >= 15) return 'yy';
  if (area.requiredRealmIndex >= 12) return 'jd';
  if (area.requiredRealmIndex >= 9) return 'zj';
  return 'lq';
}

function getMonsterRole(monsterId: string): MonsterRole {
  if (monsterId.endsWith('_boss')) return 'boss';
  if (monsterId.endsWith('_0')) return 'weak';
  if (monsterId.endsWith('_1')) return 'mid';
  return 'strong';
}

function buildMonsterStats(stage: StageKey, role: MonsterRole, isLegend: boolean): Pick<Monster, 'attackMin' | 'attackMax' | 'defense' | 'hpMin' | 'hpMax'> {
  const player = STAGE_PLAYER_BASE[stage];
  const pacing = STAGE_PACING[stage][role];
  const defense = Math.floor(player.attack * ROLE_DEFENSE_FACTOR[role]);
  const playerDamage = Math.max(
    Math.floor(player.attack - defense * 0.5),
    Math.floor(player.attack * 0.1),
  );
  const minMonsterActions = Math.max(1, pacing.rounds[0] - 1);
  const maxMonsterActions = Math.max(1, pacing.rounds[1] - 1);
  const attackMin = Math.floor(player.defense * 0.5 + (pacing.loss[0] * player.hp) / maxMonsterActions);
  const attackMax = Math.floor(player.defense * 0.5 + (pacing.loss[1] * player.hp) / minMonsterActions);
  const hpMin = Math.floor(playerDamage * pacing.rounds[0]);
  const hpMax = Math.floor(playerDamage * pacing.rounds[1]);

  if (!isLegend) {
    return { attackMin, attackMax, defense, hpMin, hpMax };
  }

  const legendMult = 1.83;
  return {
    attackMin: Math.floor(attackMin * legendMult),
    attackMax: Math.floor(attackMax * legendMult),
    defense: Math.floor(defense * legendMult),
    hpMin: Math.floor(hpMin * legendMult),
    hpMax: Math.floor(hpMax * legendMult),
  };
}

/** 全部区域数据（23个，每个境界档一个） */
const RAW_AREAS: AreaBlueprint[] = [
  {
    id: 'area_lq', name: '青云山麓',
    description: '灵气稀薄的山脚，练气弟子的试炼之地',
    requiredRealmIndex: 0,
    monsters: [
      { id: 'm_lq_0', name: '灵兔',     expReward: 5,
        drops: [{ type: 'gold', name: '灵石', amount: 1, chance: 0.8 }, { type: 'herb', name: '小还丹草', amount: 1, chance: 0.3 }] },
      { id: 'm_lq_1', name: '毒蛇',     expReward: 10,
        drops: [{ type: 'gold', name: '灵石', amount: 2, chance: 0.8 }, { type: 'herb', name: '蛇胆草', amount: 1, chance: 0.25 }] },
      { id: 'm_lq_2', name: '野狼王',   expReward: 22,
        drops: [{ type: 'gold', name: '灵石', amount: 5, chance: 0.9 }, { type: 'herb', name: '狼血花', amount: 1, chance: 0.2 }, { type: 'fragment', name: '兽骨碎片', amount: 1, chance: 0.12 }] },
      { id: 'm_lq_boss', name: '山麓妖王', expReward: 50,
        drops: [{ type: 'gold', name: '灵石', amount: 10, chance: 0.9 }, { type: 'herb', name: '妖王精血', amount: 1, chance: 0.15 }, { type: 'fragment', name: '妖骨碎片', amount: 2, chance: 0.08 }] },
    ],
  },

  {
    id: 'area_zj1', name: '迷雾森林',
    description: '常年笼罩雾气，筑基初期修士的猎场',
    requiredRealmIndex: 9,
    monsters: [
      { id: 'm_zj1_0', name: '雾影豹',     expReward: 12,
        drops: [{ type: 'gold', name: '灵石', amount: 7,  chance: 0.8 }, { type: 'herb', name: '迷雾兰', amount: 1, chance: 0.3 }] },
      { id: 'm_zj1_1', name: '千年树妖',   expReward: 22,
        drops: [{ type: 'gold', name: '灵石', amount: 13, chance: 0.85 }, { type: 'herb', name: '灵木心', amount: 1, chance: 0.2 }, { type: 'fragment', name: '木灵碎片', amount: 1, chance: 0.15 }] },
      { id: 'm_zj1_2', name: '噬魂蟒',     expReward: 45,
        drops: [{ type: 'gold', name: '灵石', amount: 25, chance: 0.9 }, { type: 'herb', name: '蟒胆', amount: 1, chance: 0.15 }, { type: 'fragment', name: '蛇鳞碎片', amount: 1, chance: 0.1 }] },
      { id: 'm_zj1_boss', name: '森林魔主', expReward: 100,
        drops: [{ type: 'gold', name: '灵石', amount: 50, chance: 0.9 }, { type: 'herb', name: '魔主精血', amount: 1, chance: 0.12 }, { type: 'fragment', name: '魔树碎片', amount: 2, chance: 0.08 }] },
    ],
  },

  {
    id: 'area_zj2', name: '幽暗矿洞',
    description: '深埋地下的古老矿洞，筑基中期修士的磨砺之处',
    requiredRealmIndex: 10,
    monsters: [
      { id: 'm_zj2_0', name: '岩石傀儡', expReward: 22,
        drops: [{ type: 'gold', name: '灵石', amount: 11, chance: 0.8 }, { type: 'herb', name: '矿石草', amount: 1, chance: 0.25 }] },
      { id: 'm_zj2_1', name: '地底蜈蚣', expReward: 45,
        drops: [{ type: 'gold', name: '灵石', amount: 22, chance: 0.85 }, { type: 'herb', name: '百足草', amount: 1, chance: 0.18 }, { type: 'fragment', name: '毒刺碎片', amount: 1, chance: 0.12 }] },
      { id: 'm_zj2_2', name: '矿洞魔熊', expReward: 90,
        drops: [{ type: 'gold', name: '灵石', amount: 45, chance: 0.9 }, { type: 'herb', name: '熊胆', amount: 1, chance: 0.13 }, { type: 'fragment', name: '熊骨碎片', amount: 1, chance: 0.08 }] },
      { id: 'm_zj2_boss', name: '矿洞魔君', expReward: 200,
        drops: [{ type: 'gold', name: '灵石', amount: 90, chance: 0.9 }, { type: 'herb', name: '魔君血晶', amount: 1, chance: 0.1 }, { type: 'fragment', name: '矿晶碎片', amount: 2, chance: 0.07 }] },
    ],
  },

  {
    id: 'area_zj3', name: '荒古遗迹',
    description: '上古文明遗留的废墟，筑基后期方可探索',
    requiredRealmIndex: 11,
    monsters: [
      { id: 'm_zj3_0', name: '遗迹守卫', expReward: 34,
        drops: [{ type: 'gold', name: '灵石', amount: 16, chance: 0.8 }, { type: 'herb', name: '古遗草', amount: 1, chance: 0.22 }] },
      { id: 'm_zj3_1', name: '骷髅战士', expReward: 68,
        drops: [{ type: 'gold', name: '灵石', amount: 32, chance: 0.85 }, { type: 'herb', name: '阴骨花', amount: 1, chance: 0.16 }, { type: 'fragment', name: '骨甲碎片', amount: 1, chance: 0.12 }] },
      { id: 'm_zj3_2', name: '遗迹魔将', expReward: 135,
        drops: [{ type: 'gold', name: '灵石', amount: 63, chance: 0.9 }, { type: 'herb', name: '魔将血晶', amount: 1, chance: 0.12 }, { type: 'fragment', name: '战魂碎片', amount: 1, chance: 0.08 }] },
      { id: 'm_zj3_boss', name: '遗迹魔皇', expReward: 300,
        drops: [{ type: 'gold', name: '灵石', amount: 126, chance: 0.9 }, { type: 'herb', name: '魔皇之血', amount: 1, chance: 0.08 }, { type: 'fragment', name: '遗迹神符', amount: 2, chance: 0.06 }] },
    ],
  },

  {
    id: 'area_jd1', name: '烈焰深渊',
    description: '地底火山口，金丹初期才能抵御灼热',
    requiredRealmIndex: 12,
    monsters: [
      { id: 'm_jd1_0', name: '火岩兽', expReward: 135,
        drops: [{ type: 'gold', name: '灵石', amount: 55, chance: 0.8 }, { type: 'herb', name: '火灵芝', amount: 1, chance: 0.25 }] },
      { id: 'm_jd1_1', name: '炎龙蜥', expReward: 270,
        drops: [{ type: 'gold', name: '灵石', amount: 112, chance: 0.85 }, { type: 'herb', name: '龙涎草', amount: 1, chance: 0.2 }, { type: 'fragment', name: '龙鳞碎片', amount: 1, chance: 0.12 }] },
      { id: 'm_jd1_2', name: '九尾火凤', expReward: 540,
        drops: [{ type: 'gold', name: '灵石', amount: 225, chance: 0.9 }, { type: 'herb', name: '凤血果', amount: 1, chance: 0.15 }, { type: 'fragment', name: '凤羽碎片', amount: 1, chance: 0.08 }] },
      { id: 'm_jd1_boss', name: '深渊火魔', expReward: 1200,
        drops: [{ type: 'gold', name: '灵石', amount: 450, chance: 0.9 }, { type: 'herb', name: '火魔精血', amount: 1, chance: 0.1 }, { type: 'fragment', name: '火魔核', amount: 2, chance: 0.06 }] },
    ],
  },

  {
    id: 'area_jd2', name: '玄冰雪原',
    description: '万年冰封的极北雪原，金丹中期方可踏足',
    requiredRealmIndex: 13,
    monsters: [
      { id: 'm_jd2_0', name: '冰狼', expReward: 225,
        drops: [{ type: 'gold', name: '灵石', amount: 90, chance: 0.8 }, { type: 'herb', name: '冰晶草', amount: 1, chance: 0.22 }] },
      { id: 'm_jd2_1', name: '霜雪熊妖', expReward: 450,
        drops: [{ type: 'gold', name: '灵石', amount: 180, chance: 0.85 }, { type: 'herb', name: '冻血莲', amount: 1, chance: 0.17 }, { type: 'fragment', name: '冰甲碎片', amount: 1, chance: 0.1 }] },
      { id: 'm_jd2_2', name: '极北冰龙', expReward: 900,
        drops: [{ type: 'gold', name: '灵石', amount: 360, chance: 0.9 }, { type: 'herb', name: '龙涎冰珠', amount: 1, chance: 0.12 }, { type: 'fragment', name: '冰龙鳞', amount: 1, chance: 0.06 }] },
      { id: 'm_jd2_boss', name: '冰原霸主', expReward: 2000,
        drops: [{ type: 'gold', name: '灵石', amount: 720, chance: 0.9 }, { type: 'herb', name: '冰魄果', amount: 1, chance: 0.08 }, { type: 'fragment', name: '寒冰晶核', amount: 2, chance: 0.05 }] },
    ],
  },

  {
    id: 'area_jd3', name: '九幽地府',
    description: '阴气弥漫的幽冥之地，金丹后期修士的磨炼场',
    requiredRealmIndex: 14,
    monsters: [
      { id: 'm_jd3_0', name: '幽冥厉鬼', expReward: 315,
        drops: [{ type: 'gold', name: '灵石', amount: 124, chance: 0.8 }, { type: 'herb', name: '幽冥花', amount: 1, chance: 0.2 }] },
      { id: 'm_jd3_1', name: '地府判官', expReward: 630,
        drops: [{ type: 'gold', name: '灵石', amount: 248, chance: 0.85 }, { type: 'herb', name: '判官笔草', amount: 1, chance: 0.15 }, { type: 'fragment', name: '冥判令牌', amount: 1, chance: 0.08 }] },
      { id: 'm_jd3_2', name: '幽冥鬼王', expReward: 1260,
        drops: [{ type: 'gold', name: '灵石', amount: 495, chance: 0.9 }, { type: 'herb', name: '鬼王之血', amount: 1, chance: 0.1 }, { type: 'fragment', name: '冥王令', amount: 1, chance: 0.05 }] },
      { id: 'm_jd3_boss', name: '阎罗大帝', expReward: 2800,
        drops: [{ type: 'gold', name: '灵石', amount: 990, chance: 0.9 }, { type: 'herb', name: '阎罗神血', amount: 1, chance: 0.07 }, { type: 'fragment', name: '冥王令牌', amount: 2, chance: 0.04 }] },
    ],
  },

  {
    id: 'area_yy1', name: '幽冥海域',
    description: '漆黑的深海之底，元婴初期方可在水压下存活',
    requiredRealmIndex: 15,
    monsters: [
      { id: 'm_yy1_0', name: '深海巨章', expReward: 1800,
        drops: [{ type: 'gold', name: '灵石', amount: 675, chance: 0.8 }, { type: 'herb', name: '海灵珠', amount: 1, chance: 0.25 }] },
      { id: 'm_yy1_1', name: '冥海蛟龙', expReward: 3600,
        drops: [{ type: 'gold', name: '灵石', amount: 1350, chance: 0.85 }, { type: 'herb', name: '蛟龙胆', amount: 1, chance: 0.18 }, { type: 'fragment', name: '蛟龙角碎片', amount: 1, chance: 0.1 }] },
      { id: 'm_yy1_2', name: '远古海兽', expReward: 7200,
        drops: [{ type: 'gold', name: '灵石', amount: 2700, chance: 0.9 }, { type: 'herb', name: '万年海藻', amount: 1, chance: 0.12 }, { type: 'fragment', name: '海兽骨碎片', amount: 1, chance: 0.06 }] },
      { id: 'm_yy1_boss', name: '深海魔龙', expReward: 16000,
        drops: [{ type: 'gold', name: '灵石', amount: 5400, chance: 0.9 }, { type: 'herb', name: '龙血珠', amount: 1, chance: 0.08 }, { type: 'fragment', name: '海龙晶核', amount: 2, chance: 0.04 }] },
    ],
  },

  {
    id: 'area_yy2', name: '万魔洞窟',
    description: '万魔聚集的禁地，元婴中期修士的狩猎场',
    requiredRealmIndex: 16,
    monsters: [
      { id: 'm_yy2_0', name: '魔甲虫', expReward: 2700,
        drops: [{ type: 'gold', name: '灵石', amount: 1013, chance: 0.8 }, { type: 'herb', name: '魔甲草', amount: 1, chance: 0.22 }] },
      { id: 'm_yy2_1', name: '万魔将军', expReward: 5400,
        drops: [{ type: 'gold', name: '灵石', amount: 2025, chance: 0.85 }, { type: 'herb', name: '万魔血', amount: 1, chance: 0.15 }, { type: 'fragment', name: '魔甲碎片', amount: 1, chance: 0.08 }] },
      { id: 'm_yy2_2', name: '魔域魔王', expReward: 10800,
        drops: [{ type: 'gold', name: '灵石', amount: 4050, chance: 0.9 }, { type: 'herb', name: '魔王血晶', amount: 1, chance: 0.1 }, { type: 'fragment', name: '魔王令牌', amount: 1, chance: 0.04 }] },
      { id: 'm_yy2_boss', name: '万魔魔尊', expReward: 24000,
        drops: [{ type: 'gold', name: '灵石', amount: 8100, chance: 0.9 }, { type: 'herb', name: '魔尊精血', amount: 1, chance: 0.07 }, { type: 'fragment', name: '万魔晶核', amount: 2, chance: 0.035 }] },
    ],
  },

  {
    id: 'area_yy3', name: '星陨峡谷',
    description: '陨星坠落形成的峡谷，元婴后期方可立足',
    requiredRealmIndex: 17,
    monsters: [
      { id: 'm_yy3_0', name: '星陨兽', expReward: 3600,
        drops: [{ type: 'gold', name: '灵石', amount: 1350, chance: 0.8 }, { type: 'herb', name: '陨星草', amount: 1, chance: 0.2 }] },
      { id: 'm_yy3_1', name: '天外神将', expReward: 7200,
        drops: [{ type: 'gold', name: '灵石', amount: 2700, chance: 0.85 }, { type: 'herb', name: '星辰果', amount: 1, chance: 0.14 }, { type: 'fragment', name: '星陨碎片', amount: 1, chance: 0.07 }] },
      { id: 'm_yy3_2', name: '星域古兽', expReward: 14400,
        drops: [{ type: 'gold', name: '灵石', amount: 5400, chance: 0.9 }, { type: 'herb', name: '太古星晶', amount: 1, chance: 0.08 }, { type: 'fragment', name: '星域碎片', amount: 1, chance: 0.04 }] },
      { id: 'm_yy3_boss', name: '星域神主', expReward: 32000,
        drops: [{ type: 'gold', name: '灵石', amount: 10800, chance: 0.9 }, { type: 'herb', name: '星域神核', amount: 1, chance: 0.06 }, { type: 'fragment', name: '星域神令', amount: 2, chance: 0.03 }] },
    ],
  },

  {
    id: 'area_hs1', name: '天劫雷域',
    description: '雷电交加的禁地，唯化神初期强者可入',
    requiredRealmIndex: 18,
    monsters: [
      { id: 'm_hs1_0', name: '雷鹰', expReward: 27000,
        drops: [{ type: 'gold', name: '灵石', amount: 10125, chance: 0.8 }, { type: 'herb', name: '雷灵果', amount: 1, chance: 0.2 }] },
      { id: 'm_hs1_1', name: '天雷巨兽', expReward: 54000,
        drops: [{ type: 'gold', name: '灵石', amount: 20250, chance: 0.85 }, { type: 'herb', name: '紫雷莲', amount: 1, chance: 0.15 }, { type: 'fragment', name: '雷兽碎片', amount: 1, chance: 0.08 }] },
      { id: 'm_hs1_2', name: '雷劫真龙', expReward: 108000,
        drops: [{ type: 'gold', name: '灵石', amount: 40500, chance: 0.9 }, { type: 'herb', name: '真龙血', amount: 1, chance: 0.1 }, { type: 'fragment', name: '龙珠碎片', amount: 1, chance: 0.05 }] },
      { id: 'm_hs1_boss', name: '雷域天帝', expReward: 240000,
        drops: [{ type: 'gold', name: '灵石', amount: 81000, chance: 0.9 }, { type: 'herb', name: '天帝雷晶', amount: 1, chance: 0.07 }, { type: 'fragment', name: '雷帝神符', amount: 2, chance: 0.03 }] },
    ],
  },

  {
    id: 'area_hs2', name: '太古战场',
    description: '上古神魔大战的遗址，化神中期修士的磨砺之地',
    requiredRealmIndex: 19,
    monsters: [
      { id: 'm_hs2_0', name: '战场亡魂', expReward: 40500,
        drops: [{ type: 'gold', name: '灵石', amount: 14625, chance: 0.8 }, { type: 'herb', name: '战魂草', amount: 1, chance: 0.18 }] },
      { id: 'm_hs2_1', name: '太古战将', expReward: 81000,
        drops: [{ type: 'gold', name: '灵石', amount: 29250, chance: 0.85 }, { type: 'herb', name: '太古战血', amount: 1, chance: 0.13 }, { type: 'fragment', name: '神兵碎片', amount: 1, chance: 0.06 }] },
      { id: 'm_hs2_2', name: '上古神魔', expReward: 162000,
        drops: [{ type: 'gold', name: '灵石', amount: 58500, chance: 0.9 }, { type: 'herb', name: '神魔精血', amount: 1, chance: 0.08 }, { type: 'fragment', name: '神魔令牌', amount: 1, chance: 0.03 }] },
      { id: 'm_hs2_boss', name: '太古战神王', expReward: 360000,
        drops: [{ type: 'gold', name: '灵石', amount: 117000, chance: 0.9 }, { type: 'herb', name: '战神精髓', amount: 1, chance: 0.05 }, { type: 'fragment', name: '神战令', amount: 2, chance: 0.025 }] },
    ],
  },

  {
    id: 'area_hs3', name: '三清圣地',
    description: '传说中三清道祖的道场，化神后期方可踏足',
    requiredRealmIndex: 20,
    monsters: [
      { id: 'm_hs3_0', name: '道宫守卫', expReward: 54000,
        drops: [{ type: 'gold', name: '灵石', amount: 20250, chance: 0.8 }, { type: 'herb', name: '三清灵草', amount: 1, chance: 0.16 }] },
      { id: 'm_hs3_1', name: '道宫金刚', expReward: 108000,
        drops: [{ type: 'gold', name: '灵石', amount: 40500, chance: 0.85 }, { type: 'herb', name: '金刚不坏草', amount: 1, chance: 0.11 }, { type: 'fragment', name: '道宫碎片', amount: 1, chance: 0.05 }] },
      { id: 'm_hs3_2', name: '圣地护法', expReward: 216000,
        drops: [{ type: 'gold', name: '灵石', amount: 81000, chance: 0.9 }, { type: 'herb', name: '三清仙露', amount: 1, chance: 0.07 }, { type: 'fragment', name: '护法令牌', amount: 1, chance: 0.03 }] },
      { id: 'm_hs3_boss', name: '三清道尊', expReward: 480000,
        drops: [{ type: 'gold', name: '灵石', amount: 162000, chance: 0.9 }, { type: 'herb', name: '道尊仙液', amount: 1, chance: 0.04 }, { type: 'fragment', name: '道尊令牌', amount: 2, chance: 0.02 }] },
    ],
  },

  {
    id: 'area_dj1', name: '混沌虚空·一重',
    description: '天地法则崩坏之地，渡劫一重天劫的试炼场',
    requiredRealmIndex: 21,
    monsters: [
      { id: 'm_dj1_0', name: '虚空裂隙兽', expReward: 405000,
        drops: [{ type: 'gold', name: '灵石', amount: 157500, chance: 0.8 }, { type: 'herb', name: '混沌灵液', amount: 1, chance: 0.15 }] },
      { id: 'm_dj1_1', name: '天劫雷兽', expReward: 810000,
        drops: [{ type: 'gold', name: '灵石', amount: 315000, chance: 0.85 }, { type: 'herb', name: '天劫灵草', amount: 1, chance: 0.1 }, { type: 'fragment', name: '劫雷碎片', amount: 1, chance: 0.06 }] },
      { id: 'm_dj1_2', name: '一重劫灵', expReward: 1620000,
        drops: [{ type: 'gold', name: '灵石', amount: 630000, chance: 0.9 }, { type: 'herb', name: '劫灵之血', amount: 1, chance: 0.06 }, { type: 'fragment', name: '劫灵令牌', amount: 1, chance: 0.03 }] },
      { id: 'm_dj1_boss', name: '一重劫主', expReward: 3600000,
        drops: [{ type: 'gold', name: '灵石', amount: 1260000, chance: 0.9 }, { type: 'herb', name: '劫主精血', amount: 1, chance: 0.04 }, { type: 'fragment', name: '一劫神令', amount: 2, chance: 0.02 }] },
    ],
  },

  {
    id: 'area_dj2', name: '混沌虚空·二重',
    description: '二重天劫降临，比一重更加凶险',
    requiredRealmIndex: 22,
    monsters: [
      { id: 'm_dj2_0', name: '二重劫兽', expReward: 495000,
        drops: [{ type: 'gold', name: '灵石', amount: 191250, chance: 0.8 }, { type: 'herb', name: '劫兽精血', amount: 1, chance: 0.13 }] },
      { id: 'm_dj2_1', name: '虚空战将', expReward: 990000,
        drops: [{ type: 'gold', name: '灵石', amount: 382500, chance: 0.85 }, { type: 'herb', name: '虚空战血', amount: 1, chance: 0.09 }, { type: 'fragment', name: '虚空碎片', amount: 1, chance: 0.05 }] },
      { id: 'm_dj2_2', name: '二重劫神', expReward: 1980000,
        drops: [{ type: 'gold', name: '灵石', amount: 765000, chance: 0.9 }, { type: 'herb', name: '劫神之眼', amount: 1, chance: 0.05 }, { type: 'fragment', name: '劫神令牌', amount: 1, chance: 0.025 }] },
      { id: 'm_dj2_boss', name: '二重劫主', expReward: 4400000,
        drops: [{ type: 'gold', name: '灵石', amount: 1530000, chance: 0.9 }, { type: 'herb', name: '二劫神血', amount: 1, chance: 0.035 }, { type: 'fragment', name: '二劫神令', amount: 2, chance: 0.018 }] },
    ],
  },

  {
    id: 'area_dj3', name: '混沌虚空·三重',
    description: '三重天诛落下，非渡劫三重不可承受',
    requiredRealmIndex: 23,
    monsters: [
      { id: 'm_dj3_0', name: '天诛守卫', expReward: 607500,
        drops: [{ type: 'gold', name: '灵石', amount: 236250, chance: 0.8 }, { type: 'herb', name: '天诛灵液', amount: 1, chance: 0.12 }] },
      { id: 'm_dj3_1', name: '三重劫将', expReward: 1215000,
        drops: [{ type: 'gold', name: '灵石', amount: 472500, chance: 0.85 }, { type: 'herb', name: '三重劫草', amount: 1, chance: 0.08 }, { type: 'fragment', name: '三劫碎片', amount: 1, chance: 0.04 }] },
      { id: 'm_dj3_2', name: '天诛劫神', expReward: 2430000,
        drops: [{ type: 'gold', name: '灵石', amount: 945000, chance: 0.9 }, { type: 'herb', name: '天诛神血', amount: 1, chance: 0.04 }, { type: 'fragment', name: '天诛令', amount: 1, chance: 0.02 }] },
      { id: 'm_dj3_boss', name: '三重劫主', expReward: 5400000,
        drops: [{ type: 'gold', name: '灵石', amount: 1890000, chance: 0.9 }, { type: 'herb', name: '三劫神血', amount: 1, chance: 0.03 }, { type: 'fragment', name: '三劫神令', amount: 2, chance: 0.015 }] },
    ],
  },

  {
    id: 'area_dj4', name: '混沌虚空·四重',
    description: '四重混沌之力汇聚，渡劫四重方可涉足',
    requiredRealmIndex: 24,
    monsters: [
      { id: 'm_dj4_0', name: '混沌守护兽', expReward: 742500,
        drops: [{ type: 'gold', name: '灵石', amount: 288000, chance: 0.8 }, { type: 'herb', name: '混沌精液', amount: 1, chance: 0.11 }] },
      { id: 'm_dj4_1', name: '四重劫魔', expReward: 1485000,
        drops: [{ type: 'gold', name: '灵石', amount: 576000, chance: 0.85 }, { type: 'herb', name: '四重劫血', amount: 1, chance: 0.07 }, { type: 'fragment', name: '四劫碎片', amount: 1, chance: 0.035 }] },
      { id: 'm_dj4_2', name: '混沌真魔', expReward: 2970000,
        drops: [{ type: 'gold', name: '灵石', amount: 1152000, chance: 0.9 }, { type: 'herb', name: '混沌魔核', amount: 1, chance: 0.035 }, { type: 'fragment', name: '混沌令', amount: 1, chance: 0.018 }] },
      { id: 'm_dj4_boss', name: '四重劫主', expReward: 6600000,
        drops: [{ type: 'gold', name: '灵石', amount: 2304000, chance: 0.9 }, { type: 'herb', name: '四劫神血', amount: 1, chance: 0.025 }, { type: 'fragment', name: '四劫神令', amount: 2, chance: 0.012 }] },
    ],
  },

  {
    id: 'area_dj5', name: '混沌虚空·五重',
    description: '五重玄冥之气交汇，渡劫五重的极限试炼',
    requiredRealmIndex: 25,
    monsters: [
      { id: 'm_dj5_0', name: '玄冥守卫', expReward: 900000,
        drops: [{ type: 'gold', name: '灵石', amount: 348750, chance: 0.8 }, { type: 'herb', name: '玄冥灵草', amount: 1, chance: 0.1 }] },
      { id: 'm_dj5_1', name: '五重劫圣', expReward: 1800000,
        drops: [{ type: 'gold', name: '灵石', amount: 697500, chance: 0.85 }, { type: 'herb', name: '五重劫晶', amount: 1, chance: 0.065 }, { type: 'fragment', name: '五劫碎片', amount: 1, chance: 0.032 }] },
      { id: 'm_dj5_2', name: '玄冥至尊', expReward: 3600000,
        drops: [{ type: 'gold', name: '灵石', amount: 1395000, chance: 0.9 }, { type: 'herb', name: '玄冥神核', amount: 1, chance: 0.032 }, { type: 'fragment', name: '玄冥令', amount: 1, chance: 0.016 }] },
      { id: 'm_dj5_boss', name: '五重劫主', expReward: 8000000,
        drops: [{ type: 'gold', name: '灵石', amount: 2790000, chance: 0.9 }, { type: 'herb', name: '五劫神血', amount: 1, chance: 0.02 }, { type: 'fragment', name: '五劫神令', amount: 2, chance: 0.01 }] },
    ],
  },

  {
    id: 'area_dj6', name: '混沌虚空·六重',
    description: '六重太乙之力降临，渡劫六重的生死考验',
    requiredRealmIndex: 26,
    monsters: [
      { id: 'm_dj6_0', name: '太乙守护神', expReward: 1102500,
        drops: [{ type: 'gold', name: '灵石', amount: 427500, chance: 0.8 }, { type: 'herb', name: '太乙灵液', amount: 1, chance: 0.09 }] },
      { id: 'm_dj6_1', name: '六重劫皇', expReward: 2205000,
        drops: [{ type: 'gold', name: '灵石', amount: 855000, chance: 0.85 }, { type: 'herb', name: '六重劫珠', amount: 1, chance: 0.06 }, { type: 'fragment', name: '六劫碎片', amount: 1, chance: 0.03 }] },
      { id: 'm_dj6_2', name: '太乙古神', expReward: 4410000,
        drops: [{ type: 'gold', name: '灵石', amount: 1710000, chance: 0.9 }, { type: 'herb', name: '太乙神髓', amount: 1, chance: 0.028 }, { type: 'fragment', name: '太乙令', amount: 1, chance: 0.014 }] },
      { id: 'm_dj6_boss', name: '六重劫主', expReward: 9800000,
        drops: [{ type: 'gold', name: '灵石', amount: 3420000, chance: 0.9 }, { type: 'herb', name: '六劫神血', amount: 1, chance: 0.018 }, { type: 'fragment', name: '六劫神令', amount: 2, chance: 0.009 }] },
    ],
  },

  {
    id: 'area_dj7', name: '混沌虚空·七重',
    description: '七重太古神兵降世，渡劫七重天的最终试炼',
    requiredRealmIndex: 27,
    monsters: [
      { id: 'm_dj7_0', name: '太古战神', expReward: 1350000,
        drops: [{ type: 'gold', name: '灵石', amount: 517500, chance: 0.8 }, { type: 'herb', name: '太古战血', amount: 1, chance: 0.08 }] },
      { id: 'm_dj7_1', name: '七重劫帝', expReward: 2700000,
        drops: [{ type: 'gold', name: '灵石', amount: 1035000, chance: 0.85 }, { type: 'herb', name: '七重劫液', amount: 1, chance: 0.055 }, { type: 'fragment', name: '七劫碎片', amount: 1, chance: 0.027 }] },
      { id: 'm_dj7_2', name: '太古真神', expReward: 5400000,
        drops: [{ type: 'gold', name: '灵石', amount: 2070000, chance: 0.9 }, { type: 'herb', name: '太古神血', amount: 1, chance: 0.025 }, { type: 'fragment', name: '太古神令', amount: 1, chance: 0.012 }] },
      { id: 'm_dj7_boss', name: '七重劫主', expReward: 12000000,
        drops: [{ type: 'gold', name: '灵石', amount: 4140000, chance: 0.9 }, { type: 'herb', name: '七劫神血', amount: 1, chance: 0.015 }, { type: 'fragment', name: '七劫神令', amount: 2, chance: 0.008 }] },
    ],
  },

  {
    id: 'area_dj8', name: '混沌虚空·八重',
    description: '八重鸿蒙之力席卷，渡劫八重的绝境',
    requiredRealmIndex: 28,
    monsters: [
      { id: 'm_dj8_0', name: '鸿蒙守护兽', expReward: 1642500,
        drops: [{ type: 'gold', name: '灵石', amount: 630000, chance: 0.8 }, { type: 'herb', name: '鸿蒙灵液', amount: 1, chance: 0.07 }] },
      { id: 'm_dj8_1', name: '八重劫尊', expReward: 3285000,
        drops: [{ type: 'gold', name: '灵石', amount: 1260000, chance: 0.85 }, { type: 'herb', name: '八重劫晶', amount: 1, chance: 0.048 }, { type: 'fragment', name: '八劫碎片', amount: 1, chance: 0.024 }] },
      { id: 'm_dj8_2', name: '鸿蒙古神', expReward: 6570000,
        drops: [{ type: 'gold', name: '灵石', amount: 2520000, chance: 0.9 }, { type: 'herb', name: '鸿蒙神核', amount: 1, chance: 0.022 }, { type: 'fragment', name: '鸿蒙令', amount: 1, chance: 0.011 }] },
      { id: 'm_dj8_boss', name: '八重劫主', expReward: 14600000,
        drops: [{ type: 'gold', name: '灵石', amount: 5040000, chance: 0.9 }, { type: 'herb', name: '八劫神血', amount: 1, chance: 0.012 }, { type: 'fragment', name: '八劫神令', amount: 2, chance: 0.006 }] },
    ],
  },

  {
    id: 'area_dj9', name: '混沌虚空·九重',
    description: '九重天劫的极限，渡劫期的终极试炼场',
    requiredRealmIndex: 29,
    monsters: [
      { id: 'm_dj9_0', name: '九天守护神', expReward: 2002500,
        drops: [{ type: 'gold', name: '灵石', amount: 765000, chance: 0.8 }, { type: 'herb', name: '九天灵露', amount: 1, chance: 0.06 }] },
      { id: 'm_dj9_1', name: '九重劫主', expReward: 4005000,
        drops: [{ type: 'gold', name: '灵石', amount: 1530000, chance: 0.85 }, { type: 'herb', name: '九重劫液', amount: 1, chance: 0.042 }, { type: 'fragment', name: '九劫碎片', amount: 1, chance: 0.021 }] },
      { id: 'm_dj9_2', name: '九天真神', expReward: 8010000,
        drops: [{ type: 'gold', name: '灵石', amount: 3060000, chance: 0.9 }, { type: 'herb', name: '九天神血', amount: 1, chance: 0.02 }, { type: 'fragment', name: '九天神令', amount: 1, chance: 0.01 }] },
      { id: 'm_dj9_boss', name: '天道至尊', expReward: 18000000,
        drops: [{ type: 'gold', name: '灵石', amount: 6120000, chance: 0.9 }, { type: 'herb', name: '天道精髓', amount: 1, chance: 0.01 }, { type: 'fragment', name: '天道神令', amount: 3, chance: 0.005 }] },
    ],
  },
  {
    id: 'area_legend', name: '鸿蒙始源之地',
    description: '五转轮回后方可感知的鸿蒙始源，传说装备的唯一来源',
    requiredRealmIndex: 25,
    requiredRebirthCount: 5,
    monsters: [
      { id: 'm_legend_0', name: '鸿蒙守源兽', expReward: 9000000,
        drops: [{ type: 'gold', name: '鸿蒙灵石', amount: 3487500, chance: 0.8 }, { type: 'herb', name: '鸿蒙始源草', amount: 1, chance: 0.1 }] },
      { id: 'm_legend_1', name: '始源护法',   expReward: 18000000,
        drops: [{ type: 'gold', name: '鸿蒙灵石', amount: 6975000, chance: 0.85 }, { type: 'herb', name: '鸿蒙神树叶', amount: 1, chance: 0.07 }, { type: 'fragment', name: '鸿蒙碎片', amount: 2, chance: 0.05 }] },
      { id: 'm_legend_2', name: '鸿蒙始祖',   expReward: 36000000,
        drops: [{ type: 'gold', name: '鸿蒙灵石', amount: 13950000, chance: 0.9 }, { type: 'herb', name: '鸿蒙至宝种', amount: 1, chance: 0.04 }, { type: 'fragment', name: '鸿蒙至宝碎片', amount: 3, chance: 0.025 }] },
      { id: 'm_legend_boss', name: '鸿蒙道祖', expReward: 80000000,
        drops: [{ type: 'gold', name: '鸿蒙灵石', amount: 27900000, chance: 0.9 }, { type: 'herb', name: '鸿蒙道果', amount: 1, chance: 0.005 }, { type: 'fragment', name: '鸿蒙神令', amount: 5, chance: 0.003 }] },
    ],
  },
];

export const AREAS: Area[] = RAW_AREAS.map(area => ({
  ...area,
  monsters: area.monsters.map(monster => ({
    ...monster,
    ...buildMonsterStats(getStageKey(area), getMonsterRole(monster.id), Boolean(area.requiredRebirthCount && area.requiredRebirthCount >= 5)),
  })),
}));

/** 获取已解锁的区域 */
export function getUnlockedAreas(realmIndex: number, rebirthCount: number = 0): Area[] {
  return AREAS.filter(a =>
    realmIndex >= a.requiredRealmIndex &&
    (a.requiredRebirthCount === undefined || rebirthCount >= a.requiredRebirthCount)
  );
}
