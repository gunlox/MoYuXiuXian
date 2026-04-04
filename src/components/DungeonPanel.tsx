import { useState } from 'react';
import { GameState, addLog } from '../data/gameState';
import {
  DUNGEON_TEMPLATES, getDungeonTemplate,
  exploreFloor, ExploreResult, DungeonTemplate,
  genClearBonus, calcSweepRewards, ExploreReward,
  SWEEP_STAMINA_DISCOUNT, PlayerPower,
} from '../data/dungeon';
import { getMajorRealmTier } from '../data/alchemy';
import { formatNumber } from '../engine/gameEngine';
import { getRealm } from '../data/realms';
import { calcFinalAttributes, getDungeonBonus, getStaminaMax, getStaminaRegen } from '../engine/attributeCalc';
import { updateSectTaskProgress } from '../engine/sectEngine';

/** 福地宗被动：秘境每日次数+1 */
function getEffectiveDailyLimit(dg: DungeonTemplate, sectId: string | null): number {
  return dg.dailyLimit + (sectId === 'sect_fortune' ? 1 : 0);
}

interface Props {
  gameState: GameState;
  onStateChange: (updater: (prev: GameState) => GameState) => void;
}

/** 将奖励应用到 GameState（含丹药） */
function applyRewards(state: GameState, rewards: ExploreReward[]): GameState {
  let s = state;
  for (const r of rewards) {
    switch (r.type) {
      case 'gold': s = { ...s, gold: s.gold + r.amount }; break;
      case 'exp': s = { ...s, exp: s.exp + r.amount }; break;
      case 'herb': s = { ...s, herbs: s.herbs + r.amount }; break;
      case 'fragment': s = { ...s, fragments: s.fragments + r.amount }; break;
      case 'pill': {
        if (!r.pillRecipeId) break;
        const pills = [...s.pills];
        const existing = pills.findIndex(p => p.recipeId === r.pillRecipeId);
        if (existing >= 0) {
          pills[existing] = { ...pills[existing], count: pills[existing].count + r.amount };
        } else {
          pills.push({ recipeId: r.pillRecipeId!, count: r.amount });
        }
        s = { ...s, pills };
        break;
      }
    }
  }
  return s;
}

/** 构建玩家属性快照 */
function buildPlayerPower(state: GameState): PlayerPower {
  const attrs = calcFinalAttributes(state);
  return { attack: attrs.attack, defense: attrs.defense, hp: attrs.hp, realmIndex: state.realmIndex };
}

/** 大境界分组名称 */
const MAJOR_REALM_LABELS = ['练气', '筑基', '金丹', '元婴', '化神', '渡劫'];

export default function DungeonPanel({ gameState, onStateChange }: Props) {
  const [activeDungeon, setActiveDungeon] = useState<string | null>(null);
  const [currentFloor, setCurrentFloor] = useState(0);
  const [exploring, setExploring] = useState(false);
  const [floorResults, setFloorResults] = useState<ExploreResult[]>([]);
  const [dungeonComplete, setDungeonComplete] = useState(false);
  const [clearBonusRewards, setClearBonusRewards] = useState<ExploreReward[] | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const maxStamina = getStaminaMax(gameState);
  const regenRate = getStaminaRegen(gameState);
  const staminaPct = Math.min(100, Math.floor(((gameState.stamina ?? maxStamina) / maxStamina) * 100));

  const today = new Date().toISOString().slice(0, 10);
  const dailyCounts = gameState.dungeonResetDate === today ? gameState.dungeonDailyCounts : {};
  const firstClears = (gameState.dungeonResetDate === today ? gameState.dungeonFirstClears : {}) ?? {};

  const playerPower = buildPlayerPower(gameState);

  // 找到当前境界推荐秘境（已解锁的最高级别秘境）
  const unlockedList = DUNGEON_TEMPLATES.filter(dg =>
    gameState.realmIndex >= dg.requiredRealmIndex &&
    (dg.requiredRebirthCount === undefined || (gameState.rebirthCount ?? 0) >= dg.requiredRebirthCount)
  );
  const recommendedId = unlockedList.length > 0 ? unlockedList[unlockedList.length - 1].id : null;

  // 按大境界分组
  const groupedDungeons: { label: string; tierKey: string; dungeons: DungeonTemplate[] }[] = [];
  const seen = new Set<string>();
  for (const dg of DUNGEON_TEMPLATES) {
    const tier = getMajorRealmTier(dg.requiredRealmIndex);
    const key = dg.requiredRebirthCount ? `rebirth_${dg.requiredRebirthCount}` : `tier_${tier}`;
    if (!seen.has(key)) {
      seen.add(key);
      const label = dg.requiredRebirthCount
        ? `${dg.requiredRebirthCount}转专属`
        : `${MAJOR_REALM_LABELS[tier] ?? '未知'}期`;
      groupedDungeons.push({ label, tierKey: key, dungeons: [] });
    }
    groupedDungeons.find(g => g.tierKey === key)?.dungeons.push(dg);
  }

  // 默认折叠：低于当前大境界的分组自动折叠
  const playerTier = getMajorRealmTier(gameState.realmIndex);

  const isGroupCollapsed = (tierKey: string): boolean => {
    if (collapsedGroups[tierKey] !== undefined) return collapsedGroups[tierKey];
    // 自动折叠低级分组
    const match = tierKey.match(/^tier_(\d+)$/);
    if (match) return parseInt(match[1]) < playerTier;
    return false;
  };

  const toggleGroup = (tierKey: string) => {
    setCollapsedGroups(prev => ({ ...prev, [tierKey]: !isGroupCollapsed(tierKey) }));
  };

  // 进入秘境
  const enterDungeon = (dg: DungeonTemplate) => {
    const used = dailyCounts[dg.id] || 0;
    if (used >= getEffectiveDailyLimit(dg, gameState.sectId)) return;
    if ((gameState.stamina ?? 0) < dg.staminaCost) return;

    onStateChange(prev => {
      const newCounts = { ...(prev.dungeonResetDate === today ? prev.dungeonDailyCounts : {}), [dg.id]: (dailyCounts[dg.id] || 0) + 1 };
      const stats = { ...prev.stats, dungeonEnterCount: (prev.stats?.dungeonEnterCount || 0) + 1 };
      let s = { ...prev, stamina: prev.stamina - dg.staminaCost, dungeonDailyCounts: newCounts, dungeonResetDate: today, stats };
      s = updateSectTaskProgress(s, { type: 'dungeon_enter', count: 1 });
      s = addLog(s, `🌀 进入秘境【${dg.name}】`);
      return s;
    });

    setActiveDungeon(dg.id);
    setCurrentFloor(1);
    setFloorResults([]);
    setExploring(true);
    setDungeonComplete(false);
    setClearBonusRewards(null);
  };

  // 探索下一层
  const exploreNext = () => {
    if (!activeDungeon) return;
    const dg = getDungeonTemplate(activeDungeon);
    if (!dg) return;

    const result = exploreFloor(dg, currentFloor, getDungeonBonus(gameState), playerPower);

    // 应用奖励和伤害
    onStateChange(prev => {
      let s = { ...prev };
      if (result.damage !== 0) {
        const newStamina = s.stamina - result.damage;
        const curMax = getStaminaMax(s);
        s = { ...s, stamina: Math.min(curMax, Math.max(0, newStamina)) };
      }
      s = applyRewards(s, result.rewards);
      return s;
    });

    setFloorResults(prev => [...prev, result]);

    const staminaAfter = Math.max(0, (gameState.stamina ?? 0) - (result.damage > 0 ? result.damage : 0));
    const forceStop = staminaAfter <= 0 && result.damage > 0;

    if (!result.completed || currentFloor >= dg.totalFloors || forceStop) {
      setExploring(false);
      setDungeonComplete(true);
      const cleared = currentFloor >= dg.totalFloors && result.completed;

      if (cleared) {
        // 通关额外奖励
        const bonus = genClearBonus(dg, getDungeonBonus(gameState));
        setClearBonusRewards(bonus);
        onStateChange(prev => {
          let s = applyRewards(prev, bonus);
          const stats = { ...s.stats, dungeonClearCount: (s.stats?.dungeonClearCount || 0) + 1 };
          s = { ...s, stats };
          s = updateSectTaskProgress(s, { type: 'dungeon_clear', count: 1 });
          // 记录首通
          const fc = { ...(s.dungeonFirstClears ?? {}), [dg.id]: true };
          s = { ...s, dungeonFirstClears: fc };
          return addLog(s, `✨ 秘境【${dg.name}】探索完成！获得通关奖励！`);
        });
      } else {
        onStateChange(prev =>
          addLog(prev,
            forceStop
              ? `😵 体力耗尽，被迫退出秘境【${dg.name}】第${currentFloor}层`
              : `💀 秘境【${dg.name}】探索中止于第${currentFloor}层`
          )
        );
      }
    } else {
      setCurrentFloor(prev => prev + 1);
    }
  };

  // 一键扫荡
  const sweepDungeon = (dg: DungeonTemplate) => {
    const sweepCost = Math.floor(dg.staminaCost * SWEEP_STAMINA_DISCOUNT);
    const used = dailyCounts[dg.id] || 0;
    if (used >= getEffectiveDailyLimit(dg, gameState.sectId)) return;
    if ((gameState.stamina ?? 0) < sweepCost) return;
    if (!firstClears[dg.id]) return; // 当日未首通不可扫荡

    const rewards = calcSweepRewards(dg, getDungeonBonus(gameState));

    onStateChange(prev => {
      const newCounts = { ...(prev.dungeonResetDate === today ? prev.dungeonDailyCounts : {}), [dg.id]: (dailyCounts[dg.id] || 0) + 1 };
      const stats = {
        ...prev.stats,
        dungeonEnterCount: (prev.stats?.dungeonEnterCount || 0) + 1,
        dungeonClearCount: (prev.stats?.dungeonClearCount || 0) + 1,
      };
      let s = { ...prev, stamina: prev.stamina - sweepCost, dungeonDailyCounts: newCounts, dungeonResetDate: today, stats };
      s = applyRewards(s, rewards);
      s = updateSectTaskProgress(s, { type: 'dungeon_enter', count: 1 });
      s = updateSectTaskProgress(s, { type: 'dungeon_clear', count: 1 });
      const rewardText = rewards.map(r => `${r.name}+${formatNumber(r.amount)}`).join('、');
      s = addLog(s, `⚡ 扫荡秘境【${dg.name}】完成！获得：${rewardText}`);
      return s;
    });
  };

  // 退出秘境
  const exitDungeon = () => {
    setActiveDungeon(null);
    setCurrentFloor(0);
    setFloorResults([]);
    setExploring(false);
    setDungeonComplete(false);
    setClearBonusRewards(null);
  };

  // ============ 渲染：正在探索中 ============
  if (activeDungeon) {
    const dg = getDungeonTemplate(activeDungeon);
    if (!dg) return null;

    return (
      <div className="space-y-3">
        {/* 秘境头部 */}
        <div className="bg-gradient-to-br from-[#1e1a2e] to-[#16213e] rounded-xl p-4 border border-purple-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="text-base font-kai text-purple-300">🌀 {dg.name}</div>
            <div className="text-sm text-xian-gold/70">
              第 <span className="text-purple-400 font-bold">{exploring ? currentFloor : floorResults.length}</span> / {dg.totalFloors} 层
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xian-gold/80">体力</span>
            <div className="flex-1 bg-black/30 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                style={{ width: `${staminaPct}%` }}
              />
            </div>
            <span className="text-green-400">{Math.floor(gameState.stamina ?? 0)}/{maxStamina}</span>
          </div>
        </div>

        {/* 探索日志 */}
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-4 border border-xian-gold/20">
          <div className="text-sm text-xian-gold/80 mb-2">探索记录</div>
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {floorResults.map((r, i) => (
              <div key={i} className={`rounded-lg p-3 border text-base ${getEventStyle(r.eventType)}`}>
                <div className="font-bold mb-1">{r.title}</div>
                <div className="text-sm text-xian-gold/80 mb-1">{r.description}</div>
                {r.rewards.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-sm">
                    {r.rewards.map((rw, j) => (
                      <span key={j} className={`bg-black/20 rounded px-2 py-0.5 ${rw.type === 'pill' ? 'text-yellow-400' : 'text-green-400'}`}>
                        +{formatNumber(rw.amount)} {rw.name}
                      </span>
                    ))}
                  </div>
                )}
                {r.damage > 0 && (
                  <div className="text-sm text-red-400 mt-1">体力 -{r.damage}</div>
                )}
                {r.damage < 0 && (
                  <div className="text-sm text-green-400 mt-1">体力 +{Math.abs(r.damage)}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 通关额外奖励 */}
        {clearBonusRewards && (
          <div className="bg-gradient-to-br from-[#2a1f0e] to-[#1a1a2e] rounded-xl p-4 border border-yellow-500/40">
            <div className="text-sm text-yellow-400 font-bold mb-2">🎁 通关奖励宝箱</div>
            <div className="flex flex-wrap gap-2 text-sm">
              {clearBonusRewards.map((rw, j) => (
                <span key={j} className={`bg-black/20 rounded px-2 py-0.5 ${rw.type === 'pill' ? 'text-yellow-400' : 'text-green-400'}`}>
                  +{formatNumber(rw.amount)} {rw.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2">
          {exploring && (
            <button
              onClick={exploreNext}
              className="flex-1 py-3 rounded-xl font-bold font-kai text-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400 transition-all active:scale-95"
            >
              ⚡ 探索第{currentFloor}层
            </button>
          )}
          {dungeonComplete && (
            <div className="flex-1 text-center py-3 rounded-xl font-kai text-lg bg-black/20 border border-xian-gold/20 text-xian-gold/60">
              {clearBonusRewards ? '🎉 秘境通关！' : '💀 探索中止'}
            </div>
          )}
          <button
            onClick={exitDungeon}
            className="px-6 py-3 rounded-xl font-kai bg-gray-700/50 text-xian-gold/80 hover:bg-gray-600/50 transition-all"
          >
            🚪 离开
          </button>
        </div>
      </div>
    );
  }

  // ============ 渲染：秘境选择 ============
  return (
    <div className="space-y-4">
      {/* 体力显示 */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-4 border border-xian-gold/30">
        <div className="flex items-center justify-between mb-2">
          <div className="text-base text-xian-gold/80 font-kai">⚡ 体力</div>
          <div className="text-sm">
            <span className="text-green-400 font-bold">{Math.floor(gameState.stamina ?? 0)}</span>
            <span className="text-xian-gold/70">/{maxStamina}</span>
          </div>
        </div>
        <div className="bg-black/30 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
            style={{ width: `${staminaPct}%` }}
          />
        </div>
        <div className="text-xs text-xian-gold/60 mt-1 text-right">
          {regenRate.toFixed(2)}/秒 · 约{Math.ceil(Math.max(0, maxStamina - (gameState.stamina ?? 0)) / regenRate / 60)}分钟恢复满
        </div>
      </div>

      {/* 秘境列表（按大境界分组） */}
      {groupedDungeons.map(group => {
        const hasUnlocked = group.dungeons.some(dg =>
          gameState.realmIndex >= dg.requiredRealmIndex &&
          (dg.requiredRebirthCount === undefined || (gameState.rebirthCount ?? 0) >= dg.requiredRebirthCount)
        );
        if (!hasUnlocked) return null; // 整组未解锁则隐藏

        const collapsed = isGroupCollapsed(group.tierKey);

        return (
          <div key={group.tierKey} className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl border border-xian-gold/30 overflow-hidden">
            {/* 分组标题（可折叠） */}
            <button
              onClick={() => toggleGroup(group.tierKey)}
              className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-white/5 transition-all"
            >
              <span className="text-base text-xian-gold/80 font-kai">
                🌀 {group.label}秘境
              </span>
              <span className="text-xian-gold/50 text-sm">
                {collapsed ? '▸ 展开' : '▾ 收起'}
              </span>
            </button>

            {/* 秘境卡片列表 */}
            {!collapsed && (
              <div className="px-5 pb-4 space-y-2">
                {group.dungeons.map(dg => {
                  const unlocked = gameState.realmIndex >= dg.requiredRealmIndex &&
                    (dg.requiredRebirthCount === undefined || (gameState.rebirthCount ?? 0) >= dg.requiredRebirthCount);
                  const used = dailyCounts[dg.id] || 0;
                  const effectiveLimit = getEffectiveDailyLimit(dg, gameState.sectId);
                  const canEnter = unlocked && used < effectiveLimit && (gameState.stamina ?? 0) >= dg.staminaCost;
                  const isRecommended = dg.id === recommendedId;
                  const hasFirstClear = !!firstClears[dg.id];
                  const sweepCost = Math.floor(dg.staminaCost * SWEEP_STAMINA_DISCOUNT);
                  const canSweep = unlocked && hasFirstClear && used < effectiveLimit && (gameState.stamina ?? 0) >= sweepCost;

                  return (
                    <div
                      key={dg.id}
                      className={`rounded-lg p-4 border transition-all ${
                        unlocked
                          ? isRecommended
                            ? 'border-yellow-500/50 bg-yellow-500/5 ring-1 ring-yellow-500/20'
                            : 'border-purple-500/30 bg-purple-500/5 hover:border-purple-400/50'
                          : 'border-white/5 bg-black/10 opacity-40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold font-kai ${unlocked ? (isRecommended ? 'text-yellow-300' : 'text-purple-300') : 'text-gray-600'}`}>
                            {unlocked ? `🌀 ${dg.name}` : '🔒 ???'}
                          </span>
                          {isRecommended && unlocked && (
                            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/30">
                              推荐
                            </span>
                          )}
                          {hasFirstClear && unlocked && (
                            <span className="text-xs text-green-400/70">✓已通关</span>
                          )}
                        </div>
                        {unlocked && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => enterDungeon(dg)}
                              disabled={!canEnter}
                              className={`px-3 py-1.5 text-sm rounded-lg font-bold transition-all ${
                                canEnter
                                  ? 'bg-purple-600/40 border border-purple-500/40 text-purple-200 hover:bg-purple-600/60'
                                  : 'bg-gray-700/30 border border-gray-600/20 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              探索
                            </button>
                            {hasFirstClear && (
                              <button
                                onClick={() => sweepDungeon(dg)}
                                disabled={!canSweep}
                                className={`px-3 py-1.5 text-sm rounded-lg font-bold transition-all ${
                                  canSweep
                                    ? 'bg-cyan-600/40 border border-cyan-500/40 text-cyan-200 hover:bg-cyan-600/60'
                                    : 'bg-gray-700/30 border border-gray-600/20 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                扫荡
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {unlocked ? (
                        <>
                          <div className="text-sm text-xian-gold/70 mb-2">{dg.description}</div>
                          <div className="flex flex-wrap gap-3 text-xs text-xian-gold/70">
                            <span>🧘 {getRealm(dg.requiredRealmIndex).subLevelName}</span>
                            <span>🏛️ {dg.totalFloors}层</span>
                            <span>⚡ {dg.staminaCost}{hasFirstClear ? ` / 扫荡${sweepCost}` : ''}</span>
                            <span>📅 {used}/{effectiveLimit}次</span>
                            <span>👹 Boss x{dg.bossFloors.length}</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">需要：{getRealm(dg.requiredRealmIndex).subLevelName}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function getEventStyle(type: string): string {
  switch (type) {
    case 'treasure': return 'border-yellow-500/30 bg-yellow-500/5';
    case 'trap': return 'border-red-500/30 bg-red-500/5';
    case 'encounter': return 'border-blue-500/30 bg-blue-500/5';
    case 'boss': return 'border-orange-500/30 bg-orange-500/5';
    case 'spring': return 'border-cyan-500/30 bg-cyan-500/5';
    default: return 'border-white/10 bg-white/5';
  }
}
