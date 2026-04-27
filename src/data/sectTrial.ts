const STANDARD_ATK = 100_000_000;
const STANDARD_DEF = 75_000_000;
const STANDARD_HP = 1_000_000_000;

export interface TrialBossDefinition {
  floor: number;
  name: string;
  isGuardian: boolean;
  attack: number;
  defense: number;
  hp: number;
}

export interface TrialFloorReward {
  floor: number;
  contribution: number;
  gold: number;
}

export interface TrialBuffDefinition {
  maxFloor: number;
  expBoost: number;
  dropBoost: number;
  atkBoost: number;
}

function calcTrialBoss(floor: number, isGuardian: boolean): { attack: number; defense: number; hp: number } {
  const coeff = 0.05 + 0.03 * floor;
  const guardianMul = isGuardian ? 1.2 : 1.0;
  return {
    attack: Math.floor(STANDARD_ATK * coeff * guardianMul),
    defense: Math.floor(STANDARD_DEF * coeff * guardianMul),
    hp: Math.floor(STANDARD_HP * coeff * guardianMul),
  };
}

const GUARDIAN_NAMES = ['守卫', '将领', '霸主', '守护者', '尊者', '护法', '圣兽', '真灵', '天君', '仙尊'];

function getBossName(floor: number, isGuardian: boolean): string {
  if (isGuardian) {
    const idx = Math.floor((floor - 1) / 5) % GUARDIAN_NAMES.length;
    return `第${floor}层·${GUARDIAN_NAMES[idx]}`;
  }
  return `第${floor}层·试炼魔物`;
}

export const TRIAL_BOSSES: TrialBossDefinition[] = Array.from({ length: 50 }, (_, i) => {
  const floor = i + 1;
  const isGuardian = floor % 5 === 0;
  const stats = calcTrialBoss(floor, isGuardian);
  return { floor, name: getBossName(floor, isGuardian), isGuardian, ...stats };
});

export const TRIAL_FLOOR_REWARDS: TrialFloorReward[] = Array.from({ length: 50 }, (_, i) => {
  const floor = i + 1;
  const isGuardian = floor % 5 === 0;
  if (floor === 50) return { floor, contribution: 500, gold: floor * 50000 };
  if (floor % 10 === 0) return { floor, contribution: 100, gold: floor * 20000 };
  if (isGuardian) return { floor, contribution: 50, gold: floor * 15000 };
  return { floor, contribution: 20, gold: floor * 5000 };
});

export const TRIAL_BUFFS: TrialBuffDefinition[] = [
  { maxFloor: 0, expBoost: 0, dropBoost: 0, atkBoost: 0 },
  { maxFloor: 9, expBoost: 0.02, dropBoost: 0, atkBoost: 0 },
  { maxFloor: 19, expBoost: 0.05, dropBoost: 0.03, atkBoost: 0 },
  { maxFloor: 29, expBoost: 0.05, dropBoost: 0.03, atkBoost: 0 },
  { maxFloor: 39, expBoost: 0.08, dropBoost: 0.05, atkBoost: 0 },
  { maxFloor: 49, expBoost: 0.10, dropBoost: 0.08, atkBoost: 0.05 },
  { maxFloor: 50, expBoost: 0.15, dropBoost: 0.10, atkBoost: 0.08 },
];

export function getTrialBoss(floor: number): TrialBossDefinition | undefined {
  if (floor < 1 || floor > 50) return undefined;
  return TRIAL_BOSSES[floor - 1];
}

export function getTrialFloorReward(floor: number): TrialFloorReward | undefined {
  return TRIAL_FLOOR_REWARDS[floor - 1];
}

export function getTrialBuffByMaxFloor(maxFloor: number): TrialBuffDefinition {
  for (let i = 0; i < TRIAL_BUFFS.length; i++) {
    if (maxFloor <= TRIAL_BUFFS[i].maxFloor) return TRIAL_BUFFS[i];
  }
  return TRIAL_BUFFS[TRIAL_BUFFS.length - 1];
}
