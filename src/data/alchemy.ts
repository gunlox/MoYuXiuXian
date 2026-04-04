import { Quality } from './equipment';

// ============ 灵草系统 ============

/** 灵草种类 */
export interface HerbType {
  id: string;
  name: string;
  quality: Quality;
  description: string;
}

export const HERB_TYPES: HerbType[] = [
  { id: 'herb_w1', name: '小还丹草', quality: 'white', description: '最常见的灵草' },
  { id: 'herb_w2', name: '蛇胆草', quality: 'white', description: '蕴含微量蛇毒精华' },
  { id: 'herb_g1', name: '狼血花', quality: 'green', description: '吸收妖兽精血生长' },
  { id: 'herb_g2', name: '迷雾兰', quality: 'green', description: '生于雾中，聚灵之花' },
  { id: 'herb_b1', name: '灵木心', quality: 'blue', description: '千年灵木的精华' },
  { id: 'herb_b2', name: '火灵芝', quality: 'blue', description: '生于火山，性烈温补' },
  { id: 'herb_p1', name: '蛟龙胆', quality: 'purple', description: '蛟龙的胆囊精华' },
  { id: 'herb_p2', name: '龙涎草', quality: 'purple', description: '龙涎滋润的奇草' },
  { id: 'herb_o1', name: '紫雷莲', quality: 'orange', description: '雷域中盛开的莲花' },
  { id: 'herb_r1', name: '混沌灵液', quality: 'red', description: '混沌虚空中凝聚的灵液' },
];

export function getHerbType(id: string): HerbType | undefined {
  return HERB_TYPES.find(h => h.id === id);
}

// ============ 丹药系统 ============

export type PillEffect =
  | { type: 'exp_boost'; multiplier: number; duration: number }            // 修炼加速(倍率, 秒)
  | { type: 'breakthrough_boost'; bonus: number }                          // 突破率提升(一次性)
  | { type: 'atk_boost'; multiplier: number; duration: number }            // 攻击临时增强
  | { type: 'def_boost'; multiplier: number; duration: number }            // 防御临时增强
  | { type: 'all_boost'; multiplier: number; duration: number }            // 全属性临时增强
  | { type: 'stamina_restore'; amount: number }                            // 恢复体力(一次性)
  | { type: 'hp_boost'; multiplier: number; duration: number }             // 生命临时增强
  | { type: 'crit_exp_boost'; expMultiplier: number; critBonus: number; duration: number }; // 暴击率+修炼双加成

/** 丹药配方 */
export interface PillRecipe {
  id: string;
  name: string;
  quality: Quality;
  description: string;
  /** 效果 */
  effect: PillEffect;
  /** 炼丹所需灵草(通用灵草数量) */
  herbCost: number;
  /** 炼丹所需灵石 */
  goldCost: number;
  /** 炼丹成功率 0~1 */
  successRate: number;
  /** 成功产出数量 */
  yield: number;
  /** 需要的最低境界索引才能解锁配方 */
  requiredRealmIndex: number;
  /** 可使用的最高境界索引（可选，超过则无法服用） */
  maxUseRealmIndex?: number;
  /** 突破丹对应境界范围，在此范围内突破加成翻倍 */
  targetBreakthroughRange?: [number, number];
}

/** 玩家持有的丹药 */
export interface PillStack {
  recipeId: string;
  count: number;
}

/** 激活中的buff */
export interface ActiveBuff {
  type: 'exp_boost' | 'atk_boost' | 'def_boost' | 'all_boost' | 'hp_boost' | 'crit_boost';
  multiplier: number;
  remainingSeconds: number;
  sourceName: string;
  /** 来源丹药ID，用于同种丹药合并时间而不同种可共存 */
  recipeId?: string;
}

export const PILL_RECIPES: PillRecipe[] = [
  // ====== 练气期丹药（realmIndex 0~8）======
  {
    id: 'pill_w1', name: '聚灵丹', quality: 'white',
    description: '加速灵气吸收，提升修炼速度',
    effect: { type: 'exp_boost', multiplier: 0.3, duration: 300 },
    herbCost: 3, goldCost: 20, successRate: 0.95, yield: 2, requiredRealmIndex: 0,
  },
  {
    id: 'pill_w3', name: '回春丹', quality: 'white',
    description: '快速恢复体力',
    effect: { type: 'stamina_restore', amount: 20 },
    herbCost: 2, goldCost: 15, successRate: 0.95, yield: 3, requiredRealmIndex: 0,
  },
  {
    id: 'pill_g1', name: '筑基丹', quality: 'green',
    description: '提高突破成功率（仅练气期可用）',
    effect: { type: 'breakthrough_boost', bonus: 0.15 },
    herbCost: 8, goldCost: 100, successRate: 0.85, yield: 1, requiredRealmIndex: 3, maxUseRealmIndex: 8, targetBreakthroughRange: [0, 8],
  },
  {
    id: 'pill_g2', name: '虎力丹', quality: 'green',
    description: '临时提升攻击力',
    effect: { type: 'atk_boost', multiplier: 0.25, duration: 600 },
    herbCost: 6, goldCost: 80, successRate: 0.85, yield: 2, requiredRealmIndex: 3,
  },
  {
    id: 'pill_g3', name: '疾风丹', quality: 'green',
    description: '短时间内大幅提升修炼速度',
    effect: { type: 'exp_boost', multiplier: 0.50, duration: 180 },
    herbCost: 5, goldCost: 60, successRate: 0.85, yield: 2, requiredRealmIndex: 6,
  },
  // ====== 筑基期丹药（realmIndex 9~11）======
  {
    id: 'pill_b5', name: '活力丹', quality: 'blue',
    description: '温补灵气，快速恢复体力',
    effect: { type: 'stamina_restore', amount: 35 },
    herbCost: 10, goldCost: 300, successRate: 0.80, yield: 2, requiredRealmIndex: 9,
  },
  {
    id: 'pill_b1', name: '凝元丹', quality: 'blue',
    description: '大幅提升修炼速度',
    effect: { type: 'exp_boost', multiplier: 0.6, duration: 600 },
    herbCost: 15, goldCost: 500, successRate: 0.75, yield: 2, requiredRealmIndex: 9,
  },
  {
    id: 'pill_b2', name: '金刚丹', quality: 'blue',
    description: '临时提升防御力',
    effect: { type: 'def_boost', multiplier: 0.35, duration: 600 },
    herbCost: 12, goldCost: 400, successRate: 0.75, yield: 2, requiredRealmIndex: 9,
  },
  {
    id: 'pill_b3', name: '破境丹', quality: 'blue',
    description: '显著提高突破成功率（筑基~化神期可用）',
    effect: { type: 'breakthrough_boost', bonus: 0.25 },
    herbCost: 20, goldCost: 800, successRate: 0.70, yield: 1, requiredRealmIndex: 9, maxUseRealmIndex: 20, targetBreakthroughRange: [9, 14],
  },
  // ====== 金丹期丹药（realmIndex 12~14）======
  {
    id: 'pill_b6', name: '灵通丹', quality: 'blue',
    description: '疏通经脉，大幅提升修炼速度',
    effect: { type: 'exp_boost', multiplier: 0.8, duration: 600 },
    herbCost: 20, goldCost: 800, successRate: 0.70, yield: 2, requiredRealmIndex: 12,
  },
  {
    id: 'pill_b7', name: '蛮力丹', quality: 'blue',
    description: '激发潜能，临时大幅提升攻击力',
    effect: { type: 'atk_boost', multiplier: 0.45, duration: 600 },
    herbCost: 18, goldCost: 700, successRate: 0.70, yield: 2, requiredRealmIndex: 12,
  },
  {
    id: 'pill_b4', name: '护体丹', quality: 'blue',
    description: '临时大幅提升生命值',
    effect: { type: 'hp_boost', multiplier: 0.50, duration: 600 },
    herbCost: 18, goldCost: 600, successRate: 0.70, yield: 2, requiredRealmIndex: 12,
  },
  // ====== 元婴期丹药（realmIndex 15~17）======
  {
    id: 'pill_p4', name: '续灵丹', quality: 'purple',
    description: '凝聚灵力，大量恢复体力',
    effect: { type: 'stamina_restore', amount: 50 },
    herbCost: 30, goldCost: 2000, successRate: 0.65, yield: 2, requiredRealmIndex: 15,
  },
  {
    id: 'pill_p5', name: '化元丹', quality: 'purple',
    description: '元婴灵力灌顶，修炼速度飞速提升',
    effect: { type: 'exp_boost', multiplier: 1.0, duration: 900 },
    herbCost: 45, goldCost: 3500, successRate: 0.55, yield: 1, requiredRealmIndex: 15,
  },
  {
    id: 'pill_p1', name: '天元丹', quality: 'purple',
    description: '全属性临时大幅提升',
    effect: { type: 'all_boost', multiplier: 0.40, duration: 900 },
    herbCost: 40, goldCost: 3000, successRate: 0.60, yield: 1, requiredRealmIndex: 15,
  },
  {
    id: 'pill_p6', name: '元婴丹', quality: 'purple',
    description: '稳固元婴，显著提高突破成功率（金丹~化神期可用）',
    effect: { type: 'breakthrough_boost', bonus: 0.30 },
    herbCost: 55, goldCost: 4000, successRate: 0.50, yield: 1, requiredRealmIndex: 15, maxUseRealmIndex: 20, targetBreakthroughRange: [12, 17],
  },
  // ====== 化神期丹药（realmIndex 18~20）======
  {
    id: 'pill_p3', name: '悟道丹', quality: 'purple',
    description: '顿悟战道，提升暴击和修炼速度',
    effect: { type: 'crit_exp_boost', expMultiplier: 0.30, critBonus: 0.05, duration: 900 },
    herbCost: 35, goldCost: 2500, successRate: 0.60, yield: 1, requiredRealmIndex: 18,
  },
  {
    id: 'pill_p7', name: '战神丹', quality: 'purple',
    description: '化神之力灌注，攻击力暴涨',
    effect: { type: 'atk_boost', multiplier: 0.60, duration: 900 },
    herbCost: 45, goldCost: 4000, successRate: 0.55, yield: 1, requiredRealmIndex: 18,
  },
  {
    id: 'pill_o3', name: '归元丹', quality: 'orange',
    description: '仙家秘药，大量恢复体力',
    effect: { type: 'stamina_restore', amount: 80 },
    herbCost: 60, goldCost: 10000, successRate: 0.50, yield: 1, requiredRealmIndex: 18,
  },
  // ====== 渡劫期丹药（realmIndex 21~29）======
  {
    id: 'pill_p2', name: '渡劫丹', quality: 'purple',
    description: '渡劫专用，极大提高突破成功率（仅渡劫期可用）',
    effect: { type: 'breakthrough_boost', bonus: 0.35 },
    herbCost: 50, goldCost: 5000, successRate: 0.55, yield: 1, requiredRealmIndex: 21, maxUseRealmIndex: 29, targetBreakthroughRange: [18, 23],
  },
  {
    id: 'pill_o4', name: '通天丹', quality: 'orange',
    description: '沟通天地灵气，修炼速度飞升',
    effect: { type: 'exp_boost', multiplier: 1.2, duration: 1800 },
    herbCost: 80, goldCost: 20000, successRate: 0.45, yield: 1, requiredRealmIndex: 21,
  },
  {
    id: 'pill_o1', name: '九转金丹', quality: 'orange',
    description: '传说中的仙丹，修炼速度暴增',
    effect: { type: 'exp_boost', multiplier: 1.5, duration: 1800 },
    herbCost: 100, goldCost: 30000, successRate: 0.40, yield: 1, requiredRealmIndex: 21,
  },
  {
    id: 'pill_o2', name: '混元仙丹', quality: 'orange',
    description: '全属性暴增',
    effect: { type: 'all_boost', multiplier: 0.80, duration: 1800 },
    herbCost: 120, goldCost: 50000, successRate: 0.35, yield: 1, requiredRealmIndex: 21,
  },
  {
    id: 'pill_o5', name: '天髓丹', quality: 'orange',
    description: '天地精髓凝聚，完全恢复体力',
    effect: { type: 'stamina_restore', amount: 100 },
    herbCost: 80, goldCost: 25000, successRate: 0.40, yield: 1, requiredRealmIndex: 21,
  },
  {
    id: 'pill_r1', name: '涅槃丹', quality: 'red',
    description: '传说中的神丹，可大幅提升突破成功率',
    effect: { type: 'breakthrough_boost', bonus: 0.50 },
    herbCost: 150, goldCost: 100000, successRate: 0.30, yield: 1, requiredRealmIndex: 24, targetBreakthroughRange: [21, 29],
  },
  {
    id: 'pill_r2', name: '太虚丹', quality: 'red',
    description: '太虚之力加持，全属性暴涨',
    effect: { type: 'all_boost', multiplier: 1.00, duration: 1800 },
    herbCost: 180, goldCost: 150000, successRate: 0.30, yield: 1, requiredRealmIndex: 24,
  },
];

export function getPillRecipe(id: string): PillRecipe | undefined {
  return PILL_RECIPES.find(p => p.id === id);
}

/**
 * 将子境界索引映射到大境界编号（0=练气 1=筑基 2=金丹 3=元婴 4=化神 5=渡劫）
 */
export function getMajorRealmTier(realmIndex: number): number {
  if (realmIndex <= 8)  return 0; // 练气
  if (realmIndex <= 11) return 1; // 筑基
  if (realmIndex <= 14) return 2; // 金丹
  if (realmIndex <= 17) return 3; // 元婴
  if (realmIndex <= 20) return 4; // 化神
  return 5;                       // 渡劫
}

/**
 * 计算丹药在当前境界的效果衰减系数。
 * 规则：玩家大境界每高于丹药设计境界1档，效果累计衰减30%（线性叠加）。
 * 高1档 = 效果×70%，高2档 = 效果×40%，高3档 = 效果×10%，高4档及以上 = 0（无法服用）。
 * 衰减系数 = max(0, 1 - n×0.3)，n 为高出的大境界档数。
 * 返回 0 表示无法服用。
 */
export function getPillDecayFactor(recipe: PillRecipe, playerRealmIndex: number): number {
  const pillTier   = getMajorRealmTier(recipe.requiredRealmIndex);
  const playerTier = getMajorRealmTier(playerRealmIndex);
  const n = playerTier - pillTier;
  if (n <= 0) return 1; // 未高出，无衰减
  const factor = 1 - n * 0.3;
  return factor <= 0 ? 0 : factor;
}

export function getActiveBuffBaseMultiplier(buff: ActiveBuff): number {
  if (!buff.recipeId) return buff.multiplier;
  const recipe = getPillRecipe(buff.recipeId);
  if (!recipe) return buff.multiplier;

  switch (recipe.effect.type) {
    case 'exp_boost':
    case 'atk_boost':
    case 'def_boost':
    case 'all_boost':
    case 'hp_boost':
      return recipe.effect.multiplier;
    case 'crit_exp_boost':
      if (buff.type === 'exp_boost') return recipe.effect.expMultiplier;
      if (buff.type === 'crit_boost') return recipe.effect.critBonus;
      return buff.multiplier;
    default:
      return buff.multiplier;
  }
}

export function getActiveBuffEffectiveMultiplier(buff: ActiveBuff, playerRealmIndex: number): number {
  if (!buff.recipeId) return buff.multiplier;
  const recipe = getPillRecipe(buff.recipeId);
  if (!recipe) return buff.multiplier;
  return getActiveBuffBaseMultiplier(buff) * getPillDecayFactor(recipe, playerRealmIndex);
}

export function getUnlockedRecipes(realmIndex: number): PillRecipe[] {
  return PILL_RECIPES.filter(p => realmIndex >= p.requiredRealmIndex);
}

/** 格式化buff持续时间 */
export function formatDuration(seconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(seconds));
  if (totalSeconds >= 3600) return `${Math.floor(totalSeconds / 3600)}时${Math.floor((totalSeconds % 3600) / 60)}分`;
  if (totalSeconds >= 60) return `${Math.floor(totalSeconds / 60)}分${totalSeconds % 60}秒`;
  return `${totalSeconds}秒`;
}

/** 格式化丹药效果描述 */
export function describePillEffect(effect: PillEffect): string {
  switch (effect.type) {
    case 'exp_boost':
      return `修炼速度+${(effect.multiplier * 100).toFixed(0)}%，持续${formatDuration(effect.duration)}`;
    case 'breakthrough_boost':
      return `突破成功率+${(effect.bonus * 100).toFixed(0)}%（一次性）`;
    case 'atk_boost':
      return `攻击+${(effect.multiplier * 100).toFixed(0)}%，持续${formatDuration(effect.duration)}`;
    case 'def_boost':
      return `防御+${(effect.multiplier * 100).toFixed(0)}%，持续${formatDuration(effect.duration)}`;
    case 'all_boost':
      return `全属性+${(effect.multiplier * 100).toFixed(0)}%，持续${formatDuration(effect.duration)}`;
    case 'stamina_restore':
      return `恢复${effect.amount}点体力（立即生效）`;
    case 'hp_boost':
      return `生命+${(effect.multiplier * 100).toFixed(0)}%，持续${formatDuration(effect.duration)}`;
    case 'crit_exp_boost':
      return `修炼速度+${(effect.expMultiplier * 100).toFixed(0)}%、暴击率+${(effect.critBonus * 100).toFixed(0)}%，持续${formatDuration(effect.duration)}`;
  }
}
