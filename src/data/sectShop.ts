import { SectId } from './sect';

export type SectShopItemCategory = 'fixed' | 'random' | 'sect';

export interface SectShopItem {
  id: string;
  sectId: SectId | 'common';
  name: string;
  cost: number;
  dailyLimit: number;
  totalLimit: number;
  requiredSectLevel: number;
  category: SectShopItemCategory;
  weight: number;
  rewardType: 'pill_random' | 'herb' | 'gold' | 'fragment' | 'artifact_random' | 'tech_random' | 'scroll' | 'stamina' | 'xianyuan' | 'title';
  rewardAmount: number;
}

export const SECT_SHOP_ITEMS: SectShopItem[] = [
  { id: 'shop_pill_random', sectId: 'common', name: '随机丹药×1', cost: 30, dailyLimit: 3, totalLimit: 0, requiredSectLevel: 2, category: 'fixed', weight: 100, rewardType: 'pill_random', rewardAmount: 1 },
  { id: 'shop_herb_50', sectId: 'common', name: '灵草×50', cost: 20, dailyLimit: 5, totalLimit: 0, requiredSectLevel: 2, category: 'fixed', weight: 100, rewardType: 'herb', rewardAmount: 50 },
  { id: 'shop_gold_10000', sectId: 'common', name: '灵石×10000', cost: 25, dailyLimit: 3, totalLimit: 0, requiredSectLevel: 1, category: 'fixed', weight: 100, rewardType: 'gold', rewardAmount: 10000 },
  { id: 'shop_fragment_20', sectId: 'common', name: '碎片×20', cost: 35, dailyLimit: 3, totalLimit: 0, requiredSectLevel: 3, category: 'fixed', weight: 100, rewardType: 'fragment', rewardAmount: 20 },

  { id: 'shop_artifact_random', sectId: 'common', name: '随机装备×1', cost: 100, dailyLimit: 1, totalLimit: 0, requiredSectLevel: 4, category: 'random', weight: 20, rewardType: 'artifact_random', rewardAmount: 1 },
  { id: 'shop_tech_random', sectId: 'common', name: '随机功法书×1', cost: 150, dailyLimit: 1, totalLimit: 0, requiredSectLevel: 5, category: 'random', weight: 15, rewardType: 'tech_random', rewardAmount: 1 },
  { id: 'shop_exp_scroll', sectId: 'common', name: '修炼加速卷轴', cost: 80, dailyLimit: 1, totalLimit: 0, requiredSectLevel: 3, category: 'random', weight: 25, rewardType: 'scroll', rewardAmount: 1 },
  { id: 'shop_drop_scroll', sectId: 'common', name: '寻宝卷轴', cost: 60, dailyLimit: 1, totalLimit: 0, requiredSectLevel: 3, category: 'random', weight: 25, rewardType: 'scroll', rewardAmount: 1 },
  { id: 'shop_bt_scroll', sectId: 'common', name: '破境符', cost: 120, dailyLimit: 1, totalLimit: 0, requiredSectLevel: 4, category: 'random', weight: 20, rewardType: 'scroll', rewardAmount: 1 },
  { id: 'shop_stamina_potion', sectId: 'common', name: '体力药水', cost: 40, dailyLimit: 2, totalLimit: 0, requiredSectLevel: 2, category: 'random', weight: 30, rewardType: 'stamina', rewardAmount: 50 },
  { id: 'shop_xianyuan_1', sectId: 'common', name: '仙缘×1', cost: 500, dailyLimit: 1, totalLimit: 5, requiredSectLevel: 8, category: 'random', weight: 5, rewardType: 'xianyuan', rewardAmount: 1 },
  { id: 'shop_sect_title', sectId: 'common', name: '门派称号', cost: 300, dailyLimit: 0, totalLimit: 1, requiredSectLevel: 10, category: 'random', weight: 3, rewardType: 'title', rewardAmount: 1 },

  { id: 'shop_sword_scroll', sectId: 'sect_sword', name: '剑意卷轴', cost: 100, dailyLimit: 1, totalLimit: 0, requiredSectLevel: 6, category: 'sect', weight: 0, rewardType: 'scroll', rewardAmount: 1 },
  { id: 'shop_pill_scroll', sectId: 'sect_pill', name: '丹道卷轴', cost: 100, dailyLimit: 1, totalLimit: 0, requiredSectLevel: 6, category: 'sect', weight: 0, rewardType: 'scroll', rewardAmount: 1 },
  { id: 'shop_body_scroll', sectId: 'sect_body', name: '锻体卷轴', cost: 100, dailyLimit: 1, totalLimit: 0, requiredSectLevel: 6, category: 'sect', weight: 0, rewardType: 'scroll', rewardAmount: 1 },
  { id: 'shop_spirit_scroll', sectId: 'sect_spirit', name: '悟道卷轴', cost: 100, dailyLimit: 1, totalLimit: 0, requiredSectLevel: 6, category: 'sect', weight: 0, rewardType: 'scroll', rewardAmount: 1 },
  { id: 'shop_fortune_scroll', sectId: 'sect_fortune', name: '福运卷轴', cost: 100, dailyLimit: 1, totalLimit: 0, requiredSectLevel: 6, category: 'sect', weight: 0, rewardType: 'scroll', rewardAmount: 1 },
];

export function getSectShopItem(id: string): SectShopItem | undefined {
  return SECT_SHOP_ITEMS.find(item => item.id === id);
}

export function getSectFixedShopItems(): SectShopItem[] {
  return SECT_SHOP_ITEMS.filter(item => item.category === 'fixed');
}

export function getSectRandomShopItems(sectLevel: number): SectShopItem[] {
  return SECT_SHOP_ITEMS.filter(item => item.category === 'random' && item.requiredSectLevel <= sectLevel);
}

export function getSectSectShopItem(sectId: SectId): SectShopItem | undefined {
  return SECT_SHOP_ITEMS.find(item => item.category === 'sect' && item.sectId === sectId);
}
