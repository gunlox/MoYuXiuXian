import { SectId } from './sect';

export const SECT_LEVEL_REQUIREMENTS: readonly number[] = [
  0,     // Lv.1
  100,   // Lv.2
  250,   // Lv.3
  500,   // Lv.4
  900,   // Lv.5
  1500,  // Lv.6
  2500,  // Lv.7
  4000,  // Lv.8
  6000,  // Lv.9
  10000, // Lv.10
];

export type SectPassiveEffectType =
  | 'atk_bonus'
  | 'def_bonus'
  | 'hp_bonus'
  | 'crit_rate_bonus'
  | 'crit_dmg_bonus'
  | 'exp_bonus'
  | 'alchemy_bonus'
  | 'drop_bonus'
  | 'breakthrough_bonus'
  | 'battle_gold_bonus'
  | 'offline_bonus'
  | 'dungeon_bonus'
  | 'extra_drop_chance'
  | 'double_alchemy_chance'
  | 'low_hp_atk_bonus'
  | 'death_save_chance'
  | 'breakthrough_fail_protect'
  | 'double_tech_chance'
  | 'buff_duration_bonus';

export interface SectPassiveDefinition {
  id: string;
  sectId: SectId;
  unlockLevel: number;
  name: string;
  description: string;
  effect: {
    type: SectPassiveEffectType;
    value: number;
  };
}

export const SECT_PASSIVES: SectPassiveDefinition[] = [
  // ===== 剑宗 =====
  { id: 'sect_sword_lv2', sectId: 'sect_sword', unlockLevel: 2, name: '剑锋初露', description: '攻击 +5%', effect: { type: 'atk_bonus', value: 0.05 } },
  { id: 'sect_sword_lv3', sectId: 'sect_sword', unlockLevel: 3, name: '剑气凝形', description: '攻击 +8%', effect: { type: 'atk_bonus', value: 0.08 } },
  { id: 'sect_sword_lv4', sectId: 'sect_sword', unlockLevel: 4, name: '破势', description: '暴击率 +3%', effect: { type: 'crit_rate_bonus', value: 0.03 } },
  { id: 'sect_sword_lv5', sectId: 'sect_sword', unlockLevel: 5, name: '一剑绝尘', description: '暴击伤害 +25%', effect: { type: 'crit_dmg_bonus', value: 0.25 } },
  { id: 'sect_sword_lv6', sectId: 'sect_sword', unlockLevel: 6, name: '剑魄凝神', description: '暴击率 +5%', effect: { type: 'crit_rate_bonus', value: 0.05 } },
  { id: 'sect_sword_lv7', sectId: 'sect_sword', unlockLevel: 7, name: '斩天拔剑术', description: '攻击 +12%', effect: { type: 'atk_bonus', value: 0.12 } },
  { id: 'sect_sword_lv8', sectId: 'sect_sword', unlockLevel: 8, name: '剑心通明', description: '修炼速度 +5%', effect: { type: 'exp_bonus', value: 0.05 } },
  { id: 'sect_sword_lv9', sectId: 'sect_sword', unlockLevel: 9, name: '万剑朝宗', description: '攻击 +15%', effect: { type: 'atk_bonus', value: 0.15 } },
  { id: 'sect_sword_lv10', sectId: 'sect_sword', unlockLevel: 10, name: '剑开天门', description: '击败妖兽时 10% 概率额外掉落一件装备', effect: { type: 'extra_drop_chance', value: 0.10 } },

  // ===== 丹宗 =====
  { id: 'sect_pill_lv2', sectId: 'sect_pill', unlockLevel: 2, name: '丹火稳固', description: '炼丹成功率 +5%', effect: { type: 'alchemy_bonus', value: 0.05 } },
  { id: 'sect_pill_lv3', sectId: 'sect_pill', unlockLevel: 3, name: '丹心通明', description: '炼丹成功率 +8%', effect: { type: 'alchemy_bonus', value: 0.08 } },
  { id: 'sect_pill_lv4', sectId: 'sect_pill', unlockLevel: 4, name: '药养真身', description: '生命 +8%', effect: { type: 'hp_bonus', value: 0.08 } },
  { id: 'sect_pill_lv5', sectId: 'sect_pill', unlockLevel: 5, name: '药灵吐纳', description: '修炼速度 +10%', effect: { type: 'exp_bonus', value: 0.10 } },
  { id: 'sect_pill_lv6', sectId: 'sect_pill', unlockLevel: 6, name: '丹火纯青', description: '炼丹成功率 +10%', effect: { type: 'alchemy_bonus', value: 0.10 } },
  { id: 'sect_pill_lv7', sectId: 'sect_pill', unlockLevel: 7, name: '药体共生', description: '生命 +12%', effect: { type: 'hp_bonus', value: 0.12 } },
  { id: 'sect_pill_lv8', sectId: 'sect_pill', unlockLevel: 8, name: '丹蕴延年', description: 'Buff 持续上限 +20%', effect: { type: 'buff_duration_bonus', value: 0.20 } },
  { id: 'sect_pill_lv9', sectId: 'sect_pill', unlockLevel: 9, name: '九转还魂', description: '修炼速度 +12%', effect: { type: 'exp_bonus', value: 0.12 } },
  { id: 'sect_pill_lv10', sectId: 'sect_pill', unlockLevel: 10, name: '造化金丹', description: '炼丹时 15% 概率产出双倍', effect: { type: 'double_alchemy_chance', value: 0.15 } },

  // ===== 体修宗 =====
  { id: 'sect_body_lv2', sectId: 'sect_body', unlockLevel: 2, name: '铁骨', description: '防御 +5%', effect: { type: 'def_bonus', value: 0.05 } },
  { id: 'sect_body_lv3', sectId: 'sect_body', unlockLevel: 3, name: '铜皮铁骨', description: '生命 +7%', effect: { type: 'hp_bonus', value: 0.07 } },
  { id: 'sect_body_lv4', sectId: 'sect_body', unlockLevel: 4, name: '百炼真躯', description: '生命 +10%', effect: { type: 'hp_bonus', value: 0.10 } },
  { id: 'sect_body_lv5', sectId: 'sect_body', unlockLevel: 5, name: '不动如山', description: '防御 +10%', effect: { type: 'def_bonus', value: 0.10 } },
  { id: 'sect_body_lv6', sectId: 'sect_body', unlockLevel: 6, name: '钢筋铁骨', description: '生命 +12%', effect: { type: 'hp_bonus', value: 0.12 } },
  { id: 'sect_body_lv7', sectId: 'sect_body', unlockLevel: 7, name: '金刚不坏身', description: '防御 +15%', effect: { type: 'def_bonus', value: 0.15 } },
  { id: 'sect_body_lv8', sectId: 'sect_body', unlockLevel: 8, name: '浴血奋战', description: '战斗开始前 HP<50% 时本场攻击 +15%', effect: { type: 'low_hp_atk_bonus', value: 0.15 } },
  { id: 'sect_body_lv9', sectId: 'sect_body', unlockLevel: 9, name: '肉身成圣', description: '生命 +18%', effect: { type: 'hp_bonus', value: 0.18 } },
  { id: 'sect_body_lv10', sectId: 'sect_body', unlockLevel: 10, name: '不灭金身', description: '受到致命伤害时有 20% 概率保留 1 点生命', effect: { type: 'death_save_chance', value: 0.20 } },

  // ===== 灵宗 =====
  { id: 'sect_spirit_lv2', sectId: 'sect_spirit', unlockLevel: 2, name: '灵台清明', description: '修炼速度 +6%', effect: { type: 'exp_bonus', value: 0.06 } },
  { id: 'sect_spirit_lv3', sectId: 'sect_spirit', unlockLevel: 3, name: '吐纳归真', description: '修炼速度 +8%', effect: { type: 'exp_bonus', value: 0.08 } },
  { id: 'sect_spirit_lv4', sectId: 'sect_spirit', unlockLevel: 4, name: '破境心法', description: '突破成功率 +3%', effect: { type: 'breakthrough_bonus', value: 0.03 } },
  { id: 'sect_spirit_lv5', sectId: 'sect_spirit', unlockLevel: 5, name: '神游太虚', description: '离线收益倍率 +8%', effect: { type: 'offline_bonus', value: 0.08 } },
  { id: 'sect_spirit_lv6', sectId: 'sect_spirit', unlockLevel: 6, name: '天灵感应', description: '修炼速度 +10%', effect: { type: 'exp_bonus', value: 0.10 } },
  { id: 'sect_spirit_lv7', sectId: 'sect_spirit', unlockLevel: 7, name: '破境如虹', description: '突破成功率 +5%', effect: { type: 'breakthrough_bonus', value: 0.05 } },
  { id: 'sect_spirit_lv8', sectId: 'sect_spirit', unlockLevel: 8, name: '灵潮涌动', description: '战斗灵石收益 +10%', effect: { type: 'battle_gold_bonus', value: 0.10 } },
  { id: 'sect_spirit_lv9', sectId: 'sect_spirit', unlockLevel: 9, name: '天人交感', description: '修炼速度 +15%', effect: { type: 'exp_bonus', value: 0.15 } },
  { id: 'sect_spirit_lv10', sectId: 'sect_spirit', unlockLevel: 10, name: '顿悟天机', description: '突破失败时保留 50% 修为', effect: { type: 'breakthrough_fail_protect', value: 0.50 } },

  // ===== 福地宗 =====
  { id: 'sect_fortune_lv2', sectId: 'sect_fortune', unlockLevel: 2, name: '福缘初显', description: '掉落率 +5%', effect: { type: 'drop_bonus', value: 0.05 } },
  { id: 'sect_fortune_lv3', sectId: 'sect_fortune', unlockLevel: 3, name: '福至心灵', description: '秘境奖励 +5%', effect: { type: 'dungeon_bonus', value: 0.05 } },
  { id: 'sect_fortune_lv4', sectId: 'sect_fortune', unlockLevel: 4, name: '聚财有道', description: '战斗灵石收益 +8%', effect: { type: 'battle_gold_bonus', value: 0.08 } },
  { id: 'sect_fortune_lv5', sectId: 'sect_fortune', unlockLevel: 5, name: '鸿运当头', description: '掉落率 +5%', effect: { type: 'drop_bonus', value: 0.05 } },
  { id: 'sect_fortune_lv6', sectId: 'sect_fortune', unlockLevel: 6, name: '天降横财', description: '战斗灵石收益 +12%', effect: { type: 'battle_gold_bonus', value: 0.12 } },
  { id: 'sect_fortune_lv7', sectId: 'sect_fortune', unlockLevel: 7, name: '福星高照', description: '掉落率 +6%', effect: { type: 'drop_bonus', value: 0.06 } },
  { id: 'sect_fortune_lv8', sectId: 'sect_fortune', unlockLevel: 8, name: '聚宝纳福', description: '秘境奖励 +8%', effect: { type: 'dungeon_bonus', value: 0.08 } },
  { id: 'sect_fortune_lv9', sectId: 'sect_fortune', unlockLevel: 9, name: '天道眷顾', description: '掉落率 +8%', effect: { type: 'drop_bonus', value: 0.08 } },
  { id: 'sect_fortune_lv10', sectId: 'sect_fortune', unlockLevel: 10, name: '鸿蒙初开', description: '获得功法时有 20% 概率额外再获得一本', effect: { type: 'double_tech_chance', value: 0.20 } },
];

export function getSectPassives(sectId: SectId): SectPassiveDefinition[] {
  return SECT_PASSIVES.filter(passive => passive.sectId === sectId);
}
