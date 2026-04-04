import { SectId } from './sect';

export const SECT_LEVEL_REQUIREMENTS = [0, 100, 250, 500, 900] as const;

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
  | 'offline_bonus';

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
  { id: 'sect_sword_lv2', sectId: 'sect_sword', unlockLevel: 2, name: '剑锋初露', description: '攻击 +5%', effect: { type: 'atk_bonus', value: 0.05 } },
  { id: 'sect_sword_lv4', sectId: 'sect_sword', unlockLevel: 4, name: '破势', description: '暴击率 +3%', effect: { type: 'crit_rate_bonus', value: 0.03 } },
  { id: 'sect_sword_lv5', sectId: 'sect_sword', unlockLevel: 5, name: '一剑绝尘', description: '暴击伤害 +20%', effect: { type: 'crit_dmg_bonus', value: 0.20 } },

  { id: 'sect_pill_lv2', sectId: 'sect_pill', unlockLevel: 2, name: '丹火稳固', description: '炼丹成功率 +5%', effect: { type: 'alchemy_bonus', value: 0.05 } },
  { id: 'sect_pill_lv4', sectId: 'sect_pill', unlockLevel: 4, name: '药养真身', description: '生命 +8%', effect: { type: 'hp_bonus', value: 0.08 } },
  { id: 'sect_pill_lv5', sectId: 'sect_pill', unlockLevel: 5, name: '药灵吐纳', description: '修炼速度 +8%', effect: { type: 'exp_bonus', value: 0.08 } },

  { id: 'sect_body_lv2', sectId: 'sect_body', unlockLevel: 2, name: '铁骨', description: '防御 +5%', effect: { type: 'def_bonus', value: 0.05 } },
  { id: 'sect_body_lv4', sectId: 'sect_body', unlockLevel: 4, name: '百炼真躯', description: '生命 +10%', effect: { type: 'hp_bonus', value: 0.10 } },
  { id: 'sect_body_lv5', sectId: 'sect_body', unlockLevel: 5, name: '不动如山', description: '防御 +8%', effect: { type: 'def_bonus', value: 0.08 } },

  { id: 'sect_spirit_lv2', sectId: 'sect_spirit', unlockLevel: 2, name: '灵台清明', description: '修炼速度 +6%', effect: { type: 'exp_bonus', value: 0.06 } },
  { id: 'sect_spirit_lv4', sectId: 'sect_spirit', unlockLevel: 4, name: '破境心法', description: '突破成功率 +3%', effect: { type: 'breakthrough_bonus', value: 0.03 } },
  { id: 'sect_spirit_lv5', sectId: 'sect_spirit', unlockLevel: 5, name: '神游太虚', description: '离线收益倍率 +5%', effect: { type: 'offline_bonus', value: 0.05 } },

  { id: 'sect_fortune_lv2', sectId: 'sect_fortune', unlockLevel: 2, name: '福缘初显', description: '掉落率 +5%', effect: { type: 'drop_bonus', value: 0.05 } },
  { id: 'sect_fortune_lv4', sectId: 'sect_fortune', unlockLevel: 4, name: '聚财有道', description: '战斗灵石收益 +8%', effect: { type: 'battle_gold_bonus', value: 0.08 } },
  { id: 'sect_fortune_lv5', sectId: 'sect_fortune', unlockLevel: 5, name: '鸿运当头', description: '掉落率 +3%', effect: { type: 'drop_bonus', value: 0.03 } },
];

export function getSectPassives(sectId: SectId): SectPassiveDefinition[] {
  return SECT_PASSIVES.filter(passive => passive.sectId === sectId);
}
