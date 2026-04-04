/** 灵石商店系统 */

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  emoji: string;
  /** 基础价格（灵石） */
  basePrice: number;
  /** 每次购买后价格倍率 */
  priceScaling: number;
  /** 每日购买上限 */
  dailyLimit: number;
  /** 奖励类型 */
  rewardType: 'herb' | 'fragment' | 'stamina';
  /** 每次购买获得数量 */
  rewardAmount: number;
}

export const GOLD_SHOP: ShopItem[] = [
  {
    id: 'shop_herb', name: '灵草', description: '从商人处购买灵草',
    emoji: '🌿', basePrice: 10000, priceScaling: 1.5, dailyLimit: 10,
    rewardType: 'herb', rewardAmount: 5,
  },
  {
    id: 'shop_fragment', name: '碎片', description: '购买装备碎片',
    emoji: '💠', basePrice: 50000, priceScaling: 1.3, dailyLimit: 5,
    rewardType: 'fragment', rewardAmount: 10,
  },
  {
    id: 'shop_stamina', name: '体力丹', description: '恢复体力值',
    emoji: '⚡', basePrice: 100000, priceScaling: 2.0, dailyLimit: 3,
    rewardType: 'stamina', rewardAmount: 30,
  },
];

/** 计算当前购买价格 */
export function getShopPrice(item: ShopItem, purchasedToday: number): number {
  return Math.floor(item.basePrice * Math.pow(item.priceScaling, purchasedToday));
}

export function getShopItem(id: string): ShopItem | undefined {
  return GOLD_SHOP.find(i => i.id === id);
}
