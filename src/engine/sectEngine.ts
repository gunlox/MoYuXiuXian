import { GameState, addLog } from '../data/gameState';
import { SectId } from '../data/sect';
import { SectPassiveDefinition, SectPassiveEffectType, SECT_LEVEL_REQUIREMENTS, getSectPassives } from '../data/sectPassives';
import { SectTaskDefinition, SectTaskType, getSectDailyTaskPool, getSectGrowthTasks, getSectTaskById } from '../data/sectTasks';

export interface SectGrowthBonuses {
  atkBonus: number;
  defBonus: number;
  hpBonus: number;
  critRateBonus: number;
  critDmgBonus: number;
  expBonus: number;
  alchemyBonus: number;
  dropBonus: number;
  breakthroughBonus: number;
  battleGoldBonus: number;
  offlineBonus: number;
  dungeonBonus: number;
  extraDropChance: number;
  doubleAlchemyChance: number;
  lowHpAtkBonus: number;
  deathSaveChance: number;
  breakthroughFailProtect: number;
  doubleTechChance: number;
  buffDurationBonus: number;
}

export type SectProgressEvent =
  | { type: 'battle_win'; count?: number }
  | { type: 'kill'; count?: number }
  | { type: 'breakthrough_success'; count?: number; realmIndex?: number }
  | { type: 'alchemy_attempt'; count?: number }
  | { type: 'alchemy_success'; count?: number }
  | { type: 'dungeon_enter'; count?: number }
  | { type: 'dungeon_clear'; count?: number }
  | { type: 'gain_gold'; amount: number }
  | { type: 'gain_herb'; amount: number }
  | { type: 'gain_fragment'; amount: number }
  | { type: 'gain_artifact'; count?: number }
  | { type: 'gain_technique'; count?: number }
  | { type: 'play_time'; seconds: number }
  | { type: 'realm_reach'; realmIndex: number };

const DAILY_TASK_COUNT = 3;

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function scoreTask(taskId: string, seed: string): number {
  return hashString(`${seed}:${taskId}`);
}

function pickDailyTasks(sectId: SectId, today: string): SectTaskDefinition[] {
  const pool = getSectDailyTaskPool(sectId);
  const sectTasks = pool.filter(task => task.sectId === sectId).sort((a, b) => scoreTask(a.id, `${today}:${sectId}:sect`) - scoreTask(b.id, `${today}:${sectId}:sect`));
  const allTasks = pool.sort((a, b) => scoreTask(a.id, `${today}:${sectId}:all`) - scoreTask(b.id, `${today}:${sectId}:all`));

  const selected: SectTaskDefinition[] = [];
  const selectedIds = new Set<string>();

  if (sectTasks.length > 0) {
    selected.push(sectTasks[0]);
    selectedIds.add(sectTasks[0].id);
  }

  for (const task of allTasks) {
    if (selected.length >= DAILY_TASK_COUNT) break;
    if (selectedIds.has(task.id)) continue;
    selected.push(task);
    selectedIds.add(task.id);
  }

  return selected;
}

function getDailyClaimKey(taskId: string, date: string): string {
  return `daily:${date}:${taskId}`;
}

function getLifetimeProgressKey(type: SectTaskType): string {
  return type;
}

function getDailyProgressKey(type: SectTaskType, date: string): string {
  return `daily-progress:${date}:${type}`;
}

function clearDailyProgress(progress: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(progress).filter(([key]) => !key.startsWith('daily-progress:')));
}

function addProgress(progress: Record<string, number>, key: string, delta: number): Record<string, number> {
  return {
    ...progress,
    [key]: (progress[key] || 0) + delta,
  };
}

function setProgressMax(progress: Record<string, number>, key: string, value: number): Record<string, number> {
  return {
    ...progress,
    [key]: Math.max(progress[key] || 0, value),
  };
}

export function getSectLevelByContribution(value: number): number {
  let level = 1;
  for (let i = 0; i < SECT_LEVEL_REQUIREMENTS.length; i++) {
    if (value >= SECT_LEVEL_REQUIREMENTS[i]) level = i + 1;
  }
  return level;
}

export function ensureSectDailyTasks(state: GameState, today: string = getTodayISO()): GameState {
  if (!state.sectId) return state;
  if (state.sectDailyTaskDate === today && state.sectDailyTasks.length > 0) return state;

  const tasks = pickDailyTasks(state.sectId as SectId, today);
  return {
    ...state,
    sectDailyTasks: tasks.map(task => task.id),
    sectDailyTaskDate: today,
    sectClaimedTasks: state.sectClaimedTasks.filter(id => !id.startsWith('daily:')),
    sectTaskProgress: clearDailyProgress(state.sectTaskProgress || {}),
  };
}

export function updateSectTaskProgress(state: GameState, event: SectProgressEvent): GameState {
  if (!state.sectId) return state;

  let progress = { ...(state.sectTaskProgress || {}) };
  const progressDate = state.sectDailyTaskDate || getTodayISO();

  const addTrackedProgress = (type: SectTaskType, delta: number) => {
    progress = addProgress(progress, getLifetimeProgressKey(type), delta);
    progress = addProgress(progress, getDailyProgressKey(type, progressDate), delta);
  };

  const setTrackedProgressMax = (type: SectTaskType, value: number) => {
    progress = setProgressMax(progress, getLifetimeProgressKey(type), value);
    progress = setProgressMax(progress, getDailyProgressKey(type, progressDate), value);
  };

  switch (event.type) {
    case 'battle_win':
      addTrackedProgress('battle_count', event.count ?? 1);
      break;
    case 'kill':
      addTrackedProgress('kill_count', event.count ?? 1);
      break;
    case 'breakthrough_success':
      addTrackedProgress('breakthrough_count', event.count ?? 1);
      if (typeof event.realmIndex === 'number') {
        setTrackedProgressMax('realm_reach', event.realmIndex);
      }
      break;
    case 'alchemy_attempt':
      addTrackedProgress('alchemy_attempt', event.count ?? 1);
      break;
    case 'alchemy_success':
      addTrackedProgress('alchemy_success', event.count ?? 1);
      break;
    case 'dungeon_enter':
      addTrackedProgress('dungeon_enter', event.count ?? 1);
      break;
    case 'dungeon_clear':
      addTrackedProgress('dungeon_clear', event.count ?? 1);
      break;
    case 'gain_gold':
      addTrackedProgress('gold_total', event.amount);
      break;
    case 'gain_herb':
      addTrackedProgress('herb_total', event.amount);
      break;
    case 'gain_fragment':
      addTrackedProgress('fragment_total', event.amount);
      break;
    case 'gain_artifact':
      addTrackedProgress('artifact_gain', event.count ?? 1);
      break;
    case 'gain_technique':
      addTrackedProgress('technique_gain', event.count ?? 1);
      break;
    case 'play_time':
      if (event.seconds >= 1) {
        addTrackedProgress('play_time', Math.floor(event.seconds));
      }
      break;
    case 'realm_reach':
      setTrackedProgressMax('realm_reach', event.realmIndex);
      break;
  }

  return {
    ...state,
    sectTaskProgress: progress,
  };
}

export function getSectTaskProgressValue(state: GameState, task: SectTaskDefinition): number {
  const progressKey = task.category === 'daily'
    ? getDailyProgressKey(task.type, state.sectDailyTaskDate)
    : getLifetimeProgressKey(task.type);
  return state.sectTaskProgress?.[progressKey] || 0;
}

export function isSectTaskCompleted(state: GameState, task: SectTaskDefinition): boolean {
  return getSectTaskProgressValue(state, task) >= task.target;
}

export function isSectTaskClaimed(state: GameState, task: SectTaskDefinition): boolean {
  const claimedKey = task.category === 'daily'
    ? getDailyClaimKey(task.id, state.sectDailyTaskDate)
    : task.id;
  return state.sectClaimedTasks.includes(claimedKey);
}

export function refreshSectLevelAndPassives(state: GameState): GameState {
  if (!state.sectId) return state;

  const nextLevel = getSectLevelByContribution(state.sectTotalContributionEarned || state.sectContribution || 0);
  const passives = getSectPassives(state.sectId as SectId).filter(passive => passive.unlockLevel <= nextLevel);
  const nextPassiveIds = passives.map(passive => passive.id);
  const currentPassiveIds = state.sectUnlockedPassives || [];
  const newPassiveIds = nextPassiveIds.filter(id => !currentPassiveIds.includes(id));

  let nextState: GameState = {
    ...state,
    sectLevel: nextLevel,
    sectUnlockedPassives: nextPassiveIds,
  };

  if (nextLevel > state.sectLevel) {
    nextState = addLog(nextState, `🏯 门派等级提升至 ${nextLevel} 级！`);
  }

  for (const passiveId of newPassiveIds) {
    const passive = passives.find(item => item.id === passiveId);
    if (passive) {
      nextState = addLog(nextState, `✨ 解锁门派被动【${passive.name}】`);
    }
  }

  return nextState;
}

export function claimSectTaskReward(state: GameState, taskId: string): GameState {
  if (!state.sectId) return state;

  const task = getSectTaskById(taskId);
  if (!task) return state;
  if (task.category === 'daily' && !state.sectDailyTasks.includes(taskId)) return state;
  if (task.category === 'growth') {
    const growthTasks = getSectGrowthTasks(state.sectId as SectId);
    if (!growthTasks.some(item => item.id === taskId)) return state;
  }
  if (!isSectTaskCompleted(state, task)) return state;
  if (isSectTaskClaimed(state, task)) return state;

  const claimedKey = task.category === 'daily'
    ? getDailyClaimKey(task.id, state.sectDailyTaskDate)
    : task.id;

  let nextState: GameState = {
    ...state,
    sectContribution: state.sectContribution + task.rewardContribution,
    sectTotalContributionEarned: state.sectTotalContributionEarned + task.rewardContribution,
    sectClaimedTasks: [...state.sectClaimedTasks, claimedKey],
  };

  nextState = addLog(nextState, `📜 完成门派任务【${task.name}】，获得 ${task.rewardContribution} 点贡献`);
  return refreshSectLevelAndPassives(nextState);
}

export function getActiveSectPassives(state: GameState): SectPassiveDefinition[] {
  if (!state.sectId) return [];
  const activeIds = new Set(state.sectUnlockedPassives || []);
  return getSectPassives(state.sectId as SectId).filter(passive => activeIds.has(passive.id));
}

export function getSectGrowthBonuses(state: GameState): SectGrowthBonuses {
  const result: SectGrowthBonuses = {
    atkBonus: 0,
    defBonus: 0,
    hpBonus: 0,
    critRateBonus: 0,
    critDmgBonus: 0,
    expBonus: 0,
    alchemyBonus: 0,
    dropBonus: 0,
    breakthroughBonus: 0,
    battleGoldBonus: 0,
    offlineBonus: 0,
    dungeonBonus: 0,
    extraDropChance: 0,
    doubleAlchemyChance: 0,
    lowHpAtkBonus: 0,
    deathSaveChance: 0,
    breakthroughFailProtect: 0,
    doubleTechChance: 0,
    buffDurationBonus: 0,
  };

  const activePassives = getActiveSectPassives(state);
  const effectMap: Record<SectPassiveEffectType, keyof SectGrowthBonuses> = {
    atk_bonus: 'atkBonus',
    def_bonus: 'defBonus',
    hp_bonus: 'hpBonus',
    crit_rate_bonus: 'critRateBonus',
    crit_dmg_bonus: 'critDmgBonus',
    exp_bonus: 'expBonus',
    alchemy_bonus: 'alchemyBonus',
    drop_bonus: 'dropBonus',
    breakthrough_bonus: 'breakthroughBonus',
    battle_gold_bonus: 'battleGoldBonus',
    offline_bonus: 'offlineBonus',
    dungeon_bonus: 'dungeonBonus',
    extra_drop_chance: 'extraDropChance',
    double_alchemy_chance: 'doubleAlchemyChance',
    low_hp_atk_bonus: 'lowHpAtkBonus',
    death_save_chance: 'deathSaveChance',
    breakthrough_fail_protect: 'breakthroughFailProtect',
    double_tech_chance: 'doubleTechChance',
    buff_duration_bonus: 'buffDurationBonus',
  };

  for (const passive of activePassives) {
    const key = effectMap[passive.effect.type];
    if (key) result[key] += passive.effect.value;
  }

  return result;
}
