import { Attributes, BonusAttributes, getRealm } from '../data/realms';
import { GameState } from '../data/gameState';
import { getTechBonuses, getArtifactBonuses, getMasteryBonuses, getArtifactEnhancedBaseStats, getArtifactTemplate, EquipSlot } from '../data/equipment';
import { getActiveBuffEffectiveMultiplier } from '../data/alchemy';
import { getSect } from '../data/sect';
import { getRealmStaminaMax, getRealmStaminaRegen } from '../data/dungeon';
import { getSectGrowthBonuses } from './sectEngine';

/** 计算玩家最终基础属性 = 境界基础 * (1 + 功法倍率 + 门派倍率 + 转生加成 + 精通加成) + 装备固定值 */
export function calcFinalAttributes(state: GameState): Attributes {
  const base = getRealm(state.realmIndex).attributes;
  const sectGrowth = getSectGrowthBonuses(state);

  // 功法倍率加成
  let techAtkMul = 0, techDefMul = 0, techHpMul = 0;
  if (state.equippedTechnique) {
    const b = getTechBonuses(state.equippedTechnique);
    techAtkMul = b.atkBonus;
    techDefMul = b.defBonus;
    techHpMul = b.hpBonus;
  }

  // 法宝加成（词条 + 基础属性）
  let artAtk = 0, artDef = 0, artHp = 0;
  const slots: EquipSlot[] = ['weapon', 'chest', 'pants', 'boots', 'accessory'];
  const rebirthCount = state.rebirthCount ?? 0;
  for (const slot of slots) {
    const art = state.equippedArtifacts[slot];
    if (art) {
      const b = getArtifactBonuses(art);
      artAtk += b.atk;
      artDef += b.def;
      artHp += b.hp;
      const tmpl = getArtifactTemplate(art.templateId);
      if (tmpl) {
        const base = getArtifactEnhancedBaseStats(slot, tmpl.realmTier, art.quality, art.level, rebirthCount);
        artAtk += base.atk;
        artDef += base.def;
        artHp  += base.hp;
      }
    }
  }

  // 门派加成
  let sectAtkMul = 0, sectDefMul = 0, sectHpMul = 0;
  if (state.sectId) {
    const sect = getSect(state.sectId);
    if (sect) {
      sectAtkMul = sect.bonus.atkBonus;
      sectDefMul = sect.bonus.defBonus;
      sectHpMul = sect.bonus.hpBonus;
    }
  }

  // 转生永久加成
  const rp = state.rebirthPerks;
  const rpAtk = rp ? rp.atkBonus : 0;
  const rpDef = rp ? rp.defBonus : 0;
  const rpHp  = rp ? rp.hpBonus  : 0;

  // 功法精通永久加成
  const mb = getMasteryBonuses(state.masteredTechniques ?? []);

  // buff加成
  let buffAtkMul = 0, buffDefMul = 0, buffAllMul = 0, buffHpMul = 0;
  if (state.buffs) {
    for (const buff of state.buffs) {
      const effectiveMultiplier = getActiveBuffEffectiveMultiplier(buff, state.realmIndex);
      if (buff.type === 'atk_boost') buffAtkMul += effectiveMultiplier;
      else if (buff.type === 'def_boost') buffDefMul += effectiveMultiplier;
      else if (buff.type === 'all_boost') buffAllMul += effectiveMultiplier;
      else if (buff.type === 'hp_boost') buffHpMul += effectiveMultiplier;
    }
  }

  return {
    attack:  Math.floor((base.attack  * (1 + techAtkMul + sectAtkMul + sectGrowth.atkBonus + rpAtk + mb.atkBonus) + artAtk) * (1 + buffAtkMul + buffAllMul)),
    defense: Math.floor((base.defense * (1 + techDefMul + sectDefMul + sectGrowth.defBonus + rpDef + mb.defBonus) + artDef) * (1 + buffDefMul + buffAllMul)),
    hp:      Math.floor((base.hp      * (1 + techHpMul  + sectHpMul  + sectGrowth.hpBonus  + rpHp  + mb.hpBonus)  + artHp)  * (1 + buffHpMul  + buffAllMul)),
  };
}

export function getCharacterPower(attrs: Attributes): number {
  return attrs.attack + attrs.defense + Math.floor(attrs.hp / 10);
}

/** 计算玩家附加属性（暴击率/暴击伤害/闪避），来源装备+功法，不受境界影响 */
export function calcBonusAttributes(state: GameState): BonusAttributes {
  const BASE_CRIT_RATE = 0.05; // 基础暴击率5%
  const BASE_CRIT_DMG  = 0.10; // 基础暴击伤害+10%
  const BASE_DODGE     = 0;    // 基础闪避0%
  const MAX_CRIT_RATE  = 1.0;
  const MAX_CRIT_DMG   = 50.0;
  const MAX_DODGE      = 0.75;
  const sectGrowth = getSectGrowthBonuses(state);

  let critRate = BASE_CRIT_RATE;
  let critDmg  = BASE_CRIT_DMG;
  let dodge    = BASE_DODGE;

  const slots: EquipSlot[] = ['weapon', 'chest', 'pants', 'boots', 'accessory'];
  const rc = state.rebirthCount ?? 0;
  for (const slot of slots) {
    const art = state.equippedArtifacts[slot];
    if (art) {
      const b = getArtifactBonuses(art);
      critRate += b.critRate;
      critDmg  += b.critDmg;
      dodge    += b.dodge;
      const tmpl = getArtifactTemplate(art.templateId);
      if (tmpl) {
        const base = getArtifactEnhancedBaseStats(slot, tmpl.realmTier, art.quality, art.level, rc);
        critRate += base.critRate;
        critDmg  += base.critDmg;
        dodge    += base.dodge;
      }
    }
  }

  // 功法附加属性
  if (state.equippedTechnique) {
    const b = getTechBonuses(state.equippedTechnique);
    critRate += b.critRateBonus;
    critDmg  += b.critDmgBonus;
    dodge    += b.dodgeBonus;
  }

  // 功法精通永久加成
  const mb = getMasteryBonuses(state.masteredTechniques ?? []);
  critRate += mb.critRateBonus;
  critDmg  += mb.critDmgBonus;
  dodge    += mb.dodgeBonus;
  critRate += sectGrowth.critRateBonus;
  critDmg  += sectGrowth.critDmgBonus;

  // 门派暴击率加成
  if (state.sectId) {
    const sect = getSect(state.sectId);
    if (sect) critRate += sect.bonus.critRateBonus;
  }

  // 转生永久暴击率加成
  const rp = state.rebirthPerks;
  if (rp) critRate += rp.critRateBonus;

  // 丹药 buff 加成
  if (state.buffs) {
    for (const buff of state.buffs) {
      if (buff.type === 'crit_boost') critRate += getActiveBuffEffectiveMultiplier(buff, state.realmIndex);
    }
  }

  return {
    critRate: Math.min(critRate, MAX_CRIT_RATE),
    critDmg:  Math.min(critDmg,  MAX_CRIT_DMG),
    dodge:    Math.min(dodge,    MAX_DODGE),
  };
}

/** 获取修炼速度倍率 (1 + 功法expBonus + 装备expRate + 丹药buff + 门派加成) */
export function getExpMultiplier(state: GameState): number {
  let mul = 1;
  const sectGrowth = getSectGrowthBonuses(state);
  if (state.equippedTechnique) {
    const b = getTechBonuses(state.equippedTechnique);
    mul += b.expBonus;
  }
  // 装备词条修炼速度加成
  const artSlots: EquipSlot[] = ['weapon', 'chest', 'pants', 'boots', 'accessory'];
  for (const slot of artSlots) {
    const art = state.equippedArtifacts[slot];
    if (art) {
      const b = getArtifactBonuses(art);
      mul += b.expRate;
    }
  }
  if (state.buffs) {
    for (const buff of state.buffs) {
      if (buff.type === 'exp_boost') mul += getActiveBuffEffectiveMultiplier(buff, state.realmIndex);
    }
  }
  if (state.sectId) {
    const sect = getSect(state.sectId);
    if (sect) mul += sect.bonus.expBonus;
  }
  mul += sectGrowth.expBonus;
  if (state.rebirthPerks) mul += state.rebirthPerks.expBonus;
  const mb = getMasteryBonuses(state.masteredTechniques ?? []);
  mul += mb.expBonus;
  return mul;
}

/** 获取炼丹成功率加成 */
export function getAlchemyBonus(state: GameState): number {
  let bonus = getSectGrowthBonuses(state).alchemyBonus;
  if (state.sectId) {
    const sect = getSect(state.sectId);
    if (sect) bonus += sect.bonus.alchemyBonus;
  }
  if (state.rebirthPerks) bonus += state.rebirthPerks.alchemyBonus;
  return bonus;
}

/** 获取掉落率加成 */
export function getDropBonus(state: GameState): number {
  let bonus = getSectGrowthBonuses(state).dropBonus;
  if (state.sectId) {
    const sect = getSect(state.sectId);
    if (sect) bonus += sect.bonus.dropBonus;
  }
  if (state.rebirthPerks) bonus += state.rebirthPerks.dropBonus;
  return bonus;
}

/** 获取最大体力（含境界加成 + 轮回永久加成） */
export function getStaminaMax(state: GameState): number {
  const base = getRealmStaminaMax(state.realmIndex);
  const bonus = state.rebirthPerks ? Math.floor(state.rebirthPerks.staminaBonus) : 0;
  return base + bonus;
}

/** 获取体力恢复速度（每秒，含境界加成） */
export function getStaminaRegen(state: GameState): number {
  return getRealmStaminaRegen(state.realmIndex);
}

/** 获取轮回突破成功率永久加成 */
export function getBreakthroughPerkBonus(state: GameState): number {
  return state.rebirthPerks ? state.rebirthPerks.breakthroughBonus : 0;
}

/** 获取门派成长突破成功率加成 */
export function getSectGrowthBreakthroughBonus(state: GameState): number {
  return getSectGrowthBonuses(state).breakthroughBonus;
}

/** 获取秘境奖励倍率加成 */
export function getDungeonBonus(state: GameState): number {
  return state.rebirthPerks ? state.rebirthPerks.dungeonBonus : 0;
}

/** 获取战斗灵石收益加成 */
export function getBattleGoldBonus(state: GameState): number {
  return (state.rebirthPerks ? state.rebirthPerks.battleGoldBonus : 0) + getSectGrowthBonuses(state).battleGoldBonus;
}

/** 获取离线收益倍率加成 */
export function getOfflineBonus(state: GameState): number {
  return getSectGrowthBonuses(state).offlineBonus;
}
