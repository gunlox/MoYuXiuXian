import { useState } from 'react';
import { GameState, addLog } from '../data/gameState';
import {
  PILL_RECIPES, getUnlockedRecipes, getPillRecipe,
  describePillEffect, formatDuration,
  getPillDecayFactor, getMajorRealmTier,
  getActiveBuffEffectiveMultiplier,
  PillRecipe,
} from '../data/alchemy';
import {
  QUALITY_COLORS, QUALITY_BORDER, QUALITY_BG, QUALITY_NAMES,
} from '../data/equipment';
import { formatNumber } from '../engine/gameEngine';
import { getAlchemyBonus, getStaminaMax } from '../engine/attributeCalc';
import { getRealm } from '../data/realms';
import { updateSectTaskProgress } from '../engine/sectEngine';

interface Props {
  gameState: GameState;
  onStateChange: (updater: (prev: GameState) => GameState) => void;
}

const MAJOR_REALM_LABELS = ['练气期', '筑基期', '金丹期', '元婴期', '化神期', '渡劫期'] as const;

export default function AlchemyPanel({ gameState, onStateChange }: Props) {
  const [showBuffFullAlert, setShowBuffFullAlert] = useState(false);
  const [showDecayZeroAlert, setShowDecayZeroAlert] = useState(false);
  const unlockedRecipes = getUnlockedRecipes(gameState.realmIndex);
  const MAX_BUFF_DURATION = 12 * 3600;
  const BUFF_FULL_THRESHOLD = MAX_BUFF_DURATION - 100;

  const getPillUseBlockReason = (state: GameState, recipe: PillRecipe) => {
    if (recipe.maxUseRealmIndex !== undefined && state.realmIndex > recipe.maxUseRealmIndex) return 'realm_too_high';

    const targetStack = state.pills.find(p => p.recipeId === recipe.id);
    if (!targetStack || targetStack.count <= 0) return 'insufficient';

    const decayFactor = getPillDecayFactor(recipe, state.realmIndex);
    if (decayFactor <= 0) return 'decay_zero';

    const effType = recipe.effect.type;
    if (effType !== 'breakthrough_boost' && effType !== 'stamina_restore') {
      const existingBuff = (state.buffs || []).find(b => b.recipeId === recipe.id);
      if (existingBuff && existingBuff.remainingSeconds >= BUFF_FULL_THRESHOLD) return 'buff_full';
    }

    return null;
  };

  const getRecipeRealmHint = (recipe: PillRecipe) => {
    const startLabel = MAJOR_REALM_LABELS[getMajorRealmTier(recipe.requiredRealmIndex)] ?? getRealm(recipe.requiredRealmIndex).name;
    if (recipe.maxUseRealmIndex !== undefined) {
      const endLabel = MAJOR_REALM_LABELS[getMajorRealmTier(recipe.maxUseRealmIndex)] ?? getRealm(recipe.maxUseRealmIndex).name;
      return startLabel === endLabel
        ? `适用境界：${startLabel}`
        : `适用境界：${startLabel}~${endLabel}`;
    }
    return `推荐境界：${startLabel}起使用`;
  };

  const applyPillUse = (prev: GameState, recipe: PillRecipe, shouldLog: boolean) => {
    const blockReason = getPillUseBlockReason(prev, recipe);
    if (blockReason === 'realm_too_high') {
      return { state: addLog(prev, `当前境界过高，无法服用【${recipe.name}】`), consumed: false };
    }
    if (blockReason === 'insufficient') {
      return { state: addLog(prev, '丹药数量不足'), consumed: false };
    }
    if (blockReason === 'decay_zero' || blockReason === 'buff_full') {
      return { state: prev, consumed: false };
    }

    const filteredPills = prev.pills
      .map(p => p.recipeId === recipe.id ? { ...p, count: p.count - 1 } : p)
      .filter(p => p.count > 0);

    let s = { ...prev, pills: filteredPills };

    const eff = recipe.effect;
    const decay = getPillDecayFactor(recipe, prev.realmIndex);
    const decayDesc = decay < 1 ? `（丹药效果-${((1 - decay) * 100).toFixed(0)}%）` : '';
    const BUFF_DESC: Record<string, string> = {
      exp_boost: '修炼速度', atk_boost: '攻击', def_boost: '防御',
      all_boost: '全属性', hp_boost: '生命', crit_boost: '暴击率',
    };

    if (eff.type === 'breakthrough_boost') {
      const actualBonus = eff.bonus * decay;
      const newBonuses = [...(s.breakthroughPillBonuses ?? []), { pillId: recipe.id, bonus: actualBonus }];
      s = { ...s, breakthroughPillBonuses: newBonuses, breakthroughBonus: newBonuses.reduce((sum, b) => sum + b.bonus, 0) };
      if (shouldLog) s = addLog(s, `💊 服用【${recipe.name}】，下次突破成功率+${(actualBonus * 100).toFixed(0)}%${decayDesc}`);
    } else if (eff.type === 'stamina_restore') {
      const actualAmount = Math.floor(eff.amount * decay);
      const maxStamina = getStaminaMax(s);
      const newStamina = Math.min(maxStamina, (s.stamina ?? maxStamina) + actualAmount);
      s = { ...s, stamina: newStamina };
      if (shouldLog) s = addLog(s, `💊 服用【${recipe.name}】，恢复 ${actualAmount} 点体力（当前：${Math.floor(newStamina)}/${maxStamina}）${decayDesc}`);
    } else if (eff.type === 'crit_exp_boost') {
      const actualExpMul = eff.expMultiplier * decay;
      const actualCritBonus = eff.critBonus * decay;
      let buffs = [...(s.buffs || [])];
      const expIdx = buffs.findIndex(b => b.type === 'exp_boost' && b.recipeId === recipe.id);
      if (expIdx >= 0) {
        const newDur = Math.min(buffs[expIdx].remainingSeconds + eff.duration, MAX_BUFF_DURATION);
        buffs[expIdx] = { ...buffs[expIdx], remainingSeconds: newDur };
      } else {
        buffs.push({ type: 'exp_boost', multiplier: actualExpMul, remainingSeconds: eff.duration, sourceName: recipe.name, recipeId: recipe.id });
      }
      const critIdx = buffs.findIndex(b => b.type === 'crit_boost' && b.recipeId === recipe.id);
      if (critIdx >= 0) {
        const newDur = Math.min(buffs[critIdx].remainingSeconds + eff.duration, MAX_BUFF_DURATION);
        buffs[critIdx] = { ...buffs[critIdx], remainingSeconds: newDur };
      } else {
        buffs.push({ type: 'crit_boost', multiplier: actualCritBonus, remainingSeconds: eff.duration, sourceName: recipe.name, recipeId: recipe.id });
      }
      s = { ...s, buffs };
      if (shouldLog) s = addLog(s, `💊 服用【${recipe.name}】，修炼速度+${(actualExpMul * 100).toFixed(0)}%、暴击率+${(actualCritBonus * 100).toFixed(0)}%，持续${formatDuration(eff.duration)}${decayDesc}`);
    } else if (eff.type === 'exp_boost') {
      const actualMul = eff.multiplier * decay;
      let buffs = [...(s.buffs || [])];
      const existIdx = buffs.findIndex(b => b.type === 'exp_boost' && b.recipeId === recipe.id);
      if (existIdx >= 0) {
        const newDur = Math.min(buffs[existIdx].remainingSeconds + eff.duration, MAX_BUFF_DURATION);
        buffs[existIdx] = { ...buffs[existIdx], remainingSeconds: newDur };
        if (shouldLog) s = addLog(s, `💊 服用【${recipe.name}】，修炼速度效果叠加，剩余${formatDuration(newDur)}${decayDesc}`);
      } else {
        buffs.push({ type: 'exp_boost', multiplier: actualMul, remainingSeconds: eff.duration, sourceName: recipe.name, recipeId: recipe.id });
        if (shouldLog) s = addLog(s, `💊 服用【${recipe.name}】，修炼速度+${(actualMul * 100).toFixed(0)}%，持续${formatDuration(eff.duration)}${decayDesc}`);
      }
      s = { ...s, buffs };
    } else {
      const actualMul = (eff as { multiplier: number }).multiplier * decay;
      let buffs = [...(s.buffs || [])];
      const desc = BUFF_DESC[eff.type] ?? eff.type;
      const existIdx = buffs.findIndex(b => b.type === eff.type && b.recipeId === recipe.id);
      if (existIdx >= 0) {
        const existingBuff = buffs[existIdx];
        const newDuration = Math.min(existingBuff.remainingSeconds + eff.duration, MAX_BUFF_DURATION);
        if (existingBuff.multiplier >= actualMul) {
          buffs[existIdx] = { ...existingBuff, remainingSeconds: newDuration };
          if (shouldLog) s = addLog(s, `💊 服用【${recipe.name}】，${desc}效果叠加，剩余${formatDuration(newDuration)}${decayDesc}`);
        } else {
          buffs[existIdx] = { type: eff.type, multiplier: actualMul, remainingSeconds: newDuration, sourceName: recipe.name, recipeId: recipe.id };
          if (shouldLog) s = addLog(s, `💊 服用【${recipe.name}】，${desc}+${(actualMul * 100).toFixed(0)}%（已升级），剩余${formatDuration(newDuration)}${decayDesc}`);
        }
      } else {
        buffs.push({ type: eff.type, multiplier: actualMul, remainingSeconds: eff.duration, sourceName: recipe.name, recipeId: recipe.id });
        if (shouldLog) s = addLog(s, `💊 服用【${recipe.name}】，${desc}+${(actualMul * 100).toFixed(0)}%，持续${formatDuration(eff.duration)}${decayDesc}`);
      }
      s = { ...s, buffs };
    }

    return { state: s, consumed: true };
  };

  // 炼丹
  const refine = (recipe: PillRecipe) => {
    onStateChange(prev => {
      if (prev.herbs < recipe.herbCost) return addLog(prev, `灵草不足，需要 ${recipe.herbCost} 灵草`);
      if (prev.gold < recipe.goldCost) return addLog(prev, `灵石不足，需要 ${formatNumber(recipe.goldCost)} 灵石`);

      let s = { ...prev, herbs: prev.herbs - recipe.herbCost, gold: prev.gold - recipe.goldCost };
      s = updateSectTaskProgress(s, { type: 'alchemy_attempt', count: 1 });

      const alchBonus = getAlchemyBonus(prev);
      const finalRate = Math.min(1, recipe.successRate + alchBonus);
      const success = Math.random() <= finalRate;
      // 更新统计
      const stats = { ...s.stats };
      if (success) {
        stats.alchemySuccessCount = (stats.alchemySuccessCount || 0) + 1;
        // 丹宗被动：30%概率双倍产出
        const isDoubleYield = prev.sectId === 'sect_pill' && Math.random() < 0.30;
        const actualYield = isDoubleYield ? recipe.yield * 2 : recipe.yield;
        // 添加到丹药背包
        const existIdx = s.pills.findIndex(p => p.recipeId === recipe.id);
        let pills;
        if (existIdx >= 0) {
          pills = s.pills.map((p, i) => i === existIdx ? { ...p, count: p.count + actualYield } : p);
        } else {
          pills = [...s.pills, { recipeId: recipe.id, count: actualYield }];
        }
        s = { ...s, pills, stats };
        s = updateSectTaskProgress(s, { type: 'alchemy_success', count: 1 });
        if (isDoubleYield) {
          s = addLog(s, `🔥 炉火纯青！额外炼制了一份丹药！获得【${recipe.name}】x${actualYield}`);
        } else {
          s = addLog(s, `🧪 炼丹成功！获得【${recipe.name}】x${actualYield}`);
        }
      } else {
        stats.alchemyFailCount = (stats.alchemyFailCount || 0) + 1;
        s = { ...s, stats };
        s = addLog(s, `💨 炼丹失败！灵草和灵石化为乌有…`);
      }
      return s;
    });
  };

  // 使用丹药
  const usePill = (recipeId: string) => {
    const recipe = getPillRecipe(recipeId);
    if (!recipe) return;

    const blockReason = getPillUseBlockReason(gameState, recipe);
    if (blockReason === 'decay_zero') {
      setShowDecayZeroAlert(true);
      return;
    }
    if (blockReason === 'buff_full') {
      setShowBuffFullAlert(true);
      return;
    }

    onStateChange(prev => applyPillUse(prev, recipe, true).state);
  };

  const useAllPills = (recipeId: string) => {
    const recipe = getPillRecipe(recipeId);
    if (!recipe) return;

    const blockReason = getPillUseBlockReason(gameState, recipe);
    if (blockReason === 'decay_zero') {
      setShowDecayZeroAlert(true);
      return;
    }
    if (blockReason === 'buff_full') {
      setShowBuffFullAlert(true);
      return;
    }

    onStateChange(prev => {
      const totalCount = prev.pills.find(p => p.recipeId === recipe.id)?.count ?? 0;
      let s = prev;
      let usedCount = 0;

      while (usedCount < totalCount) {
        const result = applyPillUse(s, recipe, false);
        if (!result.consumed) break;
        s = result.state;
        usedCount += 1;
      }

      if (usedCount <= 0) {
        return applyPillUse(prev, recipe, true).state;
      }

      return addLog(s, `💊 批量服用【${recipe.name}】x${usedCount}`);
    });
  };

  return (
    <div className="space-y-4">
      {/* 资源显示 */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-4 border border-xian-gold/30">
        <div className="flex items-center justify-around text-base">
          <div className="flex items-center gap-1">
            <span>🌿</span>
            <span className="text-green-400 font-bold">{gameState.herbs}</span>
            <span className="text-xian-gold/70">灵草</span>
          </div>
          <div className="w-px h-6 bg-xian-gold/20" />
          <div className="flex items-center gap-1">
            <span>💎</span>
            <span className="text-yellow-400 font-bold">{formatNumber(gameState.gold)}</span>
            <span className="text-xian-gold/70">灵石</span>
          </div>
        </div>
      </div>

      {/* 激活中的buff */}
      {gameState.buffs && gameState.buffs.length > 0 && (
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-4 border border-green-500/30">
          <div className="text-base text-green-400/90 font-kai mb-2">✨ 激活中的效果</div>
          <div className="space-y-1">
            {gameState.buffs.map((buff, i) => {
              const recipe = buff.recipeId ? getPillRecipe(buff.recipeId) : null;
              const buffColor = recipe ? QUALITY_COLORS[recipe.quality] : 'text-green-400';
              const buffBorder = recipe ? QUALITY_BORDER[recipe.quality] : 'border-green-500/10';
              const buffBg = recipe ? QUALITY_BG[recipe.quality] : 'bg-green-500/5';
              return (
              <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm border ${buffBg} ${buffBorder}`}>
                <div>
                  <span className={`${buffColor} font-bold`}>{buff.sourceName}</span>
                  <span className={`ml-2 ${buffColor}`}>
                    {buff.type === 'exp_boost' ? '修炼' : buff.type === 'atk_boost' ? '攻击' :
                     buff.type === 'def_boost' ? '防御' : buff.type === 'hp_boost' ? '生命' :
                     buff.type === 'crit_boost' ? '暴击率' : '全属性'}
                    +{(getActiveBuffEffectiveMultiplier(buff, gameState.realmIndex) * 100).toFixed(0)}%
                  </span>
                </div>
                <span className="text-yellow-400">⏱ {formatDuration(buff.remainingSeconds)}</span>
              </div>
            )})}
          </div>
        </div>
      )}

      {/* 突破加成提示 */}
      {(gameState.breakthroughBonus || 0) > 0 && (
        <div className="bg-purple-500/10 rounded-xl px-4 py-2 border border-purple-500/20 text-center text-sm">
          <span className="text-purple-400">💊 下次突破成功率 +{((gameState.breakthroughBonus || 0) * 100).toFixed(0)}%</span>
        </div>
      )}

      {/* 丹药背包 */}
      {gameState.pills.length > 0 && (
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-4 border border-xian-gold/30">
          <div className="text-base text-xian-gold/80 font-kai mb-2">🎒 丹药背包</div>
          <div className="space-y-1">
            {gameState.pills.map(stack => {
              const recipe = getPillRecipe(stack.recipeId);
              if (!recipe) return null;
              const realmTooHigh = recipe.maxUseRealmIndex !== undefined && gameState.realmIndex > recipe.maxUseRealmIndex;
              const decayFactor = getPillDecayFactor(recipe, gameState.realmIndex);
              const decayN = getMajorRealmTier(gameState.realmIndex) - getMajorRealmTier(recipe.requiredRealmIndex);
              const cannotUse = realmTooHigh || decayFactor <= 0;
              return (
                <div key={stack.recipeId} className={`flex items-center justify-between p-2 rounded-lg border ${QUALITY_BORDER[recipe.quality]} ${QUALITY_BG[recipe.quality]}`}>
                  <div>
                    <span className={`text-base font-bold ${QUALITY_COLORS[recipe.quality]}`}>{recipe.name}</span>
                    <span className="text-sm text-xian-gold/70 ml-1">x{stack.count}</span>
                    <div className="text-xs text-xian-gold/70 mt-0.5">{describePillEffect(recipe.effect)}</div>
                    {realmTooHigh && <div className="text-xs text-red-400 mt-0.5">境界过高，无法服用</div>}
                    {!realmTooHigh && decayFactor <= 0 && <div className="text-xs text-red-400 mt-0.5">境界差距过大，效果衰减至零，无法服用</div>}
                    {!realmTooHigh && decayFactor > 0 && decayFactor < 1 && (
                      <div className="text-xs text-orange-400 mt-0.5">境界高出{decayN}档，丹药效果-{((1 - decayFactor) * 100).toFixed(0)}%</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => useAllPills(stack.recipeId)}
                      disabled={cannotUse}
                      className={`px-3 py-1 text-sm rounded transition-all ${
                        cannotUse
                          ? 'bg-gray-700/30 border border-gray-600/20 text-gray-500 cursor-not-allowed'
                          : decayFactor < 1
                            ? 'bg-sky-600/30 border border-sky-500/30 text-sky-300 hover:bg-sky-600/50'
                            : 'bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-600/50'
                      }`}
                    >
                      全部服用
                    </button>
                    <button
                      onClick={() => usePill(stack.recipeId)}
                      disabled={cannotUse}
                      className={`px-3 py-1 text-sm rounded transition-all ${
                        cannotUse
                          ? 'bg-gray-700/30 border border-gray-600/20 text-gray-500 cursor-not-allowed'
                          : decayFactor < 1
                            ? 'bg-orange-600/30 border border-orange-500/30 text-orange-300 hover:bg-orange-600/50'
                            : 'bg-green-600/30 border border-green-500/30 text-green-300 hover:bg-green-600/50'
                      }`}
                    >
                      服用
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 炼丹配方 */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-5 border border-xian-gold/30">
        <div className="flex items-center justify-between mb-3">
          <div className="text-base text-xian-gold/80 font-kai">🔥 炼丹炉</div>
          <div className="text-sm text-xian-gold/70">
            已解锁 {unlockedRecipes.length}/{PILL_RECIPES.length} 配方
          </div>
        </div>

        <div className="space-y-2">
          {PILL_RECIPES.map(recipe => {
            const unlocked = gameState.realmIndex >= recipe.requiredRealmIndex;
            const canAfford = gameState.herbs >= recipe.herbCost && gameState.gold >= recipe.goldCost;
            const requiredRealm = getRealm(recipe.requiredRealmIndex);
            const realmHint = getRecipeRealmHint(recipe);
            return (
              <div
                key={recipe.id}
                className={`rounded-lg p-3 border transition-all ${
                  unlocked
                    ? `${QUALITY_BORDER[recipe.quality]} ${QUALITY_BG[recipe.quality]}`
                    : 'border-gray-600/20 bg-black/20 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className={`font-bold font-kai ${QUALITY_COLORS[recipe.quality]}`}>
                      {unlocked ? recipe.name : `🔒 ${recipe.name}`}
                    </span>
                    <span className={`text-sm ml-1 ${QUALITY_COLORS[recipe.quality]}`}>
                      [{QUALITY_NAMES[recipe.quality]}]
                    </span>
                  </div>
                  {unlocked && (
                    <button
                      onClick={() => refine(recipe)}
                      disabled={!canAfford}
                      className={`px-3 py-1 text-sm rounded font-bold transition-all ${
                        canAfford
                          ? 'bg-orange-600/40 border border-orange-500/40 text-orange-300 hover:bg-orange-600/60'
                          : 'bg-gray-700/30 border border-gray-600/20 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      🔥 炼丹
                    </button>
                  )}
                </div>
                <div className="text-sm text-xian-gold/70 mb-1">{recipe.description}</div>
                <div className="text-xs text-cyan-300/85 mb-1">📍 {realmHint}</div>
                <div className="text-sm text-green-400 mb-1">效果：{describePillEffect(recipe.effect)}</div>
                {unlocked ? (
                  <div className="flex gap-3 text-xs text-xian-gold/70">
                    <span>🌿 {recipe.herbCost}灵草</span>
                    <span>💎 {formatNumber(recipe.goldCost)}灵石</span>
                    <span>成功率 {(recipe.successRate * 100).toFixed(0)}%</span>
                    <span>产出 x{recipe.yield}</span>
                  </div>
                ) : (
                  <div className="text-sm text-yellow-400/80 mt-1">
                    🔓 解锁条件：达到【{requiredRealm.subLevelName}】境界
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Buff时间已满提示弹窗 */}
      {showBuffFullAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border-2 border-yellow-500/30 p-6 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-kai text-yellow-400 mb-4 text-center">⚠️ 无法服用</h2>
            <p className="text-base text-xian-gold/90 mb-6 text-center">
              当前buff时间已满（最多12小时）<br/>
              无法继续叠加时间
            </p>
            <button
              onClick={() => setShowBuffFullAlert(false)}
              className="w-full px-4 py-3 bg-yellow-600/30 border border-yellow-500/40 rounded-lg text-yellow-200 hover:bg-yellow-600/50 transition-all font-bold"
            >
              确定
            </button>
          </div>
        </div>
      )}

      {/* 衰减至零无法服用弹窗 */}
      {showDecayZeroAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border-2 border-red-500/30 p-6 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-kai text-red-400 mb-4 text-center">🚫 无法服用</h2>
            <p className="text-base text-xian-gold/90 mb-6 text-center">
              当前境界与丹药设计境界差距过大<br/>
              效果已衰减至零，此丹药对你毫无作用
            </p>
            <button
              onClick={() => setShowDecayZeroAlert(false)}
              className="w-full px-4 py-3 bg-red-600/30 border border-red-500/40 rounded-lg text-red-200 hover:bg-red-600/50 transition-all font-bold"
            >
              确定
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
