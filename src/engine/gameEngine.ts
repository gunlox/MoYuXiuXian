import { GameState, addLog } from '../data/gameState';
import { getSect } from '../data/sect';
import { getShopItem, getShopPrice } from '../data/shop';
import { getPillRecipe } from '../data/alchemy';
import { formatNumber } from '../utils/format';
import { AREAS } from '../data/monsters';
import {
  randomArtifactDrop, randomTechniqueDrop, QUALITY_NAMES,
  TechniqueInstance, getArtifactTemplate, getTechniqueDropMaxQualityIndex, getArtifactSalvageRewards,
} from '../data/equipment';
import { getRealm, getNextRealm, isMajorBreakthrough, TOTAL_REALMS } from '../data/realms';
import {
  calcFinalAttributes, calcBonusAttributes, getBattleGoldBonus, getDropBonus,
  getExpMultiplier, getStaminaMax, getStaminaRegen, getBreakthroughPerkBonus,
} from './attributeCalc';
import { BattleLogEntry, BattleResult, executeBattle } from './battleEngine';

/** 每次tick的时间间隔(ms) */
export const TICK_INTERVAL = 100;
/** 战斗间隔(ms) */
export const BATTLE_INTERVAL = 3000;
/** 离线收益倍率 */
export const OFFLINE_RATE = 0.8;

export interface BattleRewardSummary {
  exp: number;
  gold: number;
  herbs: number;
  fragments: number;
  kills: number;
  artifactCount: number;
  techniqueCount: number;
  autoSalvageFragments: number;
  autoSalvageCount: number;
}

export interface OfflineGains extends BattleRewardSummary {
  seconds: number;
  staminaRecovered: number;
}

function getDateOffsetISO(baseTimestamp: number, offsetSeconds: number): string {
  return new Date(baseTimestamp + offsetSeconds * 1000).toISOString().slice(0, 10);
}

function createEmptyBattleRewardSummary(): BattleRewardSummary {
  return {
    exp: 0,
    gold: 0,
    herbs: 0,
    fragments: 0,
    kills: 0,
    artifactCount: 0,
    techniqueCount: 0,
    autoSalvageFragments: 0,
    autoSalvageCount: 0,
  };
}

function createEmptyOfflineGains(seconds: number = 0): OfflineGains {
  return {
    seconds,
    staminaRecovered: 0,
    ...createEmptyBattleRewardSummary(),
  };
}

function appendOfflineSummaryParts(gains: OfflineGains): string[] {
  const parts = [`获得修为 ${formatNumber(gains.exp)}`, `灵石 ${formatNumber(gains.gold)}`];
  if (gains.staminaRecovered > 0) parts.push(`体力 ${formatNumber(gains.staminaRecovered)}`);
  if (gains.herbs > 0) parts.push(`灵草 ${gains.herbs}`);
  if (gains.fragments > 0) parts.push(`碎片 ${gains.fragments}`);
  if (gains.artifactCount > 0) parts.push(`装备 ${gains.artifactCount}件`);
  if (gains.autoSalvageFragments > 0) parts.push(`自动分解获得碎片 ${gains.autoSalvageFragments}`);
  if (gains.techniqueCount > 0) parts.push(`功法 ${gains.techniqueCount}本`);
  return parts;
}

function formatOfflineTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;
}

function createOfflineSummaryLog(gains: OfflineGains): string {
  return `💤 离线${formatOfflineTime(gains.seconds)}，${appendOfflineSummaryParts(gains).join('，')}`;
}

function getArtifactDropTargetTier(state: GameState): number {
  const area = state.currentAreaId ? AREAS.find(a => a.id === state.currentAreaId) : null;
  if (!area) return Math.max(0, Math.min(21, state.realmIndex - 8));
  if (area.requiredRebirthCount && area.requiredRebirthCount >= 5) return 21;
  return Math.max(0, Math.min(21, area.requiredRealmIndex - 8));
}

// formatNumber 已抽取至 utils/format.ts，此处 re-export 保持兼容
export { formatNumber };

export function applyBattleRewards(
  state: GameState,
  result: BattleResult,
  options?: { captureLogs?: boolean },
): { state: GameState; extraLogs: BattleLogEntry[]; summary: BattleRewardSummary } {
  const captureLogs = options?.captureLogs ?? true;
  const extraLogs: BattleLogEntry[] = [];
  const summary = createEmptyBattleRewardSummary();

  let newState = { ...state };
  if (!result.victory) {
    return { state: newState, extraLogs, summary };
  }

  newState.exp += result.expGained;
  newState.killCount += 1;
  summary.exp += result.expGained;
  summary.kills += 1;

  const goldBonus = getBattleGoldBonus(state);
  const stats = { ...(newState.stats || {}) };
  for (const drop of result.drops) {
    if (drop.type === 'gold') {
      const goldAmount = Math.floor(drop.amount * (1 + goldBonus));
      newState.gold += goldAmount;
      summary.gold += goldAmount;
      stats.totalGoldEarned = (stats.totalGoldEarned || 0) + goldAmount;
    } else if (drop.type === 'herb') {
      newState.herbs += drop.amount;
      summary.herbs += drop.amount;
      stats.totalHerbsEarned = (stats.totalHerbsEarned || 0) + drop.amount;
    } else if (drop.type === 'fragment') {
      newState.fragments += drop.amount;
      summary.fragments += drop.amount;
    }
  }
  newState.stats = stats as typeof newState.stats;

  const dropBonus = getDropBonus(state);
  if (Math.random() < 0.10 + dropBonus) {
    const newArt = randomArtifactDrop(
      state.realmIndex,
      state.rebirthCount ?? 0,
      undefined,
      getArtifactDropTargetTier(state),
    );
    if (newArt) {
      const artName = getArtifactTemplate(newArt.templateId)?.name ?? '未知装备';
      if (state.autoSalvageQualities?.[newArt.quality]) {
        const rewards = getArtifactSalvageRewards(newArt.quality);
        newState = {
          ...newState,
          gold: newState.gold + rewards.gold,
          fragments: newState.fragments + rewards.fragments,
          sessionAutoSalvageCount: (newState.sessionAutoSalvageCount ?? 0) + 1,
          sessionAutoSalvageFragments: (newState.sessionAutoSalvageFragments ?? 0) + rewards.fragments,
        };
        summary.gold += rewards.gold;
        summary.fragments += rewards.fragments;
        summary.autoSalvageFragments += rewards.fragments;
        summary.autoSalvageCount += 1;
        const stats = { ...(newState.stats || {}) };
        stats.totalGoldEarned = (stats.totalGoldEarned || 0) + rewards.gold;
        newState.stats = stats as typeof newState.stats;
        if (captureLogs) {
          extraLogs.push({ text: `♻️ ${QUALITY_NAMES[newArt.quality]}装备【${artName}】已自动分解，获得 ${formatNumber(rewards.gold)} 灵石和 ${rewards.fragments} 碎片`, type: 'drop' });
        }
      } else {
        newState = { ...newState, artifactBag: [...newState.artifactBag, newArt] };
        summary.artifactCount += 1;
        if (captureLogs) {
          extraLogs.push({ text: `🎁 获得装备【${artName}】(${QUALITY_NAMES[newArt.quality]})`, type: 'drop' });
        }
      }
    }
  }

  if (Math.random() < 0.05 + dropBonus) {
    const maxQ = getTechniqueDropMaxQualityIndex(state.realmIndex, state.rebirthCount ?? 0);
    const ownedTechniqueIds = new Set([
      ...newState.techniqueBag.map(t => t.templateId),
      ...(newState.masteredTechniques ?? []),
      ...(newState.equippedTechnique ? [newState.equippedTechnique.templateId] : []),
    ]);
    const techTmpl = randomTechniqueDrop(maxQ, Array.from(ownedTechniqueIds));
    if (techTmpl) {
      const newTech: TechniqueInstance = { templateId: techTmpl.id, level: 1 };
      newState = { ...newState, techniqueBag: [...newState.techniqueBag, newTech] };
      summary.techniqueCount += 1;
      if (captureLogs) {
        extraLogs.push({ text: `📖 领悟功法【${techTmpl.name}】(${QUALITY_NAMES[techTmpl.quality]})`, type: 'drop' });
      }
    }
  }

  return { state: newState, extraLogs, summary };
}

export function runOneAutoBattle(
  state: GameState,
  options?: { captureLogs?: boolean },
): { state: GameState; result: BattleResult | null; monsterName: string; extraLogs: BattleLogEntry[]; summary: BattleRewardSummary } {
  const summary = createEmptyBattleRewardSummary();
  if (!state.isBattling || !state.currentAreaId) {
    return { state, result: null, monsterName: '', extraLogs: [], summary };
  }

  const area = AREAS.find(a => a.id === state.currentAreaId);
  if (!area) {
    return { state, result: null, monsterName: '', extraLogs: [], summary };
  }

  const monster = area.monsters[Math.floor(Math.random() * area.monsters.length)];
  const result = executeBattle(
    calcFinalAttributes(state),
    calcBonusAttributes(state),
    monster,
    { captureLogs: options?.captureLogs ?? true, dropBonus: getDropBonus(state) },
  );
  const rewardResult = applyBattleRewards(state, result, options);
  return {
    state: rewardResult.state,
    result,
    monsterName: monster.name,
    extraLogs: rewardResult.extraLogs,
    summary: rewardResult.summary,
  };
}

function resolveElapsedOfflineProgress(
  state: GameState,
  elapsedSeconds: number,
  now: number,
  includeLog: boolean,
): { state: GameState; gains: OfflineGains } | null {
  const seconds = Math.floor(Math.min(elapsedSeconds, 24 * 3600));
  if (seconds < 1) return null;

  const gains = createEmptyOfflineGains(seconds);
  const referenceState = { ...state, lastSaveTime: now - seconds * 1000 };
  let newState = advanceGameTime(referenceState, seconds, OFFLINE_RATE);
  gains.exp += newState.exp - state.exp;
  gains.gold += newState.gold - state.gold;
  gains.staminaRecovered += Math.max(0, newState.stamina - state.stamina);

  if (state.isBattling && state.currentAreaId && state.sectId !== null) {
    const battleCount = Math.floor(seconds * 1000 / BATTLE_INTERVAL);
    for (let i = 0; i < battleCount; i++) {
      const battle = runOneAutoBattle(newState, { captureLogs: false });
      newState = battle.state;
      gains.exp += battle.summary.exp;
      gains.gold += battle.summary.gold;
      gains.herbs += battle.summary.herbs;
      gains.fragments += battle.summary.fragments;
      gains.kills += battle.summary.kills;
      gains.artifactCount += battle.summary.artifactCount;
      gains.techniqueCount += battle.summary.techniqueCount;
      gains.autoSalvageFragments += battle.summary.autoSalvageFragments;
      gains.autoSalvageCount += battle.summary.autoSalvageCount;
    }
  }

  newState = { ...newState, lastSaveTime: now };
  if (includeLog) {
    newState = addLog(newState, createOfflineSummaryLog(gains));
  }
  return { state: newState, gains };
}

export function resolveOfflineProgress(
  state: GameState,
  now: number = Date.now(),
  includeLog: boolean = true,
): { state: GameState; gains: OfflineGains } | null {
  return resolveElapsedOfflineProgress(state, (now - state.lastSaveTime) / 1000, now, includeLog);
}

export function applyElapsedOfflineProgress(
  state: GameState,
  elapsedSeconds: number,
  now: number = Date.now(),
): GameState {
  return resolveElapsedOfflineProgress(state, elapsedSeconds, now, false)?.state ?? state;
}

/** 按指定经过时间推进游戏状态 */
export function advanceGameTime(state: GameState, elapsedSeconds: number, resourceRate: number = 1): GameState {
  if (elapsedSeconds <= 0) return state;

  // 未选门派时不产出修为和灵石（门派选择后才正式进入游戏）
  const hasEntered = state.sectId !== null;

  const realm = getRealm(state.realmIndex);
  const expMul = getExpMultiplier(state);

  const expGain = hasEntered ? realm.expPerSecond * elapsedSeconds * expMul * resourceRate : 0;
  const goldGain = hasEntered ? realm.goldPerSecond * elapsedSeconds * resourceRate : 0;

  let buffs = state.buffs;
  if (buffs && buffs.length > 0) {
    buffs = buffs
      .map(b => ({ ...b, remainingSeconds: b.remainingSeconds - elapsedSeconds }))
      .filter(b => b.remainingSeconds > 0);
  }

  const maxStamina = getStaminaMax(state);
  const regenRate = getStaminaRegen(state);
  const stamina = Math.min(maxStamina, (state.stamina ?? maxStamina) + regenRate * elapsedSeconds);

  const targetDate = getDateOffsetISO(state.lastSaveTime, elapsedSeconds);
  let dungeonDailyCounts = state.dungeonDailyCounts;
  let dungeonResetDate = state.dungeonResetDate;
  let dungeonFirstClears = state.dungeonFirstClears ?? {};
  if (dungeonResetDate !== targetDate) {
    dungeonDailyCounts = {};
    dungeonFirstClears = {};
    dungeonResetDate = targetDate;
  }

  let shopPurchases = state.shopPurchases ?? {};
  let shopResetDate = state.shopResetDate ?? targetDate;
  if (shopResetDate !== targetDate) {
    shopPurchases = {};
    shopResetDate = targetDate;
  }

  return {
    ...state,
    exp: state.exp + expGain,
    gold: state.gold + goldGain,
    totalPlayTime: state.totalPlayTime + elapsedSeconds,
    buffs,
    stamina,
    dungeonDailyCounts,
    dungeonResetDate,
    dungeonFirstClears,
    shopPurchases,
    shopResetDate,
  };
}

/** 游戏tick：每100ms调用一次，更新修为和灵石 */
export function gameTick(state: GameState): GameState {
  return advanceGameTime(state, TICK_INTERVAL / 1000, 1);
}

/** 计算离线收益 */
export function calcOfflineGains(state: GameState): OfflineGains {
  return resolveOfflineProgress(state, Date.now(), false)?.gains ?? createEmptyOfflineGains();
}

/** 应用离线收益 */
export function applyOfflineGains(state: GameState): GameState {
  return resolveOfflineProgress(state)?.state ?? state;
}

/** 检查是否可以突破到下一层/境界 */
export function canBreakthrough(state: GameState): boolean {
  if (state.realmIndex >= TOTAL_REALMS - 1) return false;
  const realm = getRealm(state.realmIndex);
  if (state.exp < realm.requiredExp) return false;
  // 如果是大境界突破，还需要足够灵石
  if (isMajorBreakthrough(state.realmIndex)) {
    const nextRealm = getNextRealm(state.realmIndex);
    if (nextRealm && state.gold < nextRealm.breakthroughCost) return false;
  }
  return true;
}

/** 获取突破所需信息 */
export function getBreakthroughInfo(state: GameState): {
  canDo: boolean;
  needExp: number;
  needGold: number;
  successRate: number;
  isMajor: boolean;
  nextName: string;
} {
  const realm = getRealm(state.realmIndex);
  const next = getNextRealm(state.realmIndex);

  if (!next) {
    return { canDo: false, needExp: 0, needGold: 0, successRate: 0, isMajor: false, nextName: '已达巅峰' };
  }

  const isMajor = isMajorBreakthrough(state.realmIndex);
  const needGold = isMajor ? next.breakthroughCost : 0;
  const hasEnoughExp = state.exp >= realm.requiredExp;
  const hasEnoughGold = state.gold >= needGold;

  return {
    canDo: hasEnoughExp && hasEnoughGold,
    needExp: realm.requiredExp,
    needGold,
    successRate: realm.breakthroughRate,
    isMajor,
    nextName: next.subLevelName,
  };
}

/** 尝试突破 */
export function attemptBreakthrough(state: GameState): { newState: GameState; success: boolean } {
  const realm = getRealm(state.realmIndex);
  const next = getNextRealm(state.realmIndex);

  if (!next || !canBreakthrough(state)) {
    return { newState: state, success: false };
  }

  const isMajor = isMajorBreakthrough(state.realmIndex);
  let newState = { ...state };

  // 扣除灵石（大境界突破才需要）
  if (isMajor) {
    newState.gold -= next.breakthroughCost;
  }

  // 判定成功率（含丹药加成 + 轮回永久加成 + 门派加成）
  // 遍历各突破丹分条目，按来源分别判定境界范围翻倍
  let pillBonus = 0;
  for (const entry of (newState.breakthroughPillBonuses ?? [])) {
    let b = entry.bonus;
    const pillRecipe = getPillRecipe(entry.pillId);
    if (pillRecipe?.targetBreakthroughRange) {
      const [lo, hi] = pillRecipe.targetBreakthroughRange;
      if (state.realmIndex >= lo && state.realmIndex <= hi) {
        b *= 2;
      }
    }
    pillBonus += b;
  }
  const perkBonus = getBreakthroughPerkBonus(newState);
  const sectBonus = newState.sectId ? (getSect(newState.sectId)?.bonus.breakthroughBonus ?? 0) : 0;
  const bonus = pillBonus + perkBonus + sectBonus;
  const finalRate = Math.min(1, realm.breakthroughRate + bonus);
  const roll = Math.random();
  const success = roll <= finalRate;

  // 清除一次性突破加成
  newState.breakthroughBonus = 0;
  newState.breakthroughPillBonuses = [];

  if (bonus > 0) {
    newState = addLog(newState, `🧪 助力加成，突破成功率提升至 ${(finalRate * 100).toFixed(0)}%`);
  }

  if (success) {
    newState.realmIndex += 1;
    newState.exp = Math.max(0, newState.exp - realm.requiredExp); // 保留溢出修为
    newState.breakthroughCount += 1;
    newState = addLog(newState, `✨ 突破成功！晋升为【${next.subLevelName}】`);

    // 大境界突破额外提示
    if (isMajor) {
      newState = addLog(newState, `🎉 恭喜踏入${next.name}期！修炼速度大幅提升！`);
    }
  } else {
    // 失败损失30%修为
    const lostExp = newState.exp * 0.3;
    newState.exp -= lostExp;
    newState.breakthroughFailCount += 1;
    newState = addLog(newState,
      `💥 突破失败！走火入魔，损失修为 ${formatNumber(lostExp)}`
    );
  }

  return { newState, success };
}

/** 灵石商店购买 */
export function purchaseShopItem(state: GameState, itemId: string): GameState {
  const item = getShopItem(itemId);
  if (!item) return state;

  const today = new Date().toISOString().slice(0, 10);
  const purchases = state.shopResetDate === today ? { ...state.shopPurchases } : {};
  const resetDate = state.shopResetDate === today ? state.shopResetDate : today;
  const used = purchases[itemId] || 0;

  if (used >= item.dailyLimit) return addLog(state, `❌ 【${item.name}】今日购买次数已达上限`);

  const price = getShopPrice(item, used);
  if (state.gold < price) return addLog(state, `❌ 灵石不足，需要 ${formatNumber(price)} 灵石`);

  purchases[itemId] = used + 1;
  let s: GameState = { ...state, gold: state.gold - price, shopPurchases: purchases, shopResetDate: resetDate };

  switch (item.rewardType) {
    case 'herb':
      s = { ...s, herbs: s.herbs + item.rewardAmount };
      break;
    case 'fragment':
      s = { ...s, fragments: s.fragments + item.rewardAmount };
      break;
    case 'stamina': {
      const max = getStaminaMax(s);
      s = { ...s, stamina: Math.min(max, s.stamina + item.rewardAmount) };
      break;
    }
  }

  s = addLog(s, `🛒 购买【${item.name}】x${item.rewardAmount}，花费 ${formatNumber(price)} 灵石`);
  return s;
}
