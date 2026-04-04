/** 成就系统 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  /** 检查函数用的条件类型 */
  condition: AchievementCondition;
  /** 奖励 */
  reward: AchievementReward;
}

export type AchievementCondition =
  | { type: 'realm_reach'; realmIndex: number }
  | { type: 'kill_count'; count: number }
  | { type: 'breakthrough_count'; count: number }
  | { type: 'play_time'; seconds: number }
  | { type: 'gold_total'; amount: number }
  | { type: 'dungeon_clear'; count: number }
  | { type: 'alchemy_count'; count: number }
  | { type: 'herb_total'; amount: number };

export type AchievementReward =
  | { type: 'gold'; amount: number }
  | { type: 'herb'; amount: number }
  | { type: 'fragment'; amount: number }
  | { type: 'exp'; amount: number };

export const ACHIEVEMENTS: Achievement[] = [
  // === 境界成就 ===
  { id: 'a_realm_3', name: '初窥门径', emoji: '🌱',
    description: '达到练气三层', condition: { type: 'realm_reach', realmIndex: 2 },
    reward: { type: 'gold', amount: 100 } },
  { id: 'a_realm_9', name: '筑基有成', emoji: '🏗️',
    description: '突破至筑基期', condition: { type: 'realm_reach', realmIndex: 9 },
    reward: { type: 'gold', amount: 1000 } },
  { id: 'a_realm_12', name: '金丹大道', emoji: '🔮',
    description: '突破至金丹期', condition: { type: 'realm_reach', realmIndex: 12 },
    reward: { type: 'gold', amount: 5000 } },
  { id: 'a_realm_15', name: '元婴出窍', emoji: '👻',
    description: '突破至元婴期', condition: { type: 'realm_reach', realmIndex: 15 },
    reward: { type: 'gold', amount: 20000 } },
  { id: 'a_realm_21', name: '渡劫飞升', emoji: '⚡',
    description: '突破至渡劫期', condition: { type: 'realm_reach', realmIndex: 21 },
    reward: { type: 'gold', amount: 100000 } },

  // === 战斗成就 ===
  { id: 'a_kill_10', name: '初出茅庐', emoji: '⚔️',
    description: '击杀10只妖兽', condition: { type: 'kill_count', count: 10 },
    reward: { type: 'gold', amount: 50 } },
  { id: 'a_kill_100', name: '小有名气', emoji: '🗡️',
    description: '击杀100只妖兽', condition: { type: 'kill_count', count: 100 },
    reward: { type: 'herb', amount: 10 } },
  { id: 'a_kill_500', name: '妖兽克星', emoji: '💀',
    description: '击杀500只妖兽', condition: { type: 'kill_count', count: 500 },
    reward: { type: 'fragment', amount: 10 } },
  { id: 'a_kill_2000', name: '万妖之敌', emoji: '🔱',
    description: '击杀2000只妖兽', condition: { type: 'kill_count', count: 2000 },
    reward: { type: 'gold', amount: 50000 } },

  // === 突破成就 ===
  { id: 'a_bt_5', name: '勇猛精进', emoji: '📈',
    description: '成功突破5次', condition: { type: 'breakthrough_count', count: 5 },
    reward: { type: 'gold', amount: 200 } },
  { id: 'a_bt_20', name: '百折不挠', emoji: '🔥',
    description: '成功突破20次', condition: { type: 'breakthrough_count', count: 20 },
    reward: { type: 'herb', amount: 20 } },

  // === 修炼时长 ===
  { id: 'a_time_1h', name: '初心不改', emoji: '⏰',
    description: '累计修炼1小时', condition: { type: 'play_time', seconds: 3600 },
    reward: { type: 'gold', amount: 100 } },
  { id: 'a_time_10h', name: '持之以恒', emoji: '🕐',
    description: '累计修炼10小时', condition: { type: 'play_time', seconds: 36000 },
    reward: { type: 'herb', amount: 30 } },
  { id: 'a_time_100h', name: '修仙达人', emoji: '🏆',
    description: '累计修炼100小时', condition: { type: 'play_time', seconds: 360000 },
    reward: { type: 'gold', amount: 100000 } },

  // === 炼丹成就 ===
  { id: 'a_alch_10', name: '初识丹道', emoji: '🧪',
    description: '成功炼丹10次', condition: { type: 'alchemy_count', count: 10 },
    reward: { type: 'herb', amount: 15 } },
  { id: 'a_alch_50', name: '丹道小成', emoji: '⚗️',
    description: '成功炼丹50次', condition: { type: 'alchemy_count', count: 50 },
    reward: { type: 'herb', amount: 50 } },

  // === 秘境成就 ===
  { id: 'a_dg_5', name: '秘境探索者', emoji: '🌀',
    description: '通关秘境5次', condition: { type: 'dungeon_clear', count: 5 },
    reward: { type: 'gold', amount: 2000 } },
  { id: 'a_dg_30', name: '秘境征服者', emoji: '🗺️',
    description: '通关秘境30次', condition: { type: 'dungeon_clear', count: 30 },
    reward: { type: 'fragment', amount: 20 } },

  // === 采集成就 ===
  { id: 'a_herb_50', name: '采药人', emoji: '🌿',
    description: '累计获得50灵草', condition: { type: 'herb_total', amount: 50 },
    reward: { type: 'gold', amount: 500 } },
  { id: 'a_herb_500', name: '灵药大师', emoji: '🌺',
    description: '累计获得500灵草', condition: { type: 'herb_total', amount: 500 },
    reward: { type: 'gold', amount: 10000 } },
  { id: 'a_herb_2000', name: '药王传人', emoji: '🌸',
    description: '累计获得2000灵草', condition: { type: 'herb_total', amount: 2000 },
    reward: { type: 'fragment', amount: 30 } },

  // === 更多境界成就 ===
  { id: 'a_realm_18', name: '化神通玄', emoji: '✨',
    description: '突破至化神期', condition: { type: 'realm_reach', realmIndex: 18 },
    reward: { type: 'gold', amount: 50000 } },
  { id: 'a_realm_27', name: '九重天劫', emoji: '⚡',
    description: '达到渡劫九重天劫', condition: { type: 'realm_reach', realmIndex: 29 },
    reward: { type: 'exp', amount: 100000 } },

  // === 更多战斗成就 ===
  { id: 'a_kill_5000', name: '屠妖魔神', emoji: '👹',
    description: '击杀5000只妖兽', condition: { type: 'kill_count', count: 5000 },
    reward: { type: 'gold', amount: 200000 } },
  { id: 'a_kill_10000', name: '万妖之祸', emoji: '☠️',
    description: '击杀10000只妖兽', condition: { type: 'kill_count', count: 10000 },
    reward: { type: 'fragment', amount: 100 } },

  // === 更多突破成就 ===
  { id: 'a_bt_50', name: '突破大师', emoji: '💫',
    description: '成功突破50次', condition: { type: 'breakthrough_count', count: 50 },
    reward: { type: 'gold', amount: 50000 } },

  // === 更多修炼时长成就 ===
  { id: 'a_time_500h', name: '修仙狂人', emoji: '🌟',
    description: '累计修炼500小时', condition: { type: 'play_time', seconds: 1800000 },
    reward: { type: 'fragment', amount: 50 } },

  // === 更多炼丹成就 ===
  { id: 'a_alch_200', name: '丹道宗师', emoji: '🔮',
    description: '成功炼丹200次', condition: { type: 'alchemy_count', count: 200 },
    reward: { type: 'herb', amount: 150 } },
  { id: 'a_alch_1000', name: '丹圣', emoji: '💊',
    description: '成功炼丹1000次', condition: { type: 'alchemy_count', count: 1000 },
    reward: { type: 'gold', amount: 300000 } },

  // === 更多秘境成就 ===
  { id: 'a_dg_100', name: '秘境探险家', emoji: '🧭',
    description: '通关秘境100次', condition: { type: 'dungeon_clear', count: 100 },
    reward: { type: 'gold', amount: 100000 } },
  { id: 'a_dg_500', name: '秘境之主', emoji: '👑',
    description: '通关秘境500次', condition: { type: 'dungeon_clear', count: 500 },
    reward: { type: 'fragment', amount: 80 } },

  // === 财富成就 ===
  { id: 'a_gold_100k', name: '小富即安', emoji: '💰',
    description: '累计获得10万灵石', condition: { type: 'gold_total', amount: 100000 },
    reward: { type: 'herb', amount: 50 } },
  { id: 'a_gold_1m', name: '富甲一方', emoji: '💎',
    description: '累计获得100万灵石', condition: { type: 'gold_total', amount: 1000000 },
    reward: { type: 'fragment', amount: 50 } },
  { id: 'a_gold_10m', name: '财富之神', emoji: '🏛️',
    description: '累计获得1000万灵石', condition: { type: 'gold_total', amount: 10000000 },
    reward: { type: 'gold', amount: 500000 } },
];

/** 统计数据结构 */
export interface GameStats {
  totalGoldEarned: number;
  totalHerbsEarned: number;
  alchemySuccessCount: number;
  alchemyFailCount: number;
  dungeonClearCount: number;
  dungeonEnterCount: number;
  maxRealmReached: number;
}

export function createInitialStats(): GameStats {
  return {
    totalGoldEarned: 0,
    totalHerbsEarned: 0,
    alchemySuccessCount: 0,
    alchemyFailCount: 0,
    dungeonClearCount: 0,
    dungeonEnterCount: 0,
    maxRealmReached: 0,
  };
}

/** 检查成就是否达成 */
export function checkAchievement(
  ach: Achievement,
  realmIndex: number,
  killCount: number,
  breakthroughCount: number,
  totalPlayTime: number,
  stats: GameStats
): boolean {
  const c = ach.condition;
  switch (c.type) {
    case 'realm_reach': return realmIndex >= c.realmIndex;
    case 'kill_count': return killCount >= c.count;
    case 'breakthrough_count': return breakthroughCount >= c.count;
    case 'play_time': return totalPlayTime >= c.seconds;
    case 'gold_total': return stats.totalGoldEarned >= c.amount;
    case 'dungeon_clear': return stats.dungeonClearCount >= c.count;
    case 'alchemy_count': return stats.alchemySuccessCount >= c.count;
    case 'herb_total': return stats.totalHerbsEarned >= c.amount;
  }
}
