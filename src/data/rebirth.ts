/** 转生（轮回）系统 */

/** 永久加成类型 */
export interface RebirthPerks {
  /** 修炼速度永久加成 */
  expBonus: number;
  /** 攻击永久加成 */
  atkBonus: number;
  /** 防御永久加成 */
  defBonus: number;
  /** 生命永久加成 */
  hpBonus: number;
  /** 暴击率永久加成(绝对值) */
  critRateBonus: number;
  /** 炼丹成功率永久加成 */
  alchemyBonus: number;
  /** 掉落率永久加成 */
  dropBonus: number;
  /** 初始灵石 */
  startGold: number;
  /** 体力上限加成 */
  staminaBonus: number;
  /** 突破成功率永久加成 */
  breakthroughBonus: number;
  /** 秘境奖励永久加成 */
  dungeonBonus: number;
  /** 战斗灵石收益永久加成 */
  battleGoldBonus: number;
  /** 转生时修为保留比例 */
  expRetain: number;
}

export function createInitialPerks(): RebirthPerks {
  return {
    expBonus: 0, atkBonus: 0, defBonus: 0, hpBonus: 0, critRateBonus: 0,
    alchemyBonus: 0, dropBonus: 0, startGold: 0,
    staminaBonus: 0, breakthroughBonus: 0, dungeonBonus: 0,
    battleGoldBonus: 0, expRetain: 0,
  };
}

/** 转生商店物品 */
export interface RebirthShopItem {
  id: string;
  name: string;
  description: string;
  emoji: string;
  cost: number;
  /** 可购买次数上限（0=无限） */
  maxCount: number;
  /** 效果 */
  effect: { key: keyof RebirthPerks; value: number };
}

export const REBIRTH_SHOP: RebirthShopItem[] = [
  {
    id: 'rs_exp_1', name: '悟道残卷', emoji: '📜',
    description: '修炼速度永久+5%',
    cost: 1, maxCount: 20,
    effect: { key: 'expBonus', value: 0.05 },
  },
  {
    id: 'rs_atk_1', name: '杀伐之意', emoji: '⚔️',
    description: '攻击力永久+5%',
    cost: 1, maxCount: 20,
    effect: { key: 'atkBonus', value: 0.05 },
  },
  {
    id: 'rs_def_1', name: '不灭金身', emoji: '🛡️',
    description: '防御力永久+5%',
    cost: 1, maxCount: 20,
    effect: { key: 'defBonus', value: 0.05 },
  },
  {
    id: 'rs_hp_1', name: '长生诀', emoji: '❤️',
    description: '生命值永久+5%',
    cost: 1, maxCount: 20,
    effect: { key: 'hpBonus', value: 0.05 },
  },
  {
    id: 'rs_crit_1', name: '战道顿悟', emoji: '🎯',
    description: '暴击率永久+1%',
    cost: 1, maxCount: 20,
    effect: { key: 'critRateBonus', value: 0.01 },
  },
  {
    id: 'rs_alch_1', name: '丹道传承', emoji: '🔥',
    description: '炼丹成功率永久+3%',
    cost: 2, maxCount: 10,
    effect: { key: 'alchemyBonus', value: 0.03 },
  },
  {
    id: 'rs_drop_1', name: '气运加身', emoji: '🍀',
    description: '掉落率永久+3%',
    cost: 2, maxCount: 10,
    effect: { key: 'dropBonus', value: 0.03 },
  },
  {
    id: 'rs_gold_1', name: '仙人馈赠', emoji: '💰',
    description: '转生后初始灵石+500',
    cost: 1, maxCount: 50,
    effect: { key: 'startGold', value: 500 },
  },
  {
    id: 'rs_stamina_1', name: '体魄强化', emoji: '⚡',
    description: '体力上限永久+5',
    cost: 3, maxCount: 20,
    effect: { key: 'staminaBonus', value: 5 },
  },
  {
    id: 'rs_breakthrough_1', name: '破境之悟', emoji: '🌠',
    description: '突破成功率永久+2%',
    cost: 3, maxCount: 15,
    effect: { key: 'breakthroughBonus', value: 0.02 },
  },
  {
    id: 'rs_dungeon_1', name: '秘境探索者', emoji: '🗺️',
    description: '秘境奖励永久+10%',
    cost: 2, maxCount: 20,
    effect: { key: 'dungeonBonus', value: 0.10 },
  },
  {
    id: 'rs_battle_1', name: '战斗精通', emoji: '⚔️',
    description: '战斗灵石收益永久+10%',
    cost: 2, maxCount: 20,
    effect: { key: 'battleGoldBonus', value: 0.10 },
  },
  {
    id: 'rs_exp_retain', name: '修为传承', emoji: '📿',
    description: '转生时保留5%当前修为',
    cost: 5, maxCount: 10,
    effect: { key: 'expRetain', value: 0.05 },
  },
];

/** 计算转生可获得的仙缘数量（基于当前境界） */
export function calcRebirthReward(realmIndex: number, rebirthCount: number): number {
  // 最低转生境界为渡劫三重(index=23)
  // 基础仙缘 = 3 + 超出最低境界的每一级额外+1
  // 渡劫三重=3, 四重=4, 五重=5, 六重=6, 七重=7, 八重=8, 九重=9
  // 每次转生额外+10%
  const extra = Math.max(0, realmIndex - MIN_REBIRTH_REALM);
  const base = 3 + extra;
  const bonus = 1 + rebirthCount * 0.1;
  return Math.max(1, Math.ceil(base * bonus));
}

/** 判断是否可以转生 */
export function canRebirth(realmIndex: number): boolean {
  // 渡劫期第三层(index=23)才能转生飞升
  return realmIndex >= 23;
}

/** 最低转生境界 */
export const MIN_REBIRTH_REALM = 23;
