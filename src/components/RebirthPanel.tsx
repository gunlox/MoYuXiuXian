import { useState } from 'react';
import { GameState, addLog, createInitialState } from '../data/gameState';
import {
  canRebirth, calcRebirthReward, REBIRTH_SHOP, RebirthShopItem,
  createInitialPerks,
} from '../data/rebirth';
import { getRealm } from '../data/realms';

interface Props {
  gameState: GameState;
  onStateChange: (updater: (prev: GameState) => GameState) => void;
}

export default function RebirthPanel({ gameState, onStateChange }: Props) {
  const [confirmRebirth, setConfirmRebirth] = useState(false);

  const realmName = getRealm(gameState.realmIndex).name + getRealm(gameState.realmIndex).subLevelName;
  const canDoRebirth = canRebirth(gameState.realmIndex);
  const rewardAmount = calcRebirthReward(gameState.realmIndex, gameState.rebirthCount);
  const perks = gameState.rebirthPerks ?? createInitialPerks();

  // 执行转生
  const doRebirth = () => {
    onStateChange(prev => {
      const reward = calcRebirthReward(prev.realmIndex, prev.rebirthCount);
      const newCount = prev.rebirthCount + 1;
      const newXianyuan = (prev.xianyuan || 0) + reward;

      // 保留：转生次数、仙缘、永久加成、商店购买记录、门派、成就、统计数据、累计修炼时间
      const fresh = createInitialState();
      // 修为保留：expRetain比例
      const retainRate = prev.rebirthPerks?.expRetain || 0;
      const retainedExp = retainRate > 0 ? Math.floor(prev.exp * retainRate) : 0;
      const s: GameState = {
        ...fresh,
        sectId: prev.sectId,
        unlockedAchievements: prev.unlockedAchievements,
        stats: {
          ...prev.stats,
          // 记录最高境界
          maxRealmReached: Math.max(prev.stats?.maxRealmReached || 0, prev.realmIndex),
        },
        totalPlayTime: prev.totalPlayTime, // 保留累计修炼时间
        rebirthCount: newCount,
        xianyuan: newXianyuan,
        rebirthPerks: prev.rebirthPerks ?? createInitialPerks(),
        rebirthShopPurchases: prev.rebirthShopPurchases ?? {},
        gold: (prev.rebirthPerks?.startGold || 0),
        exp: retainedExp,
        logs: [
          `🌟 第${newCount}次轮回！获得${reward}仙缘，重新踏上修仙路…`,
          ...(retainedExp > 0 ? [`📿 修为传承，保留了 ${retainedExp.toFixed(0)} 点修为`] : []),
        ],
      };
      return s;
    });
    setConfirmRebirth(false);
  };

  // 购买商店物品
  const buyItem = (item: RebirthShopItem) => {
    onStateChange(prev => {
      if ((prev.xianyuan || 0) < item.cost) return addLog(prev, '仙缘不足');
      const purchased = prev.rebirthShopPurchases?.[item.id] || 0;
      if (item.maxCount > 0 && purchased >= item.maxCount) return addLog(prev, '已达购买上限');

      const newPerks = { ...(prev.rebirthPerks ?? createInitialPerks()) };
      newPerks[item.effect.key] = (newPerks[item.effect.key] || 0) + item.effect.value;

      const newPurchases = { ...(prev.rebirthShopPurchases ?? {}), [item.id]: purchased + 1 };

      let s = {
        ...prev,
        xianyuan: prev.xianyuan - item.cost,
        rebirthPerks: newPerks,
        rebirthShopPurchases: newPurchases,
      };
      s = addLog(s, `✨ 购买【${item.name}】— ${item.description}`);
      return s;
    });
  };

  // 计算总永久加成百分比（排除startGold/staminaBonus/expRetain等非百分比字段）
  const totalPerkPct = (
    perks.expBonus + perks.atkBonus + perks.defBonus +
    perks.hpBonus + perks.critRateBonus + perks.alchemyBonus + perks.dropBonus +
    (perks.breakthroughBonus ?? 0) + (perks.dungeonBonus ?? 0) + (perks.battleGoldBonus ?? 0)
  ) * 100;

  return (
    <div className="space-y-4">
      {/* 转生信息 */}
      <div className="bg-gradient-to-br from-[#1e1a2e] to-[#16213e] rounded-xl p-4 border border-purple-500/30">
        <div className="flex items-center justify-between mb-3">
          <div className="text-base font-kai text-purple-300">🌟 轮回</div>
          <div className="text-sm text-xian-gold/70">第{gameState.rebirthCount}世</div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div className="bg-black/20 rounded-lg px-3 py-2 flex justify-between">
            <span className="text-xian-gold/80">仙缘</span>
            <span className="text-purple-400 font-bold">{gameState.xianyuan ?? 0}</span>
          </div>
          <div className="bg-black/20 rounded-lg px-3 py-2 flex justify-between">
            <span className="text-xian-gold/80">永久加成</span>
            <span className="text-yellow-400 font-bold">+{totalPerkPct.toFixed(0)}%</span>
          </div>
          <div className="bg-black/20 rounded-lg px-3 py-2 flex justify-between">
            <span className="text-xian-gold/80">当前境界</span>
            <span className="text-xian-gold/80">{realmName}</span>
          </div>
          <div className="bg-black/20 rounded-lg px-3 py-2 flex justify-between">
            <span className="text-xian-gold/80">转生奖励</span>
            <span className={canDoRebirth ? 'text-green-400 font-bold' : 'text-gray-500'}>
              {canDoRebirth ? `+${rewardAmount}仙缘` : '境界不足'}
            </span>
          </div>
        </div>

        {/* 飞升按钮 */}
        {!confirmRebirth ? (
          <button
            onClick={() => canDoRebirth && setConfirmRebirth(true)}
            disabled={!canDoRebirth}
            className={`w-full py-3 rounded-xl font-bold font-kai text-lg transition-all ${
              canDoRebirth
                ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-500 hover:to-pink-400 active:scale-95 glow-pulse text-purple-100'
                : 'bg-gray-700/30 border border-gray-600/20 text-gray-500 cursor-not-allowed'
            }`}
          >
            {canDoRebirth ? `🌟 飞升转生（获得${rewardAmount}仙缘）` : `🔒 需达到渡劫期三层方可飞升`}
          </button>
        ) : (
          <div className="space-y-2">
            <div className="text-center text-sm text-red-400 font-kai">
              ⚠️ 转生将重置境界、灵石、灵草、装备、丹药等所有进度！
              <br />仅保留门派、成就、仙缘和永久加成。
            </div>
            <div className="flex gap-2">
              <button
                onClick={doRebirth}
                className="flex-1 py-2.5 rounded-xl font-bold font-kai bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400 transition-all"
              >
                确认飞升
              </button>
              <button
                onClick={() => setConfirmRebirth(false)}
                className="flex-1 py-2.5 rounded-xl font-kai bg-gray-700/50 text-xian-gold/80 hover:bg-gray-600/50 transition-all"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 永久加成展示 */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-4 border border-xian-gold/30">
        <div className="text-base text-xian-gold/80 font-kai mb-3">💠 永久加成</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {perks.expBonus > 0 && <PerkTag label="修炼速度" value={perks.expBonus} color="text-purple-400" />}
          {perks.atkBonus > 0 && <PerkTag label="攻击" value={perks.atkBonus} color="text-red-400" />}
          {perks.defBonus > 0 && <PerkTag label="防御" value={perks.defBonus} color="text-blue-400" />}
          {perks.hpBonus > 0 && <PerkTag label="生命" value={perks.hpBonus} color="text-green-400" />}
          {perks.critRateBonus > 0 && <PerkTag label="暴击率" value={perks.critRateBonus} color="text-yellow-400" />}
          {perks.alchemyBonus > 0 && <PerkTag label="炼丹成功率" value={perks.alchemyBonus} color="text-orange-400" />}
          {perks.dropBonus > 0 && <PerkTag label="掉落率" value={perks.dropBonus} color="text-yellow-400" />}
          {(perks.breakthroughBonus ?? 0) > 0 && <PerkTag label="突破成功率" value={perks.breakthroughBonus!} color="text-pink-400" />}
          {(perks.dungeonBonus ?? 0) > 0 && <PerkTag label="秘境奖励" value={perks.dungeonBonus!} color="text-teal-400" />}
          {(perks.battleGoldBonus ?? 0) > 0 && <PerkTag label="战斗灵石" value={perks.battleGoldBonus!} color="text-amber-400" />}
          {(perks.staminaBonus ?? 0) > 0 && (
            <div className="bg-black/20 rounded-lg px-3 py-2 flex justify-between">
              <span className="text-xian-gold/80">体力上限</span>
              <span className="text-emerald-400 font-bold">+{Math.floor(perks.staminaBonus!)}</span>
            </div>
          )}
          {(perks.expRetain ?? 0) > 0 && (
            <div className="bg-black/20 rounded-lg px-3 py-2 flex justify-between">
              <span className="text-xian-gold/80">修为传承</span>
              <span className="text-indigo-400 font-bold">{((perks.expRetain!) * 100).toFixed(0)}%</span>
            </div>
          )}
          {perks.startGold > 0 && (
            <div className="bg-black/20 rounded-lg px-3 py-2 flex justify-between">
              <span className="text-xian-gold/80">初始灵石</span>
              <span className="text-yellow-400 font-bold">+{perks.startGold}</span>
            </div>
          )}
          {totalPerkPct === 0 && perks.startGold === 0 && (perks.staminaBonus ?? 0) === 0 && (perks.expRetain ?? 0) === 0 && (
            <div className="col-span-2 text-center text-xian-gold/60 py-2">暂无永久加成</div>
          )}
        </div>
      </div>

      {/* 转生商店 */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-4 border border-xian-gold/30">
        <div className="flex items-center justify-between mb-3">
          <div className="text-base text-xian-gold/80 font-kai">🏪 仙缘商店</div>
          <div className="text-sm text-purple-400">
            仙缘：<span className="font-bold">{gameState.xianyuan ?? 0}</span>
          </div>
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {REBIRTH_SHOP.map(item => {
            const purchased = gameState.rebirthShopPurchases?.[item.id] || 0;
            const maxed = item.maxCount > 0 && purchased >= item.maxCount;
            const canBuy = !maxed && (gameState.xianyuan ?? 0) >= item.cost;

            return (
              <div
                key={item.id}
                className={`rounded-lg p-3 border transition-all ${
                  maxed
                    ? 'border-white/5 bg-black/10 opacity-40'
                    : 'border-purple-500/20 bg-purple-500/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.emoji}</span>
                    <div>
                      <div className="text-base font-bold text-xian-gold/90">{item.name}</div>
                      <div className="text-sm text-xian-gold/70">{item.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right text-xs">
                      <div className="text-purple-400">{item.cost}仙缘</div>
                      {item.maxCount > 0 && (
                        <div className="text-xian-gold/60">{purchased}/{item.maxCount}</div>
                      )}
                    </div>
                    <button
                      onClick={() => buyItem(item)}
                      disabled={!canBuy}
                      className={`px-3 py-1.5 text-sm rounded-lg font-bold transition-all ${
                        canBuy
                          ? 'bg-purple-600/40 border border-purple-500/40 text-purple-200 hover:bg-purple-600/60'
                          : 'bg-gray-700/30 border border-gray-600/20 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {maxed ? '已满' : '购买'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PerkTag({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-black/20 rounded-lg px-3 py-2 flex justify-between">
      <span className="text-xian-gold/80">{label}</span>
      <span className={`${color} font-bold`}>+{(value * 100).toFixed(0)}%</span>
    </div>
  );
}
