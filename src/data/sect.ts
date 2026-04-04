/** 门派系统 */

export interface SectBonus {
  /** 修炼速度加成 */
  expBonus: number;
  /** 攻击加成 */
  atkBonus: number;
  /** 防御加成 */
  defBonus: number;
  /** 生命加成 */
  hpBonus: number;
  /** 暴击率加成(绝对值) */
  critRateBonus: number;
  /** 炼丹成功率加成 */
  alchemyBonus: number;
  /** 战斗掉落率加成 */
  dropBonus: number;
  /** 突破成功率加成（可选） */
  breakthroughBonus?: number;
}

export interface Sect {
  id: string;
  name: string;
  description: string;
  philosophy: string;
  color: string;
  emoji: string;
  bonus: SectBonus;
  /** 初始赠送功法名称（引用equipment中的功法ID） */
  initialTechniqueId: string | null;
}

export const SECTS: Sect[] = [
  {
    id: 'sect_sword', name: '剑宗', emoji: '⚔️',
    description: '以剑入道，攻伐无双',
    philosophy: '天下武功，唯快不破',
    color: 'text-blue-400',
    bonus: { expBonus: 0, atkBonus: 0.15, defBonus: 0, hpBonus: 0, critRateBonus: 0.05, alchemyBonus: 0, dropBonus: 0 },
    initialTechniqueId: 'tech_w3',
  },
  {
    id: 'sect_pill', name: '丹宗', emoji: '🔥',
    description: '以丹证道，炼药通神',
    philosophy: '大道在炉火纯青之间',
    color: 'text-orange-400',
    bonus: { expBonus: 0.05, atkBonus: 0, defBonus: 0, hpBonus: 0.05, critRateBonus: 0, alchemyBonus: 0.15, dropBonus: 0 },
    initialTechniqueId: 'tech_w1',
  },
  {
    id: 'sect_body', name: '体修宗', emoji: '💪',
    description: '锤炼肉身，金刚不坏',
    philosophy: '身若铜墙，拳碎山河',
    color: 'text-yellow-600',
    bonus: { expBonus: 0, atkBonus: 0.05, defBonus: 0.12, hpBonus: 0.12, critRateBonus: 0, alchemyBonus: 0, dropBonus: 0 },
    initialTechniqueId: 'tech_w2',
  },
  {
    id: 'sect_spirit', name: '灵宗', emoji: '✨',
    description: '感悟天地，修炼迅捷',
    philosophy: '与天地同呼吸，修炼自如',
    color: 'text-purple-400',
    bonus: { expBonus: 0.15, atkBonus: 0, defBonus: 0, hpBonus: 0, critRateBonus: 0.03, alchemyBonus: 0, dropBonus: 0, breakthroughBonus: 0.10 },
    initialTechniqueId: 'tech_w5',
  },
  {
    id: 'sect_fortune', name: '福地宗', emoji: '🍀',
    description: '气运加身，奇遇不断',
    philosophy: '福缘深厚，天道眷顾',
    color: 'text-green-400',
    bonus: { expBonus: 0.05, atkBonus: 0, defBonus: 0, hpBonus: 0, critRateBonus: 0, alchemyBonus: 0.05, dropBonus: 0.15 },
    initialTechniqueId: 'tech_w1',
  },
];

export function getSect(id: string): Sect | undefined {
  return SECTS.find(s => s.id === id);
}
