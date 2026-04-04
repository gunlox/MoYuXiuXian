import { GameState } from '../data/gameState';
import { GOLD_SHOP, getShopPrice } from '../data/shop';
import { purchaseShopItem, formatNumber } from '../engine/gameEngine';

interface Props {
  gameState: GameState;
  onStateChange: (updater: (prev: GameState) => GameState) => void;
}

export default function GoldShop({ gameState, onStateChange }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const purchases = gameState.shopResetDate === today ? gameState.shopPurchases : {};

  const handleBuy = (itemId: string) => {
    onStateChange(prev => purchaseShopItem(prev, itemId));
  };

  return (
    <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-4 border border-xian-gold/30">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🏪</span>
        <h3 className="text-base font-bold font-kai text-xian-gold/90">灵石商店</h3>
        <span className="text-xs text-xian-gold/50 ml-auto">每日重置</span>
      </div>
      <div className="space-y-2">
        {GOLD_SHOP.map(item => {
          const used = purchases[item.id] || 0;
          const remaining = item.dailyLimit - used;
          const price = getShopPrice(item, used);
          const canBuy = remaining > 0 && gameState.gold >= price;

          return (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg p-3 border border-xian-gold/10 bg-black/20"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{item.emoji}</span>
                <div>
                  <div className="text-sm font-bold text-xian-gold/90">{item.name} x{item.rewardAmount}</div>
                  <div className="text-xs text-xian-gold/60">{item.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right mr-2">
                  <div className="text-xs text-yellow-400 font-bold">💎 {formatNumber(price)}</div>
                  <div className="text-xs text-xian-gold/50">剩余{remaining}次</div>
                </div>
                <button
                  onClick={() => handleBuy(item.id)}
                  disabled={!canBuy}
                  className={`px-3 py-1.5 text-sm rounded-lg font-bold transition-all ${
                    canBuy
                      ? 'bg-yellow-600/40 border border-yellow-500/40 text-yellow-200 hover:bg-yellow-600/60'
                      : 'bg-gray-700/30 border border-gray-600/20 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {remaining <= 0 ? '已售罄' : '购买'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
