import { SectId } from './sect';

export type SectTaskType =
  | 'kill_count'
  | 'battle_count'
  | 'breakthrough_count'
  | 'alchemy_attempt'
  | 'alchemy_success'
  | 'dungeon_enter'
  | 'dungeon_clear'
  | 'gold_total'
  | 'herb_total'
  | 'artifact_gain'
  | 'technique_gain'
  | 'realm_reach'
  | 'play_time'
  | 'fragment_total';

export type SectTaskCategory = 'daily' | 'growth';

export interface SectTaskDefinition {
  id: string;
  sectId: SectId | 'common';
  category: SectTaskCategory;
  name: string;
  description: string;
  type: SectTaskType;
  target: number;
  rewardContribution: number;
}

export const SECT_TASKS: SectTaskDefinition[] = [
  // ===== 通用日常 =====
  { id: 'daily_kill_20', sectId: 'common', category: 'daily', name: '斩妖除魔', description: '击败 20 只妖兽', type: 'kill_count', target: 20, rewardContribution: 15 },
  { id: 'daily_battle_10', sectId: 'common', category: 'daily', name: '小试身手', description: '完成 10 场胜利战斗', type: 'battle_count', target: 10, rewardContribution: 15 },
  { id: 'daily_breakthrough_1', sectId: 'common', category: 'daily', name: '再进一步', description: '完成 1 次突破', type: 'breakthrough_count', target: 1, rewardContribution: 20 },
  { id: 'daily_alchemy_3', sectId: 'common', category: 'daily', name: '丹炉未熄', description: '尝试炼丹 3 次', type: 'alchemy_attempt', target: 3, rewardContribution: 20 },
  { id: 'daily_gold_50000', sectId: 'common', category: 'daily', name: '聚财有方', description: '累计获得 50000 灵石', type: 'gold_total', target: 50000, rewardContribution: 20 },
  { id: 'daily_artifact_2', sectId: 'common', category: 'daily', name: '搜罗法宝', description: '获得 2 件装备', type: 'artifact_gain', target: 2, rewardContribution: 20 },
  // 新增加通用日常 (P1)
  { id: 'daily_herb_100', sectId: 'common', category: 'daily', name: '采药不辍', description: '累计获得 100 灵草', type: 'herb_total', target: 100, rewardContribution: 20 },
  { id: 'daily_dungeon_2', sectId: 'common', category: 'daily', name: '秘境探幽', description: '进入 2 次秘境', type: 'dungeon_enter', target: 2, rewardContribution: 20 },
  { id: 'daily_alchemy_success_2', sectId: 'common', category: 'daily', name: '丹成有灵', description: '成功炼丹 2 次', type: 'alchemy_success', target: 2, rewardContribution: 20 },
  { id: 'daily_play_1200', sectId: 'common', category: 'daily', name: '静心悟道', description: '累计修炼 20 分钟', type: 'play_time', target: 1200, rewardContribution: 15 },
  { id: 'daily_tech_1', sectId: 'common', category: 'daily', name: '参悟功法', description: '获得 1 本功法', type: 'technique_gain', target: 1, rewardContribution: 25 },
  { id: 'daily_kill_50', sectId: 'common', category: 'daily', name: '斩妖除魔·中', description: '击败 50 只妖兽', type: 'kill_count', target: 50, rewardContribution: 25 },
  { id: 'daily_fragment_10', sectId: 'common', category: 'daily', name: '收集碎片', description: '累计获得 10 个碎片', type: 'fragment_total', target: 10, rewardContribution: 15 },

  // ===== 门派专属日常 =====
  { id: 'daily_sword_kill_30', sectId: 'sect_sword', category: 'daily', name: '剑出无回', description: '击败 30 只妖兽', type: 'kill_count', target: 30, rewardContribution: 20 },
  { id: 'daily_sword_battle_20', sectId: 'sect_sword', category: 'daily', name: '剑出无回·极', description: '完成 20 场胜利战斗', type: 'battle_count', target: 20, rewardContribution: 20 },

  { id: 'daily_pill_alchemy_2', sectId: 'sect_pill', category: 'daily', name: '炉火温养', description: '成功炼丹 2 次', type: 'alchemy_success', target: 2, rewardContribution: 20 },
  { id: 'daily_pill_herb_80', sectId: 'sect_pill', category: 'daily', name: '采药炼丹', description: '累计获得 80 灵草', type: 'herb_total', target: 80, rewardContribution: 20 },

  { id: 'daily_body_dungeon_1', sectId: 'sect_body', category: 'daily', name: '筋骨试炼', description: '进入 1 次秘境', type: 'dungeon_enter', target: 1, rewardContribution: 20 },
  { id: 'daily_body_dungeon_2', sectId: 'sect_body', category: 'daily', name: '磨砺筋骨', description: '进入 2 次秘境', type: 'dungeon_enter', target: 2, rewardContribution: 20 },

  { id: 'daily_spirit_play_600', sectId: 'sect_spirit', category: 'daily', name: '静心悟道', description: '累计修炼 10 分钟', type: 'play_time', target: 600, rewardContribution: 20 },
  { id: 'daily_spirit_break_2', sectId: 'sect_spirit', category: 'daily', name: '不断精进', description: '完成 2 次突破', type: 'breakthrough_count', target: 2, rewardContribution: 25 },

  { id: 'daily_fortune_herb_50', sectId: 'sect_fortune', category: 'daily', name: '福地采撷', description: '累计获得 50 灵草', type: 'herb_total', target: 50, rewardContribution: 20 },
  { id: 'daily_fortune_artifact_5', sectId: 'sect_fortune', category: 'daily', name: '奇遇连连', description: '获得 5 件装备', type: 'artifact_gain', target: 5, rewardContribution: 20 },

  // ===== 门派成长任务（原有） =====
  { id: 'growth_sword_kill_100', sectId: 'sect_sword', category: 'growth', name: '百斩成锋', description: '累计击败 100 只妖兽', type: 'kill_count', target: 100, rewardContribution: 50 },
  { id: 'growth_sword_realm_9', sectId: 'sect_sword', category: 'growth', name: '剑意初成', description: '达到筑基境', type: 'realm_reach', target: 9, rewardContribution: 80 },

  { id: 'growth_pill_alchemy_20', sectId: 'sect_pill', category: 'growth', name: '百炉见真章', description: '尝试炼丹 20 次', type: 'alchemy_attempt', target: 20, rewardContribution: 50 },
  { id: 'growth_pill_success_10', sectId: 'sect_pill', category: 'growth', name: '丹成有灵', description: '成功炼丹 10 次', type: 'alchemy_success', target: 10, rewardContribution: 60 },

  { id: 'growth_body_dungeon_10', sectId: 'sect_body', category: 'growth', name: '踏破险关', description: '累计进入秘境 10 次', type: 'dungeon_enter', target: 10, rewardContribution: 80 },
  { id: 'growth_body_play_3600', sectId: 'sect_body', category: 'growth', name: '锤体如山', description: '累计修炼 1 小时', type: 'play_time', target: 3600, rewardContribution: 50 },

  { id: 'growth_spirit_break_5', sectId: 'sect_spirit', category: 'growth', name: '通玄破境', description: '累计突破 5 次', type: 'breakthrough_count', target: 5, rewardContribution: 60 },
  { id: 'growth_spirit_realm_9', sectId: 'sect_spirit', category: 'growth', name: '初闻大道', description: '达到筑基境', type: 'realm_reach', target: 9, rewardContribution: 80 },

  { id: 'growth_fortune_artifact_10', sectId: 'sect_fortune', category: 'growth', name: '宝光渐盛', description: '累计获得 10 件装备', type: 'artifact_gain', target: 10, rewardContribution: 50 },
  { id: 'growth_fortune_tech_3', sectId: 'sect_fortune', category: 'growth', name: '奇缘连连', description: '累计获得 3 本功法', type: 'technique_gain', target: 3, rewardContribution: 70 },

  // ===== 门派成长任务（新增 P0） =====
  // 剑宗
  { id: 'growth_sword_realm_18', sectId: 'sect_sword', category: 'growth', name: '剑指化神', description: '达到化神境', type: 'realm_reach', target: 18, rewardContribution: 150 },
  { id: 'growth_sword_kill_5000', sectId: 'sect_sword', category: 'growth', name: '万剑诀', description: '累计击败 5000 只妖兽', type: 'kill_count', target: 5000, rewardContribution: 120 },
  { id: 'growth_sword_break_30', sectId: 'sect_sword', category: 'growth', name: '剑气冲天', description: '累计突破 30 次', type: 'breakthrough_count', target: 30, rewardContribution: 100 },

  // 丹宗
  { id: 'growth_pill_success_50', sectId: 'sect_pill', category: 'growth', name: '丹道大成', description: '成功炼丹 50 次', type: 'alchemy_success', target: 50, rewardContribution: 150 },
  { id: 'growth_pill_herb_1000', sectId: 'sect_pill', category: 'growth', name: '灵草如云', description: '累计获得 1000 灵草', type: 'herb_total', target: 1000, rewardContribution: 100 },
  { id: 'growth_pill_success_30', sectId: 'sect_pill', category: 'growth', name: '炉火永燃', description: '成功炼丹 30 次', type: 'alchemy_success', target: 30, rewardContribution: 120 },

  // 体修宗
  { id: 'growth_body_realm_18', sectId: 'sect_body', category: 'growth', name: '肉身化神', description: '达到化神境', type: 'realm_reach', target: 18, rewardContribution: 150 },
  { id: 'growth_body_dungeon_50', sectId: 'sect_body', category: 'growth', name: '百炼千锤', description: '累计进入秘境 50 次', type: 'dungeon_enter', target: 50, rewardContribution: 120 },
  { id: 'growth_body_play_7200', sectId: 'sect_body', category: 'growth', name: '锤体如山', description: '累计修炼 2 小时', type: 'play_time', target: 7200, rewardContribution: 100 },

  // 灵宗
  { id: 'growth_spirit_play_86400', sectId: 'sect_spirit', category: 'growth', name: '道心通明', description: '累计修炼 24 小时', type: 'play_time', target: 86400, rewardContribution: 150 },
  { id: 'growth_spirit_break_20', sectId: 'sect_spirit', category: 'growth', name: '步步登仙', description: '累计突破 20 次', type: 'breakthrough_count', target: 20, rewardContribution: 120 },
  { id: 'growth_spirit_realm_21', sectId: 'sect_spirit', category: 'growth', name: '初窥天道', description: '达到渡劫境', type: 'realm_reach', target: 21, rewardContribution: 100 },

  // 福地宗
  { id: 'growth_fortune_artifact_50', sectId: 'sect_fortune', category: 'growth', name: '宝光冲天', description: '累计获得 50 件装备', type: 'artifact_gain', target: 50, rewardContribution: 150 },
  { id: 'growth_fortune_tech_10', sectId: 'sect_fortune', category: 'growth', name: '万法归宗', description: '累计获得 10 本功法', type: 'technique_gain', target: 10, rewardContribution: 120 },
  { id: 'growth_fortune_gold_10000000', sectId: 'sect_fortune', category: 'growth', name: '富甲一方', description: '累计获得 1000万灵石', type: 'gold_total', target: 10000000, rewardContribution: 100 },
];

export function getSectTaskById(id: string): SectTaskDefinition | undefined {
  return SECT_TASKS.find(task => task.id === id);
}

export function getSectDailyTaskPool(sectId: SectId): SectTaskDefinition[] {
  return SECT_TASKS.filter(task => task.category === 'daily' && (task.sectId === 'common' || task.sectId === sectId));
}

export function getSectGrowthTasks(sectId: SectId): SectTaskDefinition[] {
  return SECT_TASKS.filter(task => task.category === 'growth' && task.sectId === sectId);
}
