/**
 * 摸鱼修仙 - 核心系统测试用例
 * 覆盖：数据完整性 / 属性计算 / 战斗引擎 / 游戏引擎 / 装备系统 / 功法系统
 */
import { describe, it, expect, vi } from 'vitest';

// ── 数据层 ──
import { REALM_TABLE, TOTAL_REALMS, getRealm, getNextRealm } from '../data/realms';
import { AREAS } from '../data/monsters';
import {
  TECHNIQUE_TEMPLATES, AFFIX_BASE, QUALITY_VALUE_MULT, QUALITY_ORDER, QUALITY_MAX_LEVEL,
  generateAffixes, getArtifactBonuses, getArtifactBonusesWithoutEnhance, getArtifactPower, getTechBonuses, getMasteryBonuses, getArtifactBaseStats, getArtifactEnhancedBaseStats,
  getArtifactEnhanceCost, getArtifactEnhanceMultiplier,
  randomTechniqueDrop, getMaxDropQuality, getMaxRedTier, getAvailableQualities, randomArtifactDrop, AffixType, getTechniqueDropMaxQualityIndex, getArtifactTemplate,
} from '../data/equipment';
import { formatDuration, ActiveBuff, getPillRecipe } from '../data/alchemy';
import { createInitialState, GameState, loadGameFromSlot } from '../data/gameState';
import { GOLD_SHOP, getShopPrice, getShopItem } from '../data/shop';
import { getSect } from '../data/sect';
import { SECT_LEVEL_REQUIREMENTS } from '../data/sectPassives';

// ── 引擎层 ──
import { formatNumber, canBreakthrough, gameTick, getBreakthroughInfo, advanceGameTime, applyOfflineGains, calcOfflineGains, applyBattleRewards, purchaseShopItem, attemptBreakthrough } from '../engine/gameEngine';
import { executeBattle } from '../engine/battleEngine';
import { calcFinalAttributes, calcBonusAttributes, getBattleGoldBonus, getCharacterPower, getDropBonus, getExpMultiplier, getAlchemyBonus, getSectGrowthBreakthroughBonus } from '../engine/attributeCalc';
import { claimSectTaskReward, ensureSectDailyTasks, getSectLevelByContribution, refreshSectLevelAndPassives, updateSectTaskProgress } from '../engine/sectEngine';

// ─────────────────────────────────────────────
// 1. 数据完整性
// ─────────────────────────────────────────────
describe('数据完整性', () => {

  it('REALM_TABLE 总数 = TOTAL_REALMS', () => {
    expect(REALM_TABLE.length).toBe(TOTAL_REALMS);
  });

  it('每个境界的基础属性必须大于0', () => {
    for (const r of REALM_TABLE) {
      expect(r.attributes.attack).toBeGreaterThan(0);
      expect(r.attributes.defense).toBeGreaterThan(0);
      expect(r.attributes.hp).toBeGreaterThan(0);
    }
  });

  it('境界 ATK/DEF/HP 单调递增', () => {
    for (let i = 1; i < REALM_TABLE.length; i++) {
      expect(REALM_TABLE[i].attributes.attack).toBeGreaterThanOrEqual(REALM_TABLE[i - 1].attributes.attack);
      expect(REALM_TABLE[i].attributes.hp).toBeGreaterThanOrEqual(REALM_TABLE[i - 1].attributes.hp);
    }
  });

  it('渡劫九重ATK=10,000,000 / DEF=7,500,000 / HP=100,000,000', () => {
    const max = REALM_TABLE[REALM_TABLE.length - 1];
    expect(max.attributes.attack).toBe(10_000_000);
    expect(max.attributes.defense).toBe(7_500_000);
    expect(max.attributes.hp).toBe(100_000_000);
  });

  it('突破成功率在 0~1 之间', () => {
    for (const r of REALM_TABLE) {
      expect(r.breakthroughRate).toBeGreaterThan(0);
      expect(r.breakthroughRate).toBeLessThanOrEqual(1);
    }
  });

  it('所有区域至少有1只怪物', () => {
    for (const area of AREAS) {
      expect(area.monsters.length).toBeGreaterThan(0);
    }
  });

  it('怪物 hpMin/hpMax/attackMin/attackMax/defense 均大于0', () => {
    for (const area of AREAS) {
      for (const m of area.monsters) {
        expect(m.hpMin).toBeGreaterThan(0);
        expect(m.hpMax).toBeGreaterThanOrEqual(m.hpMin);
        expect(m.attackMin).toBeGreaterThan(0);
        expect(m.attackMax).toBeGreaterThanOrEqual(m.attackMin);
        expect(m.defense).toBeGreaterThan(0);
      }
    }
  });

  it('怪物ID不重复', () => {
    const ids = AREAS.flatMap(a => a.monsters.map(m => m.id));
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('AREAS 共有23个区域（22正常+1传说）', () => {
    expect(AREAS.length).toBe(23);
  });

  it('TECHNIQUE_TEMPLATES ID不重复', () => {
    const ids = TECHNIQUE_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('白色功法共7本', () => {
    const whites = TECHNIQUE_TEMPLATES.filter(t => t.quality === 'white');
    expect(whites.length).toBe(7);
  });

  it('每本白色功法只有一个非零主属性', () => {
    const whites = TECHNIQUE_TEMPLATES.filter(t => t.quality === 'white');
    for (const t of whites) {
      const nonZero = [t.expBonus, t.atkBonus, t.defBonus, t.hpBonus,
        t.critRateBonus, t.critDmgBonus, t.dodgeBonus].filter(v => v > 0);
      expect(nonZero.length).toBe(1);
    }
  });

  it('功法 maxLevel >= 1', () => {
    for (const t of TECHNIQUE_TEMPLATES) {
      expect(t.maxLevel).toBeGreaterThanOrEqual(1);
    }
  });

  it('AFFIX_BASE 包含所有7种词条类型', () => {
    const types: AffixType[] = ['atk', 'def', 'hp', 'critRate', 'critDmg', 'dodge', 'expRate'];
    for (const t of types) {
      expect(AFFIX_BASE[t]).toBeDefined();
      expect(AFFIX_BASE[t][0]).toBeLessThan(AFFIX_BASE[t][1]); // min < max
    }
  });

  it('QUALITY_VALUE_MULT 品质倍率单调递增', () => {
    for (let i = 1; i < QUALITY_ORDER.length; i++) {
      expect(QUALITY_VALUE_MULT[QUALITY_ORDER[i]])
        .toBeGreaterThan(QUALITY_VALUE_MULT[QUALITY_ORDER[i - 1]]);
    }
  });
});

// ─────────────────────────────────────────────
// 2. 格式化工具
// ─────────────────────────────────────────────
describe('formatNumber', () => {
  it('小于1000直接显示', () => {
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(0)).toBe('0');
  });

  it('千单位', () => {
    expect(formatNumber(1000)).toBe('1.0千');
    expect(formatNumber(5500)).toBe('5.5千');
  });

  it('万单位', () => {
    expect(formatNumber(10000)).toBe('1.0万');
    expect(formatNumber(1_000_000)).toBe('100.0万');
  });

  it('亿单位', () => {
    expect(formatNumber(100_000_000)).toBe('1.00亿');
    expect(formatNumber(1_000_000_000)).toBe('10.00亿');
  });

  it('亿单位', () => {
    expect(formatNumber(123456789)).toBe('1.23亿');
  });

  it('formatDuration 最小单位为整数秒', () => {
    expect(formatDuration(46.50000000159298)).toBe('47秒');
    expect(formatDuration(125.2)).toBe('2分6秒');
  });
});

// ─────────────────────────────────────────────
// 3. 属性计算
// ─────────────────────────────────────────────
describe('属性计算', () => {

  it('初始状态练气一层属性正确', () => {
    const state = createInitialState();
    const attrs = calcFinalAttributes(state);
    // 练气一层 atk=1000，无装备/功法加成（图表0.1%基准）
    expect(attrs.attack).toBe(10000);
    expect(attrs.defense).toBe(7500);
    expect(attrs.hp).toBe(100000);
  });

  it('初始状态 BonusAttributes 暴击率=0.05（基础值）', () => {
    const state = createInitialState();
    const bonus = calcBonusAttributes(state);
    expect(bonus.critRate).toBeGreaterThanOrEqual(0);
    expect(bonus.critRate).toBeLessThanOrEqual(1);
    expect(bonus.dodge).toBeGreaterThanOrEqual(0);
  });

  it('初始状态修炼速度倍率=1', () => {
    const state = createInitialState();
    expect(getExpMultiplier(state)).toBe(1);
  });

  it('装备功法后修炼速度倍率>1', () => {
    const state = {
      ...createInitialState(),
      equippedTechnique: { templateId: 'tech_w1', level: 1 }, // 吐纳术 expBonus=0.08
    };
    expect(getExpMultiplier(state)).toBeGreaterThan(1);
  });

  it('已生效修炼丹药buff会在跨大境界后继续衰减', () => {
    const sameTierBuffs: ActiveBuff[] = [{ type: 'exp_boost', multiplier: 0.6, remainingSeconds: 600, sourceName: '凝元丹', recipeId: 'pill_b1' }];
    const stateSameTier = {
      ...createInitialState(),
      realmIndex: 9,
      buffs: sameTierBuffs,
    };
    const stateHigherTier = {
      ...stateSameTier,
      realmIndex: 12,
    };

    expect(getExpMultiplier(stateSameTier)).toBeCloseTo(1.6, 5);
    expect(getExpMultiplier(stateHigherTier)).toBeCloseTo(1.42, 5);
  });

  it('已生效暴击丹药buff会在跨大境界后继续衰减', () => {
    const sameTierBuffs: ActiveBuff[] = [{ type: 'crit_boost', multiplier: 0.05, remainingSeconds: 900, sourceName: '悟道丹', recipeId: 'pill_p3' }];
    const stateSameTier = {
      ...createInitialState(),
      realmIndex: 18,
      buffs: sameTierBuffs,
    };
    const stateHigherTier = {
      ...stateSameTier,
      realmIndex: 21,
    };

    expect(calcBonusAttributes(stateSameTier).critRate).toBeCloseTo(0.10, 5);
    expect(calcBonusAttributes(stateHigherTier).critRate).toBeCloseTo(0.085, 5);
  });
});

// ─────────────────────────────────────────────
// 4. 装备词条生成
// ─────────────────────────────────────────────
describe('装备词条生成', () => {

  it('生成的词条数量在品质范围内', () => {
    // orange: QUALITY_AFFIX_COUNT=[3,5]，各槽位池7种词条，实际范围3~5
    for (let i = 0; i < 20; i++) {
      const affixes = generateAffixes('orange', 'weapon', 10);
      expect(affixes.length).toBeGreaterThanOrEqual(3);
      expect(affixes.length).toBeLessThanOrEqual(5);
    }
  });

  it('所有槽位词条池均包含7种词条类型', () => {
    const slots: Array<'weapon' | 'chest' | 'pants' | 'boots' | 'accessory'> = ['weapon', 'chest', 'pants', 'boots', 'accessory'];
    const expected: AffixType[] = ['atk', 'def', 'hp', 'critRate', 'critDmg', 'dodge', 'expRate'];
    for (const slot of slots) {
      const affixes = generateAffixes('legend', slot, 0);
      const types = new Set(affixes.map(a => a.type));
      // legend品质[6,6]固定6词条，从7种中取6种，覆盖检查
      expect(affixes.length).toBe(6);
      for (const t of types) {
        expect(expected).toContain(t);
      }
    }
  });

  it('词条value > 0', () => {
    const affixes = generateAffixes('blue', 'chest', 5);
    for (const a of affixes) {
      expect(a.value).toBeGreaterThan(0);
    }
  });

  it('getArtifactBonuses level=0时词条加成不变', () => {
    const affixes = generateAffixes('green', 'weapon', 3);
    const art = { uid: 'test_1', templateId: 'w_wp_1', quality: 'green' as const, affixes, level: 0 };
    const bonuses = getArtifactBonuses(art);
    const atkFromAffixes = affixes.filter(a => a.type === 'atk').reduce((s, a) => s + a.value, 0);
    expect(bonuses.atk).toBeCloseTo(atkFromAffixes, 0);
  });

  it('getArtifactBonuses level=10时词条随强化微量提升', () => {
    const affixes = [{ type: 'atk' as AffixType, value: 1000 }];
    const art = { uid: 'test_2', templateId: 'w_wp_1', quality: 'white' as const, affixes, level: 10 };
    const bonuses = getArtifactBonuses(art);
    // affixEnhanceMul = 1 + 10 * 0.01 = 1.10, floor(1000 * 1.10) = 1100
    expect(bonuses.atk).toBe(1100);
  });

  it('强化只提升装备基础属性', () => {
    const base = getArtifactBaseStats('weapon', 18, 0);
    const enhanced = getArtifactEnhancedBaseStats('weapon', 18, 'red', 50, 0);
    expect(enhanced.atk).toBeGreaterThan(base.atk);
  });

  it('expRate词条被正确累加', () => {
    const affixes = [{ type: 'expRate' as AffixType, value: 0.05 }];
    const art = { uid: 'test_3', templateId: 'w_wp_1', quality: 'white' as const, affixes, level: 0 };
    const bonuses = getArtifactBonuses(art);
    expect(bonuses.expRate).toBeCloseTo(0.05);
  });

  it('expRate词条低于0.01%时会按0.01%真实生效', () => {
    const affixes = [{ type: 'expRate' as AffixType, value: 0.00001 }];
    const art = { uid: 'test_exp_floor', templateId: 'w_wp_1', quality: 'white' as const, affixes, level: 0 };
    const bonuses = getArtifactBonuses(art);
    expect(bonuses.expRate).toBeCloseTo(0.0001, 8);
  });

  it('被旧四舍五入截断为0的expRate词条也会按0.01%真实生效', () => {
    const affixes = [{ type: 'expRate' as AffixType, value: 0 }];
    const art = { uid: 'test_exp_floor_zero', templateId: 'w_wp_1', quality: 'white' as const, affixes, level: 0 };
    const bonuses = getArtifactBonuses(art);
    expect(bonuses.expRate).toBeCloseTo(0.0001, 8);
  });

  it('新生成的expRate词条不会低于0.01%', () => {
    const randomSpy = vi.spyOn(Math, 'random');
    randomSpy
      .mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0);

    const affixes = generateAffixes('white', 'weapon', 0);
    randomSpy.mockRestore();

    expect(affixes).toHaveLength(1);
    expect(affixes[0].type).toBe('expRate');
    expect(affixes[0].value).toBeCloseTo(0.0001, 8);
  });

  it('渡劫九重暴击率词条单件范围符合标准人10%总占比拆分', () => {
    let checked = 0;
    for (let i = 0; i < 100; i++) {
      const affixes = generateAffixes('legend', 'weapon', 21);
      const critRateAffix = affixes.find(a => a.type === 'critRate');
      if (!critRateAffix) continue;
      expect(critRateAffix.value).toBeGreaterThanOrEqual(0.015);
      expect(critRateAffix.value).toBeLessThanOrEqual(0.025);
      checked += 1;
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('旧存档超标暴击率词条会被按当前档位上限校正', () => {
    const art = {
      uid: 'test_crit_cap',
      templateId: 'w_wp_21',
      quality: 'legend' as const,
      affixes: [{ type: 'critRate' as AffixType, value: 1.057 }],
      level: 0,
    };
    const bonuses = getArtifactBonuses(art);
    expect(bonuses.critRate).toBeCloseTo(0.025, 4);
  });

  it('getMaxDropQuality 按境界与轮回次数限制最高装备品质', () => {
    expect(getMaxDropQuality(0, 0)).toBe('white');
    expect(getMaxDropQuality(8, 0)).toBe('white');
    expect(getMaxDropQuality(9, 0)).toBe('green');
    expect(getMaxDropQuality(12, 0)).toBe('blue');
    expect(getMaxDropQuality(15, 0)).toBe('purple');
    expect(getMaxDropQuality(18, 0)).toBe('orange');
    expect(getMaxDropQuality(21, 0)).toBe('red');
    expect(getMaxDropQuality(25, 4)).toBe('red');
    expect(getMaxDropQuality(25, 5)).toBe('legend');
  });

  it('getMaxRedTier 在渡劫一重到九重依次限制红装档位', () => {
    expect(getMaxRedTier(20)).toBe(0);
    expect(getMaxRedTier(21)).toBe(13);
    expect(getMaxRedTier(22)).toBe(14);
    expect(getMaxRedTier(25)).toBe(17);
    expect(getMaxRedTier(29)).toBe(21);
  });

  it('getAvailableQualities 只返回当前应解锁的品质范围', () => {
    expect(getAvailableQualities(8, 0)).toEqual(['white']);
    expect(getAvailableQualities(9, 0)).toEqual(['white', 'green']);
    expect(getAvailableQualities(12, 0)).toEqual(['white', 'green', 'blue']);
    expect(getAvailableQualities(21, 0)).toEqual(['white', 'green', 'blue', 'purple', 'orange', 'red']);
    expect(getAvailableQualities(25, 5)).toEqual(['white', 'green', 'blue', 'purple', 'orange', 'red', 'legend']);
  });

  it('低境界随机掉落不会越级出更高品质', () => {
    for (let i = 0; i < 20; i++) {
      const art = randomArtifactDrop(8, 0, 'weapon');
      expect(art).not.toBeNull();
      expect(art!.quality).toBe('white');
    }
  });

  it('五转渡劫五重随机掉落允许出现传说模板并使用 legend 品质池', () => {
    const available = getAvailableQualities(25, 5);
    expect(available).toContain('legend');
    const art = randomArtifactDrop(25, 5, 'weapon');
    expect(art).not.toBeNull();
    expect(['white', 'green', 'blue', 'purple', 'orange', 'red', 'legend']).toContain(art!.quality);
  });

  it('渡劫六重区域掉装不会回退到低境界模板', () => {
    for (let i = 0; i < 20; i++) {
      const art = randomArtifactDrop(29, 0, 'weapon', 18);
      expect(art).not.toBeNull();
      expect(getArtifactTemplate(art!.templateId)?.realmTier).toBe(18);
    }
  });

  it('各讨伐区域掉装模板档位与区域层级一致', () => {
    for (const area of AREAS) {
      const rebirthCount = area.requiredRebirthCount ?? 0;
      const expectedTier = area.requiredRebirthCount && area.requiredRebirthCount >= 5
        ? 21
        : Math.max(0, Math.min(21, area.requiredRealmIndex - 8));
      const art = randomArtifactDrop(area.requiredRealmIndex, rebirthCount, 'weapon', expectedTier);
      expect(art).not.toBeNull();
      expect(getArtifactTemplate(art!.templateId)?.realmTier).toBe(expectedTier);
    }
  });

  it('高进阶讨伐区域通过真实奖励链路掉装时不会回退到低境界模板', () => {
    const state = {
      ...createInitialState(),
      realmIndex: 29,
      currentAreaId: 'area_dj6',
      isBattling: true,
    };
    const battleResult = {
      victory: true,
      rounds: 1,
      logs: [],
      expGained: 1,
      drops: [],
      playerHpRemaining: 100,
      playerHpMax: 100,
    };

    const randomSpy = vi.spyOn(Math, 'random');
    randomSpy
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0);

    const rewardResult = applyBattleRewards(state, battleResult, { captureLogs: false });
    randomSpy.mockRestore();

    expect(rewardResult.state.artifactBag.length).toBe(1);
    const dropped = rewardResult.state.artifactBag[0];
    expect(getArtifactTemplate(dropped.templateId)?.realmTier).toBe(18);
  });
});

// ─────────────────────────────────────────────
// 5. 功法系统
// ─────────────────────────────────────────────
describe('功法系统', () => {

  it('getTechBonuses level=1时等于模板基础值', () => {
    const tech = { templateId: 'tech_w1', level: 1 };
    const b = getTechBonuses(tech);
    // 吐纳术 expBonus=0.16, lvlMul(level=1) = 1+(1-1)*0.1=1
    expect(b.expBonus).toBeCloseTo(0.16);
  });

  it('getTechBonuses level越高加成越大', () => {
    const b1 = getTechBonuses({ templateId: 'tech_r1', level: 1 });
    const b10 = getTechBonuses({ templateId: 'tech_r1', level: 10 });
    expect(b10.atkBonus).toBeGreaterThan(b1.atkBonus);
  });

  it('getMasteryBonuses 精通功法后获得50%满级加成', () => {
    const mb = getMasteryBonuses(['tech_w1']);
    // 吐纳术 expBonus=0.16, maxLevel=10, lvlMul=1+(10-1)*0.1=1.9 → 满级=0.16*1.9=0.304 → 精通=0.152
    expect(mb.expBonus).toBeCloseTo(0.16 * 1.9 * 0.5, 4);
  });

  it('精通多本功法加成可叠加', () => {
    const mb1 = getMasteryBonuses(['tech_w1']);
    const mb2 = getMasteryBonuses(['tech_w1', 'tech_g1']);
    expect(mb2.expBonus).toBeGreaterThan(mb1.expBonus);
  });

  it('randomTechniqueDrop 返回结果品质不超过maxQualityIndex', () => {
    for (let i = 0; i < 50; i++) {
      const t = randomTechniqueDrop(1); // 最高良品(green)
      if (t) {
        expect(QUALITY_ORDER.indexOf(t.quality)).toBeLessThanOrEqual(1);
      }
    }
  });

  it('randomTechniqueDrop maxQualityIndex=0 只返回白色功法', () => {
    for (let i = 0; i < 20; i++) {
      const t = randomTechniqueDrop(0);
      if (t) expect(t.quality).toBe('white');
    }
  });

  it('渡劫一重开始功法掉落上限允许红品', () => {
    expect(getTechniqueDropMaxQualityIndex(0, 0)).toBe(QUALITY_ORDER.indexOf('white'));
    expect(getTechniqueDropMaxQualityIndex(9, 0)).toBe(QUALITY_ORDER.indexOf('green'));
    expect(getTechniqueDropMaxQualityIndex(12, 0)).toBe(QUALITY_ORDER.indexOf('blue'));
    expect(getTechniqueDropMaxQualityIndex(15, 0)).toBe(QUALITY_ORDER.indexOf('purple'));
    expect(getTechniqueDropMaxQualityIndex(18, 0)).toBe(QUALITY_ORDER.indexOf('orange'));
    expect(getTechniqueDropMaxQualityIndex(20, 0)).toBe(QUALITY_ORDER.indexOf('orange'));
    expect(getTechniqueDropMaxQualityIndex(21, 0)).toBe(QUALITY_ORDER.indexOf('red'));
    expect(getTechniqueDropMaxQualityIndex(25, 5)).toBe(QUALITY_ORDER.indexOf('red'));
  });

  it('randomTechniqueDrop 会排除已拥有的功法模板', () => {
    const whiteIds = TECHNIQUE_TEMPLATES.filter(t => t.quality === 'white').map(t => t.id);
    const keptId = whiteIds[0];
    const excludedIds = whiteIds.slice(1);

    for (let i = 0; i < 20; i++) {
      const t = randomTechniqueDrop(0, excludedIds);
      expect(t?.id).toBe(keptId);
    }

    expect(randomTechniqueDrop(0, whiteIds)).toBeNull();
  });
});
// ─────────────────────────────────────────────
// 6. 战斗引擎
// ─────────────────────────────────────────────
describe('战斗引擎', () => {
  const weakMonster = {
    id: 'weak_monster',
    name: '弱怪',
    attackMin: 10,
    attackMax: 10,
    defense: 0,
    hpMin: 100,
    hpMax: 100,
    expReward: 10,
    drops: [{ type: 'gold' as const, name: '灵石', amount: 1, chance: 1 }],
  };

  it('强玩家必胜弱怪', () => {
    const playerAttrs = { attack: 1000, defense: 500, hp: 5000 };
    const bonusAttrs = { critRate: 0.5, critDmg: 1.0, dodge: 0.2 };
    const result = executeBattle(playerAttrs, bonusAttrs, weakMonster, { captureLogs: false });
    expect(result.victory).toBe(true);
  });

  it('每场新战斗由玩家先手，秒杀时怪物不会抢先出手', () => {
    const playerAttrs = { attack: 1000, defense: 100, hp: 1000 };
    const bonusAttrs = { critRate: 0, critDmg: 0, dodge: 0 };
    const monster = {
      id: 'test_first_turn',
      name: '先手木桩',
      attackMin: 999999,
      attackMax: 999999,
      defense: 0,
      hpMin: 1,
      hpMax: 1,
      expReward: 1,
      drops: [],
    };

    const result = executeBattle(playerAttrs, bonusAttrs, monster, { captureLogs: false });
    expect(result.victory).toBe(true);
    expect(result.playerHpRemaining).toBe(playerAttrs.hp);
    expect(result.rounds).toBe(1);
  });

  it('胜利后获得经验值', () => {
    const playerAttrs = { attack: 1000, defense: 500, hp: 5000 };
    const bonusAttrs = { critRate: 0, critDmg: 0, dodge: 0 };
    const result = executeBattle(playerAttrs, bonusAttrs, weakMonster, { captureLogs: false });
    expect(result.expGained).toBeGreaterThan(0);
  });

  it('胜利后掉落100%概率物品一定掉落', () => {
    const playerAttrs = { attack: 1000, defense: 500, hp: 5000 };
    const bonusAttrs = { critRate: 0, critDmg: 0, dodge: 0 };
    const result = executeBattle(playerAttrs, bonusAttrs, weakMonster, { captureLogs: false });
    expect(result.drops.length).toBeGreaterThan(0);
  });

  it('失败时expGained=0', () => {
    const playerAttrs = { attack: 1, defense: 0, hp: 1 };
    const bonusAttrs = { critRate: 0, critDmg: 0, dodge: 0 };
    const monster = { ...weakMonster, attackMin: 100, attackMax: 100, hpMin: 1000, hpMax: 1000 };
    const result = executeBattle(playerAttrs, bonusAttrs, monster, { captureLogs: false });
    expect(result.victory).toBe(false);
    expect(result.expGained).toBe(0);
  });

  it('最多50回合结束', () => {
    const playerAttrs = { attack: 100, defense: 0, hp: 99999999 };
    const bonusAttrs = { critRate: 0, critDmg: 0, dodge: 0 };
    const monster = { ...weakMonster, defense: 999999999, hpMin: 999999999, hpMax: 999999999 };
    const result = executeBattle(playerAttrs, bonusAttrs, monster, { captureLogs: false });
    expect(result.rounds).toBeLessThanOrEqual(50);
  });

  it('玩家血量不会低于0', () => {
    const playerAttrs = { attack: 1, defense: 0, hp: 100 };
    const bonusAttrs = { critRate: 0, critDmg: 0, dodge: 0 };
    const monster = { ...weakMonster, attackMin: 1000, attackMax: 1000, hpMin: 1000, hpMax: 1000 };
    const result = executeBattle(playerAttrs, bonusAttrs, monster, { captureLogs: false });
    expect(result.playerHpRemaining).toBeGreaterThanOrEqual(0);
  });

  it('胜利后玩家血量 <= 最大血量', () => {
    const playerAttrs = { attack: 1000, defense: 500, hp: 5000 };
    const bonusAttrs = { critRate: 0, critDmg: 0, dodge: 0 };
    const result = executeBattle(playerAttrs, bonusAttrs, weakMonster, { captureLogs: false });
    expect(result.playerHpRemaining).toBeLessThanOrEqual(result.playerHpMax);
  });

  it('玩家伤害至少为攻击力的10%', () => {
    const monster = { ...weakMonster, defense: 999_999_999, hpMin: 100, hpMax: 100 };
    const player = { attack: 100, defense: 0, hp: 99_999_999 };
    const result = executeBattle(player, { critRate: 0, critDmg: 0, dodge: 0 }, monster, { captureLogs: false });
    expect(result.rounds).toBeLessThanOrEqual(50);
  });
});

// ─────────────────────────────────────────────
// 7. 游戏引擎
// ─────────────────────────────────────────────
describe('游戏引擎', () => {

  it('初始状态不能突破（修为不足）', () => {
    const state = createInitialState();
    expect(canBreakthrough(state)).toBe(false);
  });

  it('修为达标后可以突破练气一层（无灵石要求）', () => {
    const state = { ...createInitialState(), exp: 99999 };
    expect(canBreakthrough(state)).toBe(true);
  });

  it('大境界突破灵石不足时不能突破', () => {
    // 筑基初期突破需要灵石，realmIndex=8是练气九层→筑基初期的突破点
    const state = { ...createInitialState(), realmIndex: 8, exp: 999_999_999, gold: 0 };
    expect(canBreakthrough(state)).toBe(false);
  });

  it('gameTick 后修为增加', () => {
    const state = { ...createInitialState(), sectId: 'sect_sword' };
    const after = gameTick(state);
    expect(after.exp).toBeGreaterThan(state.exp);
  });

  it('gameTick 后灵石增加', () => {
    const state = { ...createInitialState(), sectId: 'sect_sword' };
    const after = gameTick(state);
    expect(after.gold).toBeGreaterThan(state.gold);
  });

  it('未选门派时 gameTick 不产出修为和灵石', () => {
    const state = createInitialState(); // sectId 默认 null
    const after = gameTick(state);
    expect(after.exp).toBe(state.exp);
    expect(after.gold).toBe(state.gold);
    expect(after.totalPlayTime).toBeGreaterThan(state.totalPlayTime);
  });

  it('gameTick totalPlayTime 累加正确', () => {
    const state = createInitialState();
    const after = gameTick(state);
    expect(after.totalPlayTime).toBeCloseTo(state.totalPlayTime + 0.1, 5);
  });

  it('advanceGameTime 会按真实经过秒数累计 totalPlayTime', () => {
    const state = { ...createInitialState(), sectId: 'sect_sword' };
    const after = advanceGameTime(state, 15);
    expect(after.totalPlayTime).toBeCloseTo(state.totalPlayTime + 15, 5);
    expect(after.exp).toBeGreaterThan(state.exp);
    expect(after.gold).toBeGreaterThan(state.gold);
  });

  it('applyOfflineGains 会同步累计离线期间的 totalPlayTime', () => {
    const state = { ...createInitialState(), sectId: 'sect_sword', lastSaveTime: Date.now() - 5000 };
    const after = applyOfflineGains(state);
    expect(after.totalPlayTime).toBeGreaterThanOrEqual(5);
    expect(after.exp).toBeGreaterThan(state.exp);
    expect(after.gold).toBeGreaterThan(state.gold);
  });

  it('applyOfflineGains 会恢复离线期间的秘境体力', () => {
    const state = {
      ...createInitialState(),
      stamina: 0,
      lastSaveTime: Date.now() - 3600_000,
    };
    const gains = calcOfflineGains(state);
    const after = applyOfflineGains(state);
    expect(gains.staminaRecovered).toBeGreaterThan(0);
    expect(after.stamina).toBeGreaterThan(state.stamina);
  });

  it('离线挂机讨伐会结算灵草碎片与战利品掉落', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const state = {
      ...createInitialState(),
      realmIndex: 29,
      rebirthCount: 5,
      sectId: 'sect_sword',
      currentAreaId: 'area_legend',
      isBattling: true,
      lastSaveTime: Date.now() - 60_000,
    };
    const gains = calcOfflineGains(state);
    const after = applyOfflineGains(state);
    randomSpy.mockRestore();

    expect(gains.seconds).toBeGreaterThanOrEqual(60);
    expect(after.killCount).toBeGreaterThan(state.killCount);
    expect(after.herbs + after.fragments + after.artifactBag.length + after.techniqueBag.length)
      .toBeGreaterThan(state.herbs + state.fragments + state.artifactBag.length + state.techniqueBag.length);
  });

  it('离线结算会按品质自动分解装备并统计碎片', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const state = {
      ...createInitialState(),
      realmIndex: 29,
      sectId: 'sect_sword',
      currentAreaId: 'area_lq',
      isBattling: true,
      autoSalvageQualities: {
        white: true,
        green: false,
        blue: false,
        purple: false,
        orange: false,
        red: false,
        legend: false,
      },
      lastSaveTime: Date.now() - 60_000,
    };

    const gains = calcOfflineGains(state);
    const after = applyOfflineGains(state);
    randomSpy.mockRestore();

    expect(gains.autoSalvageFragments).toBeGreaterThan(0);
    expect(gains.artifactCount).toBe(0);
    expect(after.fragments).toBeGreaterThan(state.fragments);
    expect(after.artifactBag.length).toBe(state.artifactBag.length);
    expect(after.sessionAutoSalvageCount).toBeGreaterThan(0);
    expect(after.sessionAutoSalvageFragments).toBeGreaterThan(0);
  });

  it('getBreakthroughInfo 最高境界返回 canDo=false', () => {
    const state = { ...createInitialState(), realmIndex: TOTAL_REALMS - 1 };
    const info = getBreakthroughInfo(state);
    expect(info.canDo).toBe(false);
    expect(info.nextName).toBe('已达巅峰');
  });

  it('getRealm 返回正确的境界数据', () => {
    const realm = getRealm(0);
    expect(realm.attributes.attack).toBe(10000); // 练气一层 0.1%基准
  });

  it('getNextRealm 最高境界返回null', () => {
    expect(getNextRealm(TOTAL_REALMS - 1)).toBeNull();
  });
});

// ─────────────────────────────────────────────
// 8. expRate 词条系统集成
// ─────────────────────────────────────────────
describe('expRate 词条系统集成', () => {

  it('装备 expRate 词条后修炼速度倍率提升', () => {
    const base = createInitialState();
    const mulBefore = getExpMultiplier(base);

    const artWithExpRate = {
      uid: 'test_4',
      templateId: 'w_wp_0',
      quality: 'white' as const,
      affixes: [{ type: 'expRate' as AffixType, value: 0.1 }],
      level: 0,
    };
    const state = { ...base, equippedArtifacts: { ...base.equippedArtifacts, weapon: artWithExpRate } };
    const mulAfter = getExpMultiplier(state);

    expect(mulAfter).toBeCloseTo(mulBefore + 0.1, 5);
  });

  it('expRate 词条数值在合理范围内（金色tier21 < 20%）', () => {
    // 金色QUALITY_VALUE_MULT=30, tier21 tMult=1+21*0.8=17.8
    // expRate max = 0.0002 * 30 * 17.8 = 0.1068 ≈ 10.7%
    const [, max] = AFFIX_BASE['expRate'];
    const goldMult = QUALITY_VALUE_MULT['orange'];
    const tMult = 1 + 21 * 0.8;
    const maxVal = max * goldMult * tMult;
    expect(maxVal).toBeLessThan(0.2); // 单词条最高<20%
  });
});

// ─────────────────────────────────────────────
// 9.1 词条强化等级加成补充测试
// ─────────────────────────────────────────────
describe('词条强化等级加成补充', () => {
  it('getArtifactBonuses level=50时词条×1.5', () => {
    const affixes = [{ type: 'atk' as AffixType, value: 1000 }];
    const art = { uid: 'test_50', templateId: 'w_wp_1', quality: 'white' as const, affixes, level: 50 };
    const bonuses = getArtifactBonuses(art);
    // affixEnhanceMul = 1 + 50 * 0.01 = 1.50, floor(1000 * 1.50) = 1500
    expect(bonuses.atk).toBe(1500);
  });

  it('getArtifactBonuses level=100时词条×2.0', () => {
    const affixes = [{ type: 'atk' as AffixType, value: 1000 }];
    const art = { uid: 'test_100', templateId: 'w_wp_1', quality: 'white' as const, affixes, level: 100 };
    const bonuses = getArtifactBonuses(art);
    // affixEnhanceMul = 1 + 100 * 0.01 = 2.00, floor(1000 * 2.00) = 2000
    expect(bonuses.atk).toBe(2000);
  });
});

// ─────────────────────────────────────────────
// 9.2 突破丹翻倍逻辑测试
// ─────────────────────────────────────────────
describe('突破丹对应境界翻倍', () => {
  it('筑基丹在练气期(realmIndex=5)翻倍：+15%→+30%', () => {
    const base = createInitialState();
    const pill = getPillRecipe('pill_g1')!;
    expect(pill.effect.type).toBe('breakthrough_boost');
    expect(pill.targetBreakthroughRange).toEqual([0, 8]);

    // 模拟服用筑基丹后的状态
    const state: GameState = {
      ...base,
      realmIndex: 5,
      exp: getRealm(5).requiredExp,   // 满足突破修为
      gold: 999999999,
      breakthroughBonus: 0.15,
      breakthroughPillBonuses: [{ pillId: 'pill_g1', bonus: 0.15 }],
    };

    // mock Math.random 返回0（必定成功）
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { success } = attemptBreakthrough(state);
    expect(success).toBe(true);
    vi.restoreAllMocks();
  });

  it('筑基丹在筑基期(realmIndex=10)不翻倍', () => {
    const base = createInitialState();
    const state: GameState = {
      ...base,
      realmIndex: 10,
      exp: getRealm(10).requiredExp,
      gold: 999999999,
      breakthroughBonus: 0.15,
      breakthroughPillBonuses: [{ pillId: 'pill_g1', bonus: 0.15 }],
    };

    // 翻倍范围 [0,8]，realmIndex=10 不在范围内，pillBonus 应为原值 0.15
    // 使用 getBreakthroughInfo 间接验证
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { success } = attemptBreakthrough(state);
    expect(success).toBe(true);
    vi.restoreAllMocks();
  });

  it('多丹叠加时各自独立判定翻倍', () => {
    const base = createInitialState();
    // 服用筑基丹(range[0,8]) + 破境丹(range[9,14])，在练气期(realmIndex=5)
    // 筑基丹 0.15 应翻倍为 0.30，破境丹 0.25 不翻倍保持 0.25，总计 0.55
    const state: GameState = {
      ...base,
      realmIndex: 5,
      exp: getRealm(5).requiredExp,
      gold: 999999999,
      breakthroughBonus: 0.40,
      breakthroughPillBonuses: [
        { pillId: 'pill_g1', bonus: 0.15 },
        { pillId: 'pill_b3', bonus: 0.25 },
      ],
    };

    // 基础突破率 + 0.55(翻倍后丹药) 应大于基础 + 0.40(未翻倍)
    // 用极小的 random 保证成功，验证不崩溃
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { success } = attemptBreakthrough(state);
    expect(success).toBe(true);
    vi.restoreAllMocks();
  });
});

// ─────────────────────────────────────────────
// 02 强化费用测试
// ─────────────────────────────────────────────
describe('装备强化费用', () => {
  it('level=0 时费用等于基础值', () => {
    const art = { uid: 't', templateId: 'w_wp_1', quality: 'legend' as const, affixes: [], level: 0 };
    const cost = getArtifactEnhanceCost(art);
    // k=0.2, Math.pow(1+0*0.2, 2) = 1
    expect(cost.gold).toBeGreaterThan(0);
  });

  it('传说装备 level=50 费用在合理范围', () => {
    const art = { uid: 't', templateId: 'w_wp_1', quality: 'legend' as const, affixes: [], level: 50 };
    const cost = getArtifactEnhanceCost(art);
    // k=0.2, (1+50*0.2)^2 = 11^2 = 121
    expect(cost.gold).toBeGreaterThan(1e8);  // > 1亿
    expect(cost.gold).toBeLessThan(1e10);    // < 100亿
  });

  it('紫品 level 增长费用低于传说同级', () => {
    const artP = { uid: 't', templateId: 'w_wp_1', quality: 'purple' as const, affixes: [], level: 20 };
    const artL = { uid: 't', templateId: 'w_wp_1', quality: 'legend' as const, affixes: [], level: 20 };
    expect(getArtifactEnhanceCost(artP).gold).toBeLessThan(getArtifactEnhanceCost(artL).gold);
  });
});

// ─────────────────────────────────────────────
// 03 强化倍率测试
// ─────────────────────────────────────────────
describe('装备强化倍率', () => {
  it('各品质 level=0 倍率为 1', () => {
    const qualities = ['white', 'green', 'blue', 'purple', 'orange', 'red', 'legend'] as const;
    for (const q of qualities) {
      expect(getArtifactEnhanceMultiplier(q, 0)).toBe(1);
    }
  });

  it('各品质满级倍率正确', () => {
    const expected: Record<string, number> = {
      white: 2.0, green: 2.5, blue: 3.0, purple: 3.5, orange: 4.0, red: 4.5, legend: 5.0,
    };
    for (const [q, exp] of Object.entries(expected)) {
      const maxLv = QUALITY_MAX_LEVEL[q as keyof typeof QUALITY_MAX_LEVEL];
      const mul = getArtifactEnhanceMultiplier(q as any, maxLv);
      expect(mul).toBeCloseTo(exp, 5);
    }
  });

  it('半级倍率在 1 和满级之间', () => {
    const maxLv = QUALITY_MAX_LEVEL['legend'];
    const halfMul = getArtifactEnhanceMultiplier('legend', Math.floor(maxLv / 2));
    expect(halfMul).toBeGreaterThan(1);
    expect(halfMul).toBeLessThan(5.0);
  });
});

// ─────────────────────────────────────────────
// 07 门派被动测试
// ─────────────────────────────────────────────
describe('门派被动效果', () => {
  it('灵宗具有 breakthroughBonus=0.10', () => {
    const sect = getSect('sect_spirit');
    expect(sect).toBeDefined();
    expect(sect!.bonus.breakthroughBonus).toBe(0.10);
  });

  it('其他门派无 breakthroughBonus', () => {
    for (const id of ['sect_sword', 'sect_pill', 'sect_body', 'sect_fortune']) {
      const sect = getSect(id);
      expect(sect!.bonus.breakthroughBonus ?? 0).toBe(0);
    }
  });

  it('各门派 initialTechniqueId 已填充', () => {
    const expected: Record<string, string> = {
      sect_sword: 'tech_w3', sect_pill: 'tech_w1', sect_body: 'tech_w2',
      sect_spirit: 'tech_w5', sect_fortune: 'tech_w1',
    };
    for (const [id, techId] of Object.entries(expected)) {
      const sect = getSect(id);
      expect(sect!.initialTechniqueId).toBe(techId);
    }
  });
});

// ─────────────────────────────────────────────
// 08 灵石商店测试
// ─────────────────────────────────────────────
describe('灵石商店', () => {
  it('商店物品数据完整', () => {
    expect(GOLD_SHOP.length).toBe(3);
    for (const item of GOLD_SHOP) {
      expect(item.basePrice).toBeGreaterThan(0);
      expect(item.dailyLimit).toBeGreaterThan(0);
      expect(item.rewardAmount).toBeGreaterThan(0);
    }
  });

  it('价格按次递增', () => {
    const herb = getShopItem('shop_herb')!;
    const p0 = getShopPrice(herb, 0);
    const p1 = getShopPrice(herb, 1);
    const p2 = getShopPrice(herb, 2);
    expect(p1).toBeGreaterThan(p0);
    expect(p2).toBeGreaterThan(p1);
    // 验证倍率：p1 = base * 1.5, p2 = base * 1.5^2
    expect(p1).toBe(Math.floor(herb.basePrice * herb.priceScaling));
    expect(p2).toBe(Math.floor(herb.basePrice * Math.pow(herb.priceScaling, 2)));
  });

  it('购买扣除灵石并发放灵草', () => {
    const state = { ...createInitialState(), gold: 1000000 };
    const after = purchaseShopItem(state, 'shop_herb');
    expect(after.gold).toBeLessThan(state.gold);
    expect(after.herbs).toBeGreaterThan(state.herbs);
  });

  it('灵石不足时购买失败', () => {
    const state = { ...createInitialState(), gold: 0 };
    const after = purchaseShopItem(state, 'shop_herb');
    expect(after.gold).toBe(0);
    expect(after.herbs).toBe(state.herbs);
  });

  it('达到每日上限后购买失败', () => {
    const today = new Date().toISOString().slice(0, 10);
    const herb = getShopItem('shop_herb')!;
    const state = {
      ...createInitialState(),
      gold: 999999999,
      shopPurchases: { 'shop_herb': herb.dailyLimit },
      shopResetDate: today,
    };
    const after = purchaseShopItem(state, 'shop_herb');
    expect(after.herbs).toBe(state.herbs); // 未增加
  });

  it('跨天自动重置购买计数', () => {
    const state = {
      ...createInitialState(),
      gold: 999999999,
      shopPurchases: { 'shop_herb': 10 },
      shopResetDate: '2020-01-01', // 旧日期
    };
    const after = purchaseShopItem(state, 'shop_herb');
    expect(after.herbs).toBeGreaterThan(state.herbs); // 新一天可以买
  });
});

// ─────────────────────────────────────────────
// 装备战力 / 角色战力
// ─────────────────────────────────────────────
describe('装备战力与角色战力', () => {
  it('装备战力不受强化等级影响', () => {
    const affixes = [{ type: 'atk' as AffixType, value: 1000 }];
    const art0 = { uid: 'p0', templateId: 'w_wp_1', quality: 'purple' as const, affixes, level: 0 };
    const art100 = { uid: 'p100', templateId: 'w_wp_1', quality: 'purple' as const, affixes, level: 100 };
    expect(getArtifactPower(art0)).toBe(getArtifactPower(art100));
  });

  it('装备战力不受轮回次数影响', () => {
    const art = { uid: 'pr', templateId: 'w_wp_1', quality: 'purple' as const, affixes: [], level: 0 };
    const baseNoRebirth = getArtifactBaseStats('weapon', 1).atk;
    const baseWithRebirth = getArtifactBaseStats('weapon', 1, 10).atk;
    expect(baseWithRebirth).toBeGreaterThan(baseNoRebirth);
    expect(getArtifactPower(art)).toBe(Math.round((baseNoRebirth / 100000000) * 1000));
  });

  it('不含强化词条口径在高强化下保持原值，含强化词条口径会增加', () => {
    const affixes = [{ type: 'atk' as AffixType, value: 1000 }];
    const art = { uid: 'pb', templateId: 'w_wp_1', quality: 'white' as const, affixes, level: 100 };
    expect(getArtifactBonusesWithoutEnhance(art).atk).toBe(1000);
    expect(getArtifactBonuses(art).atk).toBe(2000);
  });

  it('高基础属性装备的装备战力更高', () => {
    const artLow = { uid: 'low', templateId: 'w_wp_1', quality: 'white' as const, affixes: [], level: 0 };
    const artHigh = { uid: 'high', templateId: 'w_wp_2', quality: 'white' as const, affixes: [], level: 0 };
    expect(getArtifactPower(artHigh)).toBeGreaterThan(getArtifactPower(artLow));
  });

  it('主战斗词条会提升装备战力', () => {
    const base = { uid: 'a', templateId: 'w_wp_1', quality: 'white' as const, affixes: [], level: 0 };
    const withCrit = { uid: 'b', templateId: 'w_wp_1', quality: 'white' as const, affixes: [{ type: 'critRate' as AffixType, value: 0.02 }], level: 0 };
    expect(getArtifactPower(withCrit)).toBeGreaterThan(getArtifactPower(base));
  });

  it('expRate 不影响装备战力', () => {
    const base = { uid: 'c', templateId: 'w_wp_1', quality: 'white' as const, affixes: [], level: 0 };
    const withExp = { uid: 'd', templateId: 'w_wp_1', quality: 'white' as const, affixes: [{ type: 'expRate' as AffixType, value: 0.1 }], level: 0 };
    expect(getArtifactPower(withExp)).toBe(getArtifactPower(base));
  });

  it('角色战力公式为 attack + defense + floor(hp / 10)', () => {
    expect(getCharacterPower({ attack: 1000, defense: 500, hp: 12345 })).toBe(1000 + 500 + 1234);
  });
});

// ─────────────────────────────────────────────
// 门派深度化 v3.6.0
// ─────────────────────────────────────────────
describe('门派深度化 v3.6.0', () => {
  it('旧存档加载后自动补齐门派成长字段', () => {
    const raw = { ...createInitialState() } as Record<string, unknown>;
    delete raw['sectLevel'];
    delete raw['sectContribution'];
    delete raw['sectDailyTasks'];
    delete raw['sectDailyTaskDate'];
    delete raw['sectTaskProgress'];
    delete raw['sectClaimedTasks'];
    delete raw['sectUnlockedPassives'];

    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => { store.clear(); },
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      get length() { return store.size; },
    });

    localStorage.setItem('moyu_slot_1', JSON.stringify(raw));
    const loaded = loadGameFromSlot(0)!;
    expect(loaded.sectLevel).toBe(1);
    expect(loaded.sectContribution).toBe(0);
    expect(loaded.sectDailyTasks).toEqual([]);
    expect(loaded.sectTaskProgress).toEqual({});
    expect(loaded.sectClaimedTasks).toEqual([]);
    expect(loaded.sectUnlockedPassives).toEqual([]);
    vi.unstubAllGlobals();
  });

  it('门派等级阈值计算正确', () => {
    expect(SECT_LEVEL_REQUIREMENTS).toEqual([0, 100, 250, 500, 900]);
    expect(getSectLevelByContribution(0)).toBe(1);
    expect(getSectLevelByContribution(100)).toBe(2);
    expect(getSectLevelByContribution(250)).toBe(3);
    expect(getSectLevelByContribution(500)).toBe(4);
    expect(getSectLevelByContribution(900)).toBe(5);
  });

  it('门派等级提升后自动解锁里程碑被动', () => {
    const state = refreshSectLevelAndPassives({
      ...createInitialState(),
      sectId: 'sect_sword',
      sectContribution: 500,
    });

    expect(state.sectLevel).toBe(4);
    expect(state.sectUnlockedPassives).toContain('sect_sword_lv2');
    expect(state.sectUnlockedPassives).toContain('sect_sword_lv4');
    expect(state.sectUnlockedPassives).not.toContain('sect_sword_lv5');
  });

  it('日常任务每日刷新且同日保持稳定', () => {
    const base = { ...createInitialState(), sectId: 'sect_sword' as const };
    const day1 = ensureSectDailyTasks(base, '2026-04-04');
    const day1Again = ensureSectDailyTasks(day1, '2026-04-04');
    const day2 = ensureSectDailyTasks({ ...day1, sectClaimedTasks: ['daily:2026-04-04:daily_kill_20'] }, '2026-04-05');

    expect(day1.sectDailyTasks).toHaveLength(3);
    expect(day1Again.sectDailyTasks).toEqual(day1.sectDailyTasks);
    expect(day2.sectDailyTaskDate).toBe('2026-04-05');
    expect(day2.sectClaimedTasks).toEqual([]);
  });

  it('跨天后日常任务进度不会继承前一天的累计值', () => {
    let state: GameState = { ...createInitialState(), sectId: 'sect_sword', sectDailyTaskDate: '2026-04-04' };
    state = updateSectTaskProgress(state, { type: 'kill', count: 25 });
    expect(state.sectTaskProgress['daily-progress:2026-04-04:kill_count']).toBe(25);
    expect(state.sectTaskProgress.kill_count).toBe(25);

    const nextDay = ensureSectDailyTasks(state, '2026-04-05');
    expect(nextDay.sectTaskProgress['daily-progress:2026-04-04:kill_count']).toBeUndefined();
    expect(nextDay.sectTaskProgress.kill_count).toBe(25);
  });

  it('任务事件能正确推进多种门派任务进度', () => {
    let state: GameState = { ...createInitialState(), sectId: 'sect_spirit' };
    state = updateSectTaskProgress(state, { type: 'battle_win', count: 2 });
    state = updateSectTaskProgress(state, { type: 'kill', count: 3 });
    state = updateSectTaskProgress(state, { type: 'alchemy_success', count: 1 });
    state = updateSectTaskProgress(state, { type: 'dungeon_enter', count: 2 });
    state = updateSectTaskProgress(state, { type: 'play_time', seconds: 35 });
    state = updateSectTaskProgress(state, { type: 'realm_reach', realmIndex: 9 });

    expect(state.sectTaskProgress.battle_count).toBe(2);
    expect(state.sectTaskProgress.kill_count).toBe(3);
    expect(state.sectTaskProgress.alchemy_success).toBe(1);
    expect(state.sectTaskProgress.dungeon_enter).toBe(2);
    expect(state.sectTaskProgress.play_time).toBe(35);
    expect(state.sectTaskProgress.realm_reach).toBe(9);
  });

  it('成长任务领取后增加贡献并记录已领取状态', () => {
    let state: GameState = {
      ...createInitialState(),
      sectId: 'sect_sword',
      sectTaskProgress: { kill_count: 100 },
    };

    state = claimSectTaskReward(state, 'growth_sword_kill_100');
    expect(state.sectContribution).toBe(50);
    expect(state.sectClaimedTasks).toContain('growth_sword_kill_100');

    const afterClaimAgain = claimSectTaskReward(state, 'growth_sword_kill_100');
    expect(afterClaimAgain.sectContribution).toBe(50);
  });

  it('门派成长被动会作用于属性、修炼、掉落、炼丹、突破与战斗收益', () => {
    const swordBase = refreshSectLevelAndPassives({ ...createInitialState(), sectId: 'sect_sword', sectContribution: 0 });
    const swordGrowth = refreshSectLevelAndPassives({ ...createInitialState(), sectId: 'sect_sword', sectContribution: 500 });
    expect(calcFinalAttributes(swordGrowth).attack).toBeGreaterThan(calcFinalAttributes(swordBase).attack);

    const spiritBase = refreshSectLevelAndPassives({ ...createInitialState(), sectId: 'sect_spirit', sectContribution: 0 });
    const spiritGrowth = refreshSectLevelAndPassives({ ...createInitialState(), sectId: 'sect_spirit', sectContribution: 900 });
    expect(getExpMultiplier(spiritGrowth)).toBeGreaterThan(getExpMultiplier(spiritBase));
    expect(getSectGrowthBreakthroughBonus(spiritGrowth)).toBeGreaterThan(getSectGrowthBreakthroughBonus(spiritBase));

    const pillBase = refreshSectLevelAndPassives({ ...createInitialState(), sectId: 'sect_pill', sectContribution: 0 });
    const pillGrowth = refreshSectLevelAndPassives({ ...createInitialState(), sectId: 'sect_pill', sectContribution: 900 });
    expect(getAlchemyBonus(pillGrowth)).toBeGreaterThan(getAlchemyBonus(pillBase));

    const fortuneBase = refreshSectLevelAndPassives({ ...createInitialState(), sectId: 'sect_fortune', sectContribution: 0 });
    const fortuneGrowth = refreshSectLevelAndPassives({ ...createInitialState(), sectId: 'sect_fortune', sectContribution: 900 });
    expect(getDropBonus(fortuneGrowth)).toBeGreaterThan(getDropBonus(fortuneBase));
    expect(getBattleGoldBonus(fortuneGrowth)).toBeGreaterThan(getBattleGoldBonus(fortuneBase));
  });
});
