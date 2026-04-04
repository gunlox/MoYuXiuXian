/** 品质等级 */
export type Quality = 'white' | 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'legend';

export const QUALITY_NAMES: Record<Quality, string> = {
  white: '凡品', green: '良品', blue: '上品', purple: '极品', orange: '仙品', red: '神品', legend: '传说',
};

export const QUALITY_COLORS: Record<Quality, string> = {
  white: 'text-gray-300', green: 'text-green-400', blue: 'text-blue-400',
  purple: 'text-purple-400', orange: 'text-orange-400', red: 'text-red-400', legend: 'text-yellow-200',
};

export const QUALITY_BORDER: Record<Quality, string> = {
  white: 'border-gray-500/30', green: 'border-green-500/30', blue: 'border-blue-500/30',
  purple: 'border-purple-500/30', orange: 'border-orange-500/30', red: 'border-red-500/40', legend: 'border-yellow-300/60',
};

export const QUALITY_BG: Record<Quality, string> = {
  white: 'bg-gray-500/5', green: 'bg-green-500/5', blue: 'bg-blue-500/5',
  purple: 'bg-purple-500/5', orange: 'bg-orange-500/5', red: 'bg-red-500/10', legend: 'bg-yellow-300/10',
};

export const QUALITY_ORDER: Quality[] = ['white', 'green', 'blue', 'purple', 'orange', 'red', 'legend'];

// ============ 功法系统 ============

/** 功法模板 */
export interface TechniqueTemplate {
  id: string;
  name: string;
  quality: Quality;
  description: string;
  /** 修炼速度加成(倍率, 如0.1=+10%) */
  expBonus: number;
  /** 攻击加成(倍率) */
  atkBonus: number;
  /** 防御加成(倍率) */
  defBonus: number;
  /** 气血加成(倍率) */
  hpBonus: number;
  /** 暴击率加成(绝对值，如0.05=+5%) */
  critRateBonus: number;
  /** 暴击伤害加成(绝对值，如0.5=+50%) */
  critDmgBonus: number;
  /** 闪避率加成(绝对值，如0.05=+5%) */
  dodgeBonus: number;
  /** 每级升级消耗修为 */
  upgradeCostBase: number;
  /** 最大等级 */
  maxLevel: number;
}

/** 玩家拥有的功法实例 */
export interface TechniqueInstance {
  templateId: string;
  level: number;
}

/** 功法模板库 */
export const TECHNIQUE_TEMPLATES: TechniqueTemplate[] = [
  // ── 功法倍率设计基准 ──
  // 功法提供标准人属性的30%，通过 境界基础值 × atkBonus × lvlMul_满级 = 标准人×30% 反推
  // 渡劫九重境界ATK=1,000,000；目标功法ATK贡献=10,000,000×30%=3,000,000
  // 红品满级lvlMul=1+(50-1)×0.1=5.9 → atkBonus=3,000,000/1,000,000/5.9≈0.508
  // 其余品质按同比例缩小，确保各境界段的玩家用对应品质功法时贡献约30%
  //
  // 白品 maxLevel=10 lvlMul满级=1.9：atkBonus满级×境界值×1.9≈境界ATK×0.30
  //   → atkBonus ≈ 0.30/1.9 ≈ 0.158（但白品只专精单属性，全量给一种）
  // 绿品 maxLevel=15 lvlMul=2.4：atkBonus ≈ 0.30/2.4 ≈ 0.125
  // 蓝品 maxLevel=20 lvlMul=2.9：atkBonus ≈ 0.30/2.9 ≈ 0.103
  // 紫品 maxLevel=25 lvlMul=3.4：atkBonus ≈ 0.30/3.4 ≈ 0.088
  // 橙品 maxLevel=30 lvlMul=3.9：atkBonus ≈ 0.30/3.9 ≈ 0.077
  // 红品 maxLevel=50 lvlMul=5.9：atkBonus ≈ 0.30/5.9 ≈ 0.051（多属性各占约0.051）
  //
  // 凡品 (white) maxLevel=10，单属性专精满级提供约30%
  { id: 'tech_w1', name: '吐纳术',   quality: 'white', description: '最基础的修炼法门，加速灵气吸收',
    expBonus: 0.16, atkBonus: 0,     defBonus: 0,     hpBonus: 0,     critRateBonus: 0,    critDmgBonus: 0,    dodgeBonus: 0,    upgradeCostBase: 50,     maxLevel: 10 },
  { id: 'tech_w2', name: '炼体术',   quality: 'white', description: '淬炼肉身，强化气血根基',
    expBonus: 0,    atkBonus: 0,     defBonus: 0,     hpBonus: 1.58,  critRateBonus: 0,    critDmgBonus: 0,    dodgeBonus: 0,    upgradeCostBase: 50,     maxLevel: 10 },
  { id: 'tech_w3', name: '力劲诀',   quality: 'white', description: '引导灵力入体，提升攻击之力',
    expBonus: 0,    atkBonus: 1.58,  defBonus: 0,     hpBonus: 0,     critRateBonus: 0,    critDmgBonus: 0,    dodgeBonus: 0,    upgradeCostBase: 50,     maxLevel: 10 },
  { id: 'tech_w4', name: '硬气功',   quality: 'white', description: '运功护体，皮糙肉厚',
    expBonus: 0,    atkBonus: 0,     defBonus: 1.58,  hpBonus: 0,     critRateBonus: 0,    critDmgBonus: 0,    dodgeBonus: 0,    upgradeCostBase: 50,     maxLevel: 10 },
  { id: 'tech_w5', name: '灵眼术',   quality: 'white', description: '锤炼眼力，捕捉敌人破绽',
    expBonus: 0,    atkBonus: 0,     defBonus: 0,     hpBonus: 0,     critRateBonus: 0.03, critDmgBonus: 0,    dodgeBonus: 0,    upgradeCostBase: 50,     maxLevel: 10 },
  { id: 'tech_w6', name: '破甲诀',   quality: 'white', description: '专研破甲之术，一击贯穿',
    expBonus: 0,    atkBonus: 0,     defBonus: 0,     hpBonus: 0,     critRateBonus: 0,    critDmgBonus: 0.25, dodgeBonus: 0,    upgradeCostBase: 50,     maxLevel: 10 },
  { id: 'tech_w7', name: '轻身诀',   quality: 'white', description: '身法轻灵，飘忽不定',
    expBonus: 0,    atkBonus: 0,     defBonus: 0,     hpBonus: 0,     critRateBonus: 0,    critDmgBonus: 0,    dodgeBonus: 0.03, upgradeCostBase: 50,     maxLevel: 10 },
  // 良品 (green) maxLevel=15 lvlMul满级=2.4，多属性兼顾但ATK/DEF/HP各约0.125
  { id: 'tech_g1', name: '清风诀', quality: 'green', description: '以风为引，加速灵气运转',
    expBonus: 0.15, atkBonus: 0.60, defBonus: 0,     hpBonus: 0.60,  critRateBonus: 0,    critDmgBonus: 0,    dodgeBonus: 0.03, upgradeCostBase: 200,    maxLevel: 15 },
  { id: 'tech_g2', name: '铁壁功', quality: 'green', description: '淬炼肉身，铜皮铁骨',
    expBonus: 0.05, atkBonus: 0,    defBonus: 1.25,  hpBonus: 1.00,  critRateBonus: 0,    critDmgBonus: 0,    dodgeBonus: 0.01, upgradeCostBase: 200,    maxLevel: 15 },
  // 上品 (blue) maxLevel=20 lvlMul满级=2.9，ATK/DEF/HP各约0.103
  { id: 'tech_b1', name: '紫霞功', quality: 'blue', description: '紫气东来，霞光万道',
    expBonus: 0.20, atkBonus: 0.70, defBonus: 0.50, hpBonus: 0.70,  critRateBonus: 0.02, critDmgBonus: 0.20, dodgeBonus: 0.02, upgradeCostBase: 1000,   maxLevel: 20 },
  { id: 'tech_b2', name: '碎星剑诀', quality: 'blue', description: '剑气纵横，可碎星辰',
    expBonus: 0.05, atkBonus: 1.50, defBonus: 0,    hpBonus: 0.30,  critRateBonus: 0.03, critDmgBonus: 0.40, dodgeBonus: 0,    upgradeCostBase: 1000,   maxLevel: 20 },
  // 极品 (purple) maxLevel=25 lvlMul满级=3.4，ATK/DEF/HP各约0.088
  { id: 'tech_p1', name: '太上玄功', quality: 'purple', description: '太上道祖传下的至高功法',
    expBonus: 0.28, atkBonus: 0.90, defBonus: 0.70, hpBonus: 1.00,  critRateBonus: 0.04, critDmgBonus: 0.45, dodgeBonus: 0.04, upgradeCostBase: 5000,   maxLevel: 25 },
  { id: 'tech_p2', name: '万剑归宗', quality: 'purple', description: '御剑之术的巅峰之作',
    expBonus: 0.08, atkBonus: 2.20, defBonus: 0.20, hpBonus: 0.40,  critRateBonus: 0.06, critDmgBonus: 0.70, dodgeBonus: 0,    upgradeCostBase: 5000,   maxLevel: 25 },
  // 仙品 (orange) maxLevel=30 lvlMul满级=3.9，ATK/DEF/HP各约0.077
  { id: 'tech_o1', name: '混元无极功', quality: 'orange', description: '混元一气，无极无穷',
    expBonus: 0.40, atkBonus: 0.80, defBonus: 0.70, hpBonus: 0.90,  critRateBonus: 0.06, critDmgBonus: 0.90, dodgeBonus: 0.05, upgradeCostBase: 30000,  maxLevel: 30 },
  // 神品 (red) maxLevel=50 lvlMul满级=5.9，ATK/DEF/HP各约0.051，×5.9≈0.30
  { id: 'tech_r1', name: '鸿蒙造化诀', quality: 'red', description: '开天辟地的至高法诀，传说中的功法',
    expBonus: 0.60, atkBonus: 0.508,defBonus: 0.508,hpBonus: 0.508, critRateBonus: 0.10, critDmgBonus: 1.50, dodgeBonus: 0.07, upgradeCostBase: 200000, maxLevel: 50 },
  // 新增功法
  { id: 'tech_b3', name: '烈焰诀', quality: 'blue', description: '以火之力淬炼己身，攻守兼备',
    expBonus: 0.08, atkBonus: 1.00, defBonus: 0.60, hpBonus: 0.80,  critRateBonus: 0.03, critDmgBonus: 0.30, dodgeBonus: 0,    upgradeCostBase: 1000,   maxLevel: 20 },
  { id: 'tech_p3', name: '玄冰心法', quality: 'purple', description: '至阴至寒的修炼法门，防御无双',
    expBonus: 0.10, atkBonus: 0.50, defBonus: 2.00, hpBonus: 1.20,  critRateBonus: 0,    critDmgBonus: 0,    dodgeBonus: 0.06, upgradeCostBase: 5000,   maxLevel: 25 },
  { id: 'tech_o2', name: '天罡北斗功', quality: 'orange', description: '借星辰之力修炼，全面提升',
    expBonus: 0.30, atkBonus: 0.90, defBonus: 0.80, hpBonus: 1.00,  critRateBonus: 0.05, critDmgBonus: 0.70, dodgeBonus: 0.04, upgradeCostBase: 30000,  maxLevel: 30 },
];
// ============ 装备系统 ============

export type EquipSlot = 'weapon' | 'chest' | 'pants' | 'boots' | 'accessory';

export const SLOT_NAMES: Record<EquipSlot, string> = {
  weapon: '武器', chest: '上衣', pants: '裤子', boots: '鞋子', accessory: '饰品',
};

export const SLOT_ICONS: Record<EquipSlot, string> = {
  weapon: '⚔️', chest: '👘', pants: '👖', boots: '🦶', accessory: '💍',
};

/** 品质词条数和强化上限 */
export const QUALITY_AFFIX_COUNT: Record<Quality, [number, number]> = {
  white:  [1, 1],
  green:  [1, 2],
  blue:   [1, 3],
  purple: [2, 4],
  orange: [3, 5],
  red:    [4, 6],
  legend: [6, 6],
};

export const QUALITY_MAX_LEVEL: Record<Quality, number> = {
  white:  5,
  green:  10,
  blue:   15,
  purple: 20,
  orange: 30,
  red:    50,
  legend: 100,
};

/** 强化基础费用（按品质） */
export const QUALITY_ENHANCE_BASE: Record<Quality, { gold: number; frag: number }> = {
  white:  { gold: 15,      frag: 1  },
  green:  { gold: 100,     frag: 2  },
  blue:   { gold: 500,     frag: 3  },
  purple: { gold: 3000,    frag: 5  },
  orange: { gold: 25000,   frag: 8  },
  red:    { gold: 150000,  frag: 15 },
  legend: { gold: 2000000, frag: 50 },
};

/** 词条类型 */
export type AffixType = 'atk' | 'def' | 'hp' | 'critRate' | 'critDmg' | 'dodge' | 'expRate';

/** 单条词条 */
export interface Affix {
  type: AffixType;
  value: number;
}

export const MIN_EXP_RATE_AFFIX_VALUE = 0.0001;

export function getEffectiveAffixValue(type: AffixType, value: number): number {
  if (type === 'expRate' && value < MIN_EXP_RATE_AFFIX_VALUE) {
    return MIN_EXP_RATE_AFFIX_VALUE;
  }
  return value;
}

export function getBoundedAffixValue(type: AffixType, value: number, realmTier?: number): number {
  const effectiveValue = getEffectiveAffixValue(type, value);
  if ((type === 'critRate' || type === 'critDmg' || type === 'dodge') && realmTier !== undefined) {
    const [, max] = getPercentAffixRange(type, realmTier);
    return Math.min(effectiveValue, max);
  }
  return effectiveValue;
}

const ARTIFACT_TIER_TOTAL_RATIO = [
  0.001, 0.02, 0.025, 0.03,
  0.05, 0.055, 0.06,
  0.1, 0.115, 0.13,
  0.2, 0.225, 0.25,
  0.4, 0.425, 0.45, 0.5, 0.55, 0.6, 0.7, 0.8, 1,
] as const;

/**
 * 词条基础值（tier=0，品质white）
 * 实际值 = base × QUALITY_VALUE_MULT × (1 + tier×0.8) × fluctuation
 * 强化额外倍率 = 1 + level×0.03
 * 目标：渡劫九重时，5件装备主属性词条在+0约占标准人10%，+100额外再提供约30%
 */
export const AFFIX_BASE: Record<AffixType, [number, number]> = {
  atk:      [375,    750    ],
  def:      [280,    562    ],
  hp:       [3750,   7490   ],
  critRate: [0.005,  0.015  ],
  critDmg:  [0.05,   0.20   ],
  dodge:    [0.005,  0.015  ],
  expRate:  [0.000005, 0.000015 ],
};

const AFFIX_TOTAL_SHARE = 0.1;
const AFFIX_SLOT_SHARE = 5;
const PERCENT_AFFIX_CAPS = {
  critRate: 1,
  critDmg: 50,
  dodge: 0.75,
} as const;

function getPercentAffixRange(type: 'critRate' | 'critDmg' | 'dodge', realmTier: number): [number, number] {
  const t = Math.max(0, Math.min(21, realmTier));
  const ratio = ARTIFACT_TIER_TOTAL_RATIO[t];
  const perArtifactShare = PERCENT_AFFIX_CAPS[type] * AFFIX_TOTAL_SHARE / AFFIX_SLOT_SHARE;
  return [
    parseFloat((perArtifactShare * 0.75 * ratio).toFixed(4)),
    parseFloat((perArtifactShare * 1.25 * ratio).toFixed(4)),
  ];
}

/**
 * 品质数值倍率
 * 金色满词条(6词条)+100强化×tier21 ≈ ATK目标4,000,000
 * 6词条×均值450×700×(1+21×0.8)×11 ≈ 6×450×700×17.8×11 ≈ 3.7亿（过高，词条数已限6）
 * 实际tier权重内置在generateAffixes里，此处倍率保持档次感即可
 */
export const QUALITY_VALUE_MULT: Record<Quality, number> = {
  white:  1,
  green:  2,
  blue:   5,
  purple: 12,
  orange: 30,
  red:    80,
  legend: 200,
};

/** 可出现在各槽位上的词条类型（按槽位过滤） */
export const SLOT_AFFIX_POOL: Record<EquipSlot, AffixType[]> = {
  weapon:    ['atk', 'def', 'hp', 'critRate', 'critDmg', 'dodge', 'expRate'],
  chest:     ['atk', 'def', 'hp', 'critRate', 'critDmg', 'dodge', 'expRate'],
  pants:     ['atk', 'def', 'hp', 'critRate', 'critDmg', 'dodge', 'expRate'],
  boots:     ['atk', 'def', 'hp', 'critRate', 'critDmg', 'dodge', 'expRate'],
  accessory: ['atk', 'def', 'hp', 'critRate', 'critDmg', 'dodge', 'expRate'],
};

/** 装备模板（仅定义名称/槽位/描述/境界tier） */
export interface ArtifactTemplate {
  id: string;
  name: string;
  slot: EquipSlot;
  description: string;
  /** 境界档位 0~9 (0=练气~9=渡劫九重)，决定属性数值量级 */
  realmTier: number;
}

/** 玩家拥有的装备实例 */
export interface ArtifactInstance {
  templateId: string;
  quality: Quality;
  level: number;
  uid: string;
  /** 词条列表（生成时随机产生） */
  affixes: Affix[];
}

/** 生成随机词条 */
export function generateAffixes(quality: Quality, slot: EquipSlot, realmTier: number): Affix[] {
  const [minCount, maxCount] = QUALITY_AFFIX_COUNT[quality];
  const count = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));
  const pool = [...SLOT_AFFIX_POOL[slot]];
  const qMult = QUALITY_VALUE_MULT[quality];
  const tMult = 1 + realmTier * 0.8;

  const chosen: AffixType[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    chosen.push(pool.splice(idx, 1)[0]);
  }

  return chosen.map(type => {
    if (type === 'critRate' || type === 'critDmg' || type === 'dodge') {
      const [min, max] = getPercentAffixRange(type, realmTier);
      const value = min + Math.random() * (max - min);
      return { type, value: parseFloat(value.toFixed(4)) };
    }
    const [base_min, base_max] = AFFIX_BASE[type];
    const roll = base_min + Math.random() * (base_max - base_min);
    // ±25% 随机浮动，允许超出标准人模型划定的属性范围
    const fluctuation = 0.75 + Math.random() * 0.5; // [0.75, 1.25]
    const value = roll * qMult * tMult * fluctuation;
    if (type === 'atk' || type === 'def' || type === 'hp') {
      return { type, value: Math.floor(value) };
    }
    return { type, value: getEffectiveAffixValue(type, parseFloat(value.toFixed(4))) };
  });
}

/**
 * 装备模板库（realmTier 0~9 对应境界量级，品质独立随机）
 * realmTier: 0=练气 1=筑基初 2=筑基中 3=筑基后
 *            4=金丹初 5=金丹中 6=金丹后
 *            7=元婴初 8=元婴中 9=元婴后
 *           10=化神初 11=化神中 12=化神后
 *           13=渡劫一 14=渡劫二 15=渡劫三 16=渡劫四
 *           17=渡劫五 18=渡劫六 19=渡劫七 20=渡劫八 21=渡劫九
 */
export const ARTIFACT_TEMPLATES: ArtifactTemplate[] = [

  // ══════════════════════════════════════
  // 武 器 slot: weapon
  // ══════════════════════════════════════

  { id: 'w_wp_0',  name: '铁剑',     slot: 'weapon', description: '练气弟子常用的铁制长剑',         realmTier: 0  },

  { id: 'w_wp_1',  name: '翠竹剑',     slot: 'weapon',    description: '以灵竹铸就，筑基初成所配',                  realmTier: 1  },
  { id: 'w_wp_2',  name: '寒铁剑',     slot: 'weapon',    description: '寒铁淬炼，筑基中期修士所用',                realmTier: 2  },
  { id: 'w_wp_3',  name: '烈阳刀',     slot: 'weapon',    description: '炼入烈阳精华，筑基后期神兵',                realmTier: 3  },
  { id: 'w_wp_4',  name: '冰魄剑',     slot: 'weapon',    description: '千年寒冰炼化，金丹初期利器',                realmTier: 4  },
  { id: 'w_wp_5',  name: '烈焰刀',     slot: 'weapon',    description: '以真火铸成，金丹中期所配',                  realmTier: 5  },
  { id: 'w_wp_6',  name: '九幽魂刀',   slot: 'weapon',    description: '九幽之气炼就，金丹后期强兵',                realmTier: 6  },
  { id: 'w_wp_7',  name: '紫电锤',     slot: 'weapon',    description: '雷灵祭炼，元婴初期镇魂重器',                realmTier: 7  },
  { id: 'w_wp_8',  name: '雷霆剑',     slot: 'weapon',    description: '雷电缠绕，元婴中期神剑',                    realmTier: 8  },
  { id: 'w_wp_9',  name: '万劫神刀',   slot: 'weapon',    description: '历经万劫，元婴后期无双神刀',                realmTier: 9  },
  { id: 'w_wp_10', name: '天罡剑',     slot: 'weapon',    description: '天罡星力铸就，化神初期仙兵',                realmTier: 10 },
  { id: 'w_wp_11', name: '凤羽扇',     slot: 'weapon',    description: '凤凰羽毛所织，化神中期仙宝',                realmTier: 11 },
  { id: 'w_wp_12', name: '混元圣剑',   slot: 'weapon',    description: '混元之力凝聚，化神后期至宝',                realmTier: 12 },
  { id: 'w_wp_13', name: '破天剑',     slot: 'weapon',    description: '斩破天道桎梏，渡劫一重神器',                realmTier: 13 },
  { id: 'w_wp_14', name: '劫雷斩',     slot: 'weapon',    description: '以劫雷淬炼，渡劫二重所用',                  realmTier: 14 },
  { id: 'w_wp_15', name: '天诛剑',     slot: 'weapon',    description: '上天诛神之剑，渡劫三重利器',                realmTier: 15 },
  { id: 'w_wp_16', name: '盘古斧',     slot: 'weapon',    description: '开天辟地神器，渡劫四重必备',                realmTier: 16 },
  { id: 'w_wp_17', name: '混元神剑',   slot: 'weapon',    description: '混元之气铸就，渡劫五重神兵',                realmTier: 17 },
  { id: 'w_wp_18', name: '太乙神斧',   slot: 'weapon',    description: '太乙真人遗器，渡劫六重至宝',                realmTier: 18 },
  { id: 'w_wp_19', name: '太古神兵',   slot: 'weapon',    description: '太古时代遗留的无上神兵',                    realmTier: 19 },
  { id: 'w_wp_20', name: '鸿蒙破天刀', slot: 'weapon',    description: '鸿蒙初开时的破天利刃，渡劫八重',            realmTier: 20 },
  { id: 'w_wp_21', name: '九天神剑',   slot: 'weapon',    description: '九重天劫锻就，渡劫期无上神剑',              realmTier: 21 },
  { id: 'w_wp_legend', name: '鸿蒙神剑',   slot: 'weapon',    description: '五转轮回，鸿蒙一气所化的至高神剑',      realmTier: 21 },

  // ══ 上衣 ══
  { id: 'w_ch_0',  name: '粗布衣',     slot: 'chest',     description: '练气弟子的布制上衣',                        realmTier: 0  },
  { id: 'w_ch_1',  name: '玄铁软甲',   slot: 'chest',     description: '玄铁编织轻甲，筑基初期防护',                realmTier: 1  },
  { id: 'w_ch_2',  name: '灵纹战甲',   slot: 'chest',     description: '刻有灵纹的战甲，筑基中期所用',              realmTier: 2  },
  { id: 'w_ch_3',  name: '青铜甲',     slot: 'chest',     description: '青铜祭炼，筑基后期坚甲',                    realmTier: 3  },
  { id: 'w_ch_4',  name: '金丝软甲',   slot: 'chest',     description: '金蚕丝织就，金丹初期防护',                  realmTier: 4  },
  { id: 'w_ch_5',  name: '玄武甲',     slot: 'chest',     description: '玄武灵力凝聚，金丹中期战甲',                realmTier: 5  },
  { id: 'w_ch_6',  name: '星铁重甲',   slot: 'chest',     description: '陨星铁所铸，金丹后期重甲',                  realmTier: 6  },
  { id: 'w_ch_7',  name: '龙鳞战甲',   slot: 'chest',     description: '龙鳞锻造，元婴初期重甲',                    realmTier: 7  },
  { id: 'w_ch_8',  name: '麒麟甲',     slot: 'chest',     description: '麒麟鳞炼制，元婴中期至甲',                  realmTier: 8  },
  { id: 'w_ch_9',  name: '万象神甲',   slot: 'chest',     description: '汇聚万象，元婴后期神甲',                    realmTier: 9  },
  { id: 'w_ch_10', name: '天蚕宝衣',   slot: 'chest',     description: '天蚕所织，刀枪不入，化神初期',              realmTier: 10 },
  { id: 'w_ch_11', name: '不朽战甲',   slot: 'chest',     description: '永不损坏的战甲，化神中期仙宝',              realmTier: 11 },
  { id: 'w_ch_12', name: '三清道袍',   slot: 'chest',     description: '三清真气所化，化神后期道袍',                realmTier: 12 },
  { id: 'w_ch_13', name: '劫灰战甲',   slot: 'chest',     description: '渡劫之火淬炼，渡劫一重神甲',                realmTier: 13 },
  { id: 'w_ch_14', name: '雷云甲',     slot: 'chest',     description: '雷云凝铸，渡劫二重坚甲',                    realmTier: 14 },
  { id: 'w_ch_15', name: '天罚神甲',   slot: 'chest',     description: '天罚之力铸成，渡劫三重护甲',                realmTier: 15 },
  { id: 'w_ch_16', name: '混沌神甲',   slot: 'chest',     description: '混沌之力凝聚，渡劫四重神甲',                realmTier: 16 },
  { id: 'w_ch_17', name: '玄冥战甲',   slot: 'chest',     description: '玄冥二老传承，渡劫五重战甲',                realmTier: 17 },
  { id: 'w_ch_18', name: '太乙玄甲',   slot: 'chest',     description: '太乙之气淬炼，渡劫六重神甲',                realmTier: 18 },
  { id: 'w_ch_19', name: '太古神甲',   slot: 'chest',     description: '太古遗留的不朽神甲，渡劫七重',              realmTier: 19 },
  { id: 'w_ch_20', name: '鸿蒙神甲',   slot: 'chest',     description: '鸿蒙之力铸就，渡劫八重神甲',                realmTier: 20 },
  { id: 'w_ch_21', name: '九劫不灭甲', slot: 'chest',     description: '历经九重天劫而不灭的至高神甲',              realmTier: 21 },
  { id: 'w_ch_legend', name: '鸿蒙道袍',   slot: 'chest',     description: '五转轮回，鸿蒙初开时的至高道袍',        realmTier: 21 },

  // ══ 裤子 ══
  { id: 'w_pt_0',  name: '粗布裤',     slot: 'pants',     description: '练气弟子的布制裤子',                        realmTier: 0  },
  { id: 'w_pt_1',  name: '玄铁护腿',   slot: 'pants',     description: '玄铁制成护腿，筑基初期防护',                realmTier: 1  },
  { id: 'w_pt_2',  name: '灵纹护腿',   slot: 'pants',     description: '灵纹加持，筑基中期护腿',                    realmTier: 2  },
  { id: 'w_pt_3',  name: '青铜护腿',   slot: 'pants',     description: '青铜祭炼，筑基后期护腿',                    realmTier: 3  },
  { id: 'w_pt_4',  name: '流云裤',     slot: 'pants',     description: '轻若流云，金丹初期身法加持',                realmTier: 4  },
  { id: 'w_pt_5',  name: '玄武裤甲',   slot: 'pants',     description: '玄武之力护体，金丹中期所用',                realmTier: 5  },
  { id: 'w_pt_6',  name: '星铁护腿',   slot: 'pants',     description: '星铁锻造，金丹后期坚甲',                    realmTier: 6  },
  { id: 'w_pt_7',  name: '龙纹护腿',   slot: 'pants',     description: '龙纹刺绣，元婴初期护腿',                    realmTier: 7  },
  { id: 'w_pt_8',  name: '麒麟护腿',   slot: 'pants',     description: '麒麟鳞制成，元婴中期护腿',                  realmTier: 8  },
  { id: 'w_pt_9',  name: '万象护腿',   slot: 'pants',     description: '汇聚万象灵力，元婴后期护腿',                realmTier: 9  },
  { id: 'w_pt_10', name: '八卦护腿',   slot: 'pants',     description: '八卦阵纹护体，化神初期',                    realmTier: 10 },
  { id: 'w_pt_11', name: '天罡护腿',   slot: 'pants',     description: '天罡之力护住下盘，化神中期',                realmTier: 11 },
  { id: 'w_pt_12', name: '三清护腿',   slot: 'pants',     description: '三清真气注入，化神后期护腿',                realmTier: 12 },
  { id: 'w_pt_13', name: '劫火护腿',   slot: 'pants',     description: '天劫之火淬炼，渡劫一重护腿',                realmTier: 13 },
  { id: 'w_pt_14', name: '雷罚护腿',   slot: 'pants',     description: '雷罚之力加持，渡劫二重护腿',                realmTier: 14 },
  { id: 'w_pt_15', name: '天诛护腿',   slot: 'pants',     description: '天诛之力护体，渡劫三重护腿',                realmTier: 15 },
  { id: 'w_pt_16', name: '混沌裤',     slot: 'pants',     description: '混沌神布裁制，渡劫四重护腿',                realmTier: 16 },
  { id: 'w_pt_17', name: '玄冥护腿',   slot: 'pants',     description: '玄冥之力护住下盘，渡劫五重',                realmTier: 17 },
  { id: 'w_pt_18', name: '太乙护腿',   slot: 'pants',     description: '太乙真气护体，渡劫六重护腿',                realmTier: 18 },
  { id: 'w_pt_19', name: '太古护腿',   slot: 'pants',     description: '太古遗留，渡劫七重无上护腿',                realmTier: 19 },
  { id: 'w_pt_20', name: '鸿蒙护腿',   slot: 'pants',     description: '鸿蒙神布裁制，渡劫八重护腿',                realmTier: 20 },
  { id: 'w_pt_21', name: '九劫神裤',   slot: 'pants',     description: '九重天劫历练，渡劫期至高护腿',              realmTier: 21 },
  { id: 'w_pt_legend', name: '鸿蒙裤', slot: 'pants',     description: '五转轮回所得，鸿蒙神布裁制的传说护腿',      realmTier: 21 },

  // ══ 鞋子 ══
  { id: 'w_bt_0',  name: '草鞋',       slot: 'boots',     description: '练气弟子的草编鞋子',                        realmTier: 0  },
  { id: 'w_bt_1',  name: '灵兽皮靴',   slot: 'boots',     description: '灵兽皮革缝制，筑基初期靴子',                realmTier: 1  },
  { id: 'w_bt_2',  name: '玄铁靴',     slot: 'boots',     description: '玄铁打造，筑基中期战靴',                    realmTier: 2  },
  { id: 'w_bt_3',  name: '青铜战靴',   slot: 'boots',     description: '青铜祭炼，筑基后期战靴',                    realmTier: 3  },
  { id: 'w_bt_4',  name: '踏云靴',     slot: 'boots',     description: '如履祥云，金丹初期战靴',                    realmTier: 4  },
  { id: 'w_bt_5',  name: '凌波靴',     slot: 'boots',     description: '踏水如陆，金丹中期战靴',                    realmTier: 5  },
  { id: 'w_bt_6',  name: '流星靴',     slot: 'boots',     description: '快若流星，金丹后期战靴',                    realmTier: 6  },
  { id: 'w_bt_7',  name: '龙骨战靴',   slot: 'boots',     description: '真龙骨骼锻造，元婴初期战靴',                realmTier: 7  },
  { id: 'w_bt_8',  name: '麒麟战靴',   slot: 'boots',     description: '麒麟骨炼制，元婴中期战靴',                  realmTier: 8  },
  { id: 'w_bt_9',  name: '万象战靴',   slot: 'boots',     description: '汇聚万象，元婴后期至靴',                    realmTier: 9  },
  { id: 'w_bt_10', name: '追风靴',     slot: 'boots',     description: '快如追风，化神初期仙靴',                    realmTier: 10 },
  { id: 'w_bt_11', name: '天步靴',     slot: 'boots',     description: '踏天而行，化神中期仙靴',                    realmTier: 11 },
  { id: 'w_bt_12', name: '三清步云靴', slot: 'boots',     description: '三清步云之法，化神后期至靴',                realmTier: 12 },
  { id: 'w_bt_13', name: '劫云靴',     slot: 'boots',     description: '踏劫云而行，渡劫一重神靴',                  realmTier: 13 },
  { id: 'w_bt_14', name: '雷踏靴',     slot: 'boots',     description: '踏雷而行，渡劫二重战靴',                    realmTier: 14 },
  { id: 'w_bt_15', name: '天罚战靴',   slot: 'boots',     description: '天罚之力铸就，渡劫三重战靴',                realmTier: 15 },
  { id: 'w_bt_16', name: '混沌神靴',   slot: 'boots',     description: '踏破混沌虚空，渡劫四重神靴',                realmTier: 16 },
  { id: 'w_bt_17', name: '玄冥步靴',   slot: 'boots',     description: '玄冥步法加持，渡劫五重战靴',                realmTier: 17 },
  { id: 'w_bt_18', name: '太乙飞云靴', slot: 'boots',     description: '太乙飞云之术，渡劫六重仙靴',                realmTier: 18 },
  { id: 'w_bt_19', name: '太古步天靴', slot: 'boots',     description: '太古神靴，渡劫七重无上至宝',                realmTier: 19 },
  { id: 'w_bt_20', name: '鸿蒙天步靴', slot: 'boots',     description: '鸿蒙天地间的至高战靴，渡劫八重',            realmTier: 20 },
  { id: 'w_bt_21', name: '九天神靴',   slot: 'boots',     description: '踏遍九重天，渡劫期无上神靴',                realmTier: 21 },
  { id: 'w_bt_legend', name: '鸿蒙神靴', slot: 'boots',   description: '五转轮回，鸿蒙虚空中的传说神靴',            realmTier: 21 },

  // ══ 饰品 ══
  { id: 'w_ac_0',  name: '聚灵珠',     slot: 'accessory', description: '练气弟子用的聚灵小珠',                      realmTier: 0  },
  { id: 'w_ac_1',  name: '灵玉环',     slot: 'accessory', description: '灵玉制成，筑基初期饰品',                    realmTier: 1  },
  { id: 'w_ac_2',  name: '灵石项链',   slot: 'accessory', description: '上乘灵石项链，筑基中期饰品',                realmTier: 2  },
  { id: 'w_ac_3',  name: '灵晶手环',   slot: 'accessory', description: '灵晶镶嵌手环，筑基后期饰品',                realmTier: 3  },
  { id: 'w_ac_4',  name: '护心镜',     slot: 'accessory', description: '护住心脉要害，金丹初期饰品',                realmTier: 4  },
  { id: 'w_ac_5',  name: '太阴玉佩',   slot: 'accessory', description: '太阴之力加持，金丹中期饰品',                realmTier: 5  },
  { id: 'w_ac_6',  name: '星辰吊坠',   slot: 'accessory', description: '星辰之力注入，金丹后期饰品',                realmTier: 6  },
  { id: 'w_ac_7',  name: '乾坤戒',     slot: 'accessory', description: '内含小天地，元婴初期饰品',                  realmTier: 7  },
  { id: 'w_ac_8',  name: '星辰环',     slot: 'accessory', description: '星辰之力凝聚，元婴中期饰品',                realmTier: 8  },
  { id: 'w_ac_9',  name: '太虚玉佩',   slot: 'accessory', description: '太虚境中所炼，元婴后期饰品',                realmTier: 9  },
  { id: 'w_ac_10', name: '混元珠',     slot: 'accessory', description: '蕴含混元之力，化神初期饰品',                realmTier: 10 },
  { id: 'w_ac_11', name: '太极镜',     slot: 'accessory', description: '阴阳两仪运转，化神中期饰品',                realmTier: 11 },
  { id: 'w_ac_12', name: '三清玉符',   slot: 'accessory', description: '三清真气凝就的玉符，化神后期',              realmTier: 12 },
  { id: 'w_ac_13', name: '天劫玉佩',   slot: 'accessory', description: '天劫之力凝炼，渡劫一重至宝',                realmTier: 13 },
  { id: 'w_ac_14', name: '劫雷项链',   slot: 'accessory', description: '劫雷之力凝聚，渡劫二重饰品',                realmTier: 14 },
  { id: 'w_ac_15', name: '天诛戒指',   slot: 'accessory', description: '天诛之力注入，渡劫三重饰品',                realmTier: 15 },
  { id: 'w_ac_16', name: '鸿蒙玉佩',   slot: 'accessory', description: '鸿蒙之初至宝，渡劫四重饰品',                realmTier: 16 },
  { id: 'w_ac_17', name: '玄冥神珠',   slot: 'accessory', description: '玄冥真气凝珠，渡劫五重至宝',                realmTier: 17 },
  { id: 'w_ac_18', name: '太乙灵环',   slot: 'accessory', description: '太乙真人炼制，渡劫六重灵环',                realmTier: 18 },
  { id: 'w_ac_19', name: '太古神珠',   slot: 'accessory', description: '太古时代神珠，渡劫七重传承',                realmTier: 19 },
  { id: 'w_ac_20', name: '九天灵珠',   slot: 'accessory', description: '九天之上落下的灵珠，渡劫八重',              realmTier: 20 },
  { id: 'w_ac_21', name: '混沌至宝',   slot: 'accessory', description: '混沌中诞生的至宝，渡劫九重传承',            realmTier: 21 },
  { id: 'w_ac_legend', name: '鸿蒙至宝', slot: 'accessory', description: '五转轮回后领悟，鸿蒙混沌中凝炼的绝世至宝', realmTier: 21 },
];

let _uidCounter = Date.now();
export function generateUid(): string {
  return (++_uidCounter).toString(36);
}

// ============ 计算函数 ============

export function getTechTemplate(id: string): TechniqueTemplate | undefined {
  return TECHNIQUE_TEMPLATES.find(t => t.id === id);
}

export function getArtifactTemplate(id: string): ArtifactTemplate | undefined {
  return ARTIFACT_TEMPLATES.find(t => t.id === id);
}

/** 功法升级所需修为 */
export function getTechUpgradeCost(template: TechniqueTemplate, currentLevel: number): number {
  return Math.floor(template.upgradeCostBase * Math.pow(1.5, currentLevel));
}

/** 强化费用增长系数（按品质） */
const ENHANCE_COST_K: Record<Quality, number> = {
  white: 0.3, green: 0.3, blue: 0.3,
  purple: 0.2, orange: 0.2, red: 0.2, legend: 0.2,
};

/** 装备强化所需资源（按品质定基础费用） */
export function getArtifactEnhanceCost(art: ArtifactInstance): { gold: number; fragments: number } {
  const base = QUALITY_ENHANCE_BASE[art.quality];
  const k = ENHANCE_COST_K[art.quality];
  return {
    gold: Math.floor(base.gold * Math.pow(1 + art.level * k, 2)),
    fragments: Math.floor(base.frag * (1 + art.level * 0.5)),
  };
}

export function getArtifactSalvageRewards(quality: Quality): { gold: number; fragments: number } {
  const base = QUALITY_ENHANCE_BASE[quality];
  return {
    gold: Math.floor(base.gold * 2),
    fragments: base.frag * 2,
  };
}

function getArtifactBonusesByMul(art: ArtifactInstance, affixEnhanceMul: number): { atk: number; def: number; hp: number; critRate: number; critDmg: number; dodge: number; expRate: number } {
  const result = { atk: 0, def: 0, hp: 0, critRate: 0, critDmg: 0, dodge: 0, expRate: 0 };
  const tmpl = getArtifactTemplate(art.templateId);
  const realmTier = tmpl?.realmTier ?? 0;
  for (const affix of (art.affixes ?? [])) {
    const v = getBoundedAffixValue(affix.type, affix.value, realmTier) * affixEnhanceMul;
    switch (affix.type) {
      case 'atk':      result.atk      += Math.floor(v); break;
      case 'def':      result.def      += Math.floor(v); break;
      case 'hp':       result.hp       += Math.floor(v); break;
      case 'critRate': result.critRate += v;              break;
      case 'critDmg':  result.critDmg  += v;              break;
      case 'dodge':    result.dodge    += v;              break;
      case 'expRate':  result.expRate  += v;              break;
    }
  }
  return result;
}

export function getArtifactBonusesWithoutEnhance(art: ArtifactInstance): { atk: number; def: number; hp: number; critRate: number; critDmg: number; dodge: number; expRate: number } {
  return getArtifactBonusesByMul(art, 1);
}

export function getArtifactBonuses(art: ArtifactInstance): { atk: number; def: number; hp: number; critRate: number; critDmg: number; dodge: number; expRate: number } {
  return getArtifactBonusesByMul(art, 1 + (art.level ?? 0) * 0.01);
}

/** 功法提供的属性加成倍率(含等级) */
export function getTechBonuses(tech: TechniqueInstance): { expBonus: number; atkBonus: number; defBonus: number; hpBonus: number; critRateBonus: number; critDmgBonus: number; dodgeBonus: number } {
  const tmpl = getTechTemplate(tech.templateId);
  if (!tmpl) return { expBonus: 0, atkBonus: 0, defBonus: 0, hpBonus: 0, critRateBonus: 0, critDmgBonus: 0, dodgeBonus: 0 };
  const lvlMul = 1 + (tech.level - 1) * 0.1;
  return {
    expBonus: tmpl.expBonus * lvlMul,
    atkBonus: tmpl.atkBonus * lvlMul,
    defBonus: tmpl.defBonus * lvlMul,
    hpBonus: tmpl.hpBonus * lvlMul,
    critRateBonus: tmpl.critRateBonus * lvlMul,
    critDmgBonus: tmpl.critDmgBonus * lvlMul,
    dodgeBonus: tmpl.dodgeBonus * lvlMul,
  };
}

export function getQualityDropWeight(quality: Quality): number {
  const weights: Record<Quality, number> = {
    white: 50, green: 30, blue: 15, purple: 4, orange: 0.8, red: 0.2, legend: 0.02,
  };
  return weights[quality];
}

/**
 * 当前境界/轮回条件下允许掉落的最高品质
 * @param realmIndex 玩家当前境界索引
 * @param rebirthCount 轮回次数
 */
export function getMaxDropQuality(realmIndex: number, rebirthCount: number = 0): Quality {
  if (rebirthCount >= 5 && realmIndex >= 25) return 'legend';
  if (realmIndex >= 21) return 'red';
  if (realmIndex >= 18) return 'orange';
  if (realmIndex >= 15) return 'purple';
  if (realmIndex >= 12) return 'blue';
  if (realmIndex >= 9) return 'green';
  return 'white';
}

/**
 * 渡劫期红装最高档位（13=r1 ... 21=r9）
 * @param realmIndex 玩家当前境界索引
 */
export function getMaxRedTier(realmIndex: number): number {
  if (realmIndex < 21) return 0;
  return Math.min(21, 13 + (realmIndex - 21));
}

/**
 * 当前境界/轮回条件下可掉落的全部品质列表
 * @param realmIndex 玩家当前境界索引
 * @param rebirthCount 轮回次数
 */
export function getAvailableQualities(realmIndex: number, rebirthCount: number = 0): Quality[] {
  const maxQuality = getMaxDropQuality(realmIndex, rebirthCount);
  return QUALITY_ORDER.slice(0, QUALITY_ORDER.indexOf(maxQuality) + 1);
}

/**
 * 当前境界/轮回条件下功法掉落允许的最高品质索引
 * 功法当前最高仅开放到红品，因此这里不返回 legend 索引
 */
export function getTechniqueDropMaxQualityIndex(realmIndex: number, rebirthCount: number = 0): number {
  const maxQuality = getMaxDropQuality(realmIndex, rebirthCount);
  return Math.min(QUALITY_ORDER.indexOf('red'), QUALITY_ORDER.indexOf(maxQuality));
}

function normalizeArtifactDropTier(realmIndex: number, targetRealmTier?: number): number {
  if (targetRealmTier !== undefined) return Math.max(0, Math.min(21, targetRealmTier));
  return Math.max(0, Math.min(21, realmIndex - 8));
}

/**
 * 随机掉落一件装备实例
 * @param realmIndex 玩家当前境界索引，决定可掉品质
 * @param slot 指定槽位（不指定则随机）
 */
export function randomArtifactDrop(
  realmIndex: number,
  rebirthCount: number = 0,
  slot?: EquipSlot,
  targetRealmTier?: number,
): ArtifactInstance | null {
  const availableQualities = getAvailableQualities(realmIndex, rebirthCount);

  // 随机品质（按权重）
  const totalWeight = availableQualities.reduce((s, q) => s + getQualityDropWeight(q), 0);
  let roll = Math.random() * totalWeight;
  let quality: Quality = availableQualities[0];
  for (const q of availableQualities) {
    roll -= getQualityDropWeight(q);
    if (roll <= 0) { quality = q; break; }
  }

  // 随机槽位
  const slots: EquipSlot[] = ['weapon', 'chest', 'pants', 'boots', 'accessory'];
  const chosenSlot: EquipSlot = slot ?? slots[Math.floor(Math.random() * slots.length)];

  // 从该槽位模板中，按realmIndex选一个贴近的模板
  const slotTemplates = ARTIFACT_TEMPLATES.filter(t => t.slot === chosenSlot);
  if (slotTemplates.length === 0) return null;

  let candidates = slotTemplates;
  const targetTier = normalizeArtifactDropTier(realmIndex, targetRealmTier);

  if (quality === 'legend') {
    candidates = slotTemplates.filter(t => t.id.endsWith('_legend'));
  } else {
    candidates = slotTemplates.filter(t => !t.id.endsWith('_legend') && t.realmTier === targetTier);
  }

  if (candidates.length === 0) return null;

  const tmpl = candidates.reduce((best, t) =>
    Math.abs(t.realmTier - targetTier) < Math.abs(best.realmTier - targetTier) ? t : best
  , candidates[0]);

  const affixes = generateAffixes(quality, chosenSlot, tmpl.realmTier);
  return {
    templateId: tmpl.id,
    quality,
    level: 0,
    uid: generateUid(),
    affixes,
  };
}

/** 随机掉落功法 */
export function randomTechniqueDrop(maxQualityIndex: number, excludedTemplateIds: string[] = []): TechniqueTemplate | null {
  const excluded = new Set(excludedTemplateIds);
  const available = TECHNIQUE_TEMPLATES.filter(t =>
    QUALITY_ORDER.indexOf(t.quality) <= maxQualityIndex && !excluded.has(t.id)
  );
  if (available.length === 0) return null;
  const totalWeight = available.reduce((sum, t) => sum + getQualityDropWeight(t.quality), 0);
  let r = Math.random() * totalWeight;
  for (const t of available) {
    r -= getQualityDropWeight(t.quality);
    if (r <= 0) return t;
  }
  return available[0];
}

/** 计算已精通功法的永久叠加加成（满级效果的50%，可叠加多本） */
export function getMasteryBonuses(masteredIds: string[]): {
  expBonus: number; atkBonus: number; defBonus: number; hpBonus: number;
  critRateBonus: number; critDmgBonus: number; dodgeBonus: number;
} {
  const result = { expBonus: 0, atkBonus: 0, defBonus: 0, hpBonus: 0, critRateBonus: 0, critDmgBonus: 0, dodgeBonus: 0 };
  for (const id of masteredIds) {
    const tmpl = getTechTemplate(id);
    if (!tmpl) continue;
    const lvlMul = 1 + (tmpl.maxLevel - 1) * 0.1; // 满级时的等级倍率
    result.expBonus      += tmpl.expBonus      * lvlMul * 0.5;
    result.atkBonus      += tmpl.atkBonus      * lvlMul * 0.5;
    result.defBonus      += tmpl.defBonus      * lvlMul * 0.5;
    result.hpBonus       += tmpl.hpBonus       * lvlMul * 0.5;
    result.critRateBonus += tmpl.critRateBonus * lvlMul * 0.5;
    result.critDmgBonus  += tmpl.critDmgBonus  * lvlMul * 0.5;
    result.dodgeBonus    += tmpl.dodgeBonus    * lvlMul * 0.5;
  }
  return result;
}

/**
 * 装备固定基础属性（由槽位+realmTier决定，与词条无关，不受强化等级影响）
 *
 * weapon    → 攻击力
 * chest     → 生命值
 * pants     → 防御力
 * boots     → 闪避率  (tier0≈0.2% ~ tier21≈5%，五转后最高10%)
 * accessory → 暴击率  (tier0≈0.2% ~ tier21≈5%，五转后最高10%)
 *           + 暴击伤害 (tier0≈2%   ~ tier21≈50%，五转后最高100%)
 */
export function getArtifactBaseStats(
  slot: EquipSlot,
  realmTier: number,
  rebirthCount: number = 0,
): { atk: number; def: number; hp: number; critRate: number; critDmg: number; dodge: number } {
  const t = Math.max(0, Math.min(21, realmTier));
  const rebirthMult = rebirthCount >= 5 ? 2 : 1;

  const lerpPct = (start: number, end: number, hardCap: number) =>
    parseFloat(Math.min((start + (end - start) * (t / 21)) * rebirthMult, hardCap).toFixed(4));

  // 装备基础主属性严格按Sheet1档位比例取值：总属性占比 × 标准人 × 20%
  switch (slot) {
    case 'weapon':
      return { atk: Math.floor(100000000 * ARTIFACT_TIER_TOTAL_RATIO[t] * 0.2 * rebirthMult), def: 0, hp: 0, critRate: 0, critDmg: 0, dodge: 0 };
    case 'chest':
      return { atk: 0, def: 0, hp: Math.floor(1000000000 * ARTIFACT_TIER_TOTAL_RATIO[t] * 0.2 * rebirthMult), critRate: 0, critDmg: 0, dodge: 0 };
    case 'pants':
      return { atk: 0, def: Math.floor(75000000 * ARTIFACT_TIER_TOTAL_RATIO[t] * 0.2 * rebirthMult), hp: 0, critRate: 0, critDmg: 0, dodge: 0 };
    case 'boots':
      return { atk: 0, def: 0, hp: 0, critRate: 0, critDmg: 0,
        dodge: lerpPct(0.002, 0.05, 0.10) };
    case 'accessory':
      return { atk: 0, def: 0, hp: 0,
        critRate: lerpPct(0.002, 0.05, 0.10),
        critDmg:  lerpPct(0.02,  0.50, 1.00),
        dodge: 0 };
    default:
      return { atk: 0, def: 0, hp: 0, critRate: 0, critDmg: 0, dodge: 0 };
  }
}

/** 满级强化倍率增量（按品质），满级倍率 = 1 + 该值 */
const QUALITY_ENHANCE_MAX_BONUS: Record<Quality, number> = {
  white: 1.0, green: 1.5, blue: 2.0,
  purple: 2.5, orange: 3.0, red: 3.5, legend: 4.0,
};

export function getArtifactEnhanceMultiplier(quality: Quality, level: number): number {
  if (level <= 0) return 1;
  const maxLevel = QUALITY_MAX_LEVEL[quality];
  if (maxLevel <= 0) return 1;
  const progress = Math.min(level, maxLevel) / maxLevel;
  return 1 + progress * QUALITY_ENHANCE_MAX_BONUS[quality];
}

export function getArtifactPower(art: ArtifactInstance): number {
  const tmpl = getArtifactTemplate(art.templateId);
  if (!tmpl) return 0;
  const base = getArtifactBaseStats(tmpl.slot, tmpl.realmTier);
  const bonuses = getArtifactBonusesWithoutEnhance(art);
  const power =
    ((base.atk + bonuses.atk) / 100000000) * 1000 +
    ((base.def + bonuses.def) / 75000000) * 1000 +
    ((base.hp + bonuses.hp) / 1000000000) * 1000 +
    ((base.critRate + bonuses.critRate) / 1.0) * 1000 +
    ((base.critDmg + bonuses.critDmg) / 50.0) * 1000 +
    ((base.dodge + bonuses.dodge) / 0.75) * 1000;
  return Math.round(power);
}

export function getArtifactEnhancedBaseStats(
  slot: EquipSlot,
  realmTier: number,
  quality: Quality,
  level: number,
  rebirthCount: number = 0,
): { atk: number; def: number; hp: number; critRate: number; critDmg: number; dodge: number } {
  const base = getArtifactBaseStats(slot, realmTier, rebirthCount);
  const mul = getArtifactEnhanceMultiplier(quality, level);
  return {
    atk: Math.floor(base.atk * mul),
    def: Math.floor(base.def * mul),
    hp: Math.floor(base.hp * mul),
    critRate: parseFloat((base.critRate * mul).toFixed(4)),
    critDmg: parseFloat((base.critDmg * mul).toFixed(4)),
    dodge: parseFloat((base.dodge * mul).toFixed(4)),
  };
}
