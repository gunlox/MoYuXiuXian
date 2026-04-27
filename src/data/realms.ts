/** 基础属性（随境界提升） */
export interface Attributes {
  attack: number;
  defense: number;
  hp: number;
}

/** 附加属性（不随境界提升，来源装备/功法） */
export interface BonusAttributes {
  /** 暴击率 0~1，基础0.05，上限1.0 */
  critRate: number;
  /** 暴击伤害加成倍率，基础0.10（即+10%），上限50.0（+5000%） */
  critDmg: number;
  /** 闪避率 0~0.75 */
  dodge: number;
  /** 免死概率 0~1，基础0 */
  deathSaveChance: number;
}

/** 境界定义 */
export interface RealmLevel {
  id: string;
  name: string;
  subLevel: number;
  subLevelName: string;
  requiredExp: number;
  expPerSecond: number;
  goldPerSecond: number;
  breakthroughCost: number;
  breakthroughRate: number;
  attributes: Attributes;
}

/** 大境界 */
export const REALM_NAMES = [
  '练气', '筑基', '金丹', '元婴', '化神', '渡劫'
] as const;

/** 练气期子境界名称 */
const LIANQI_SUB = ['一层', '二层', '三层', '四层', '五层', '六层', '七层', '八层', '九层'];

/** 其他境界子境界名称 */
const NORMAL_SUB = ['初期', '中期', '后期'];

/** 渡劫期子境界名称 */
const DUJIE_SUB = ['一重天劫', '二重天劫', '三重天劫', '四重天劫', '五重天劫', '六重天劫', '七重天劫', '八重天劫', '九重天劫'];

const MAIN_ATTRIBUTE_SCALE = 10;

/** 生成完整境界表
 *  数值设计目标（Sheet3，玩家在每个子境界的期望停留时长）：
 *  练气1-9层  0.05h / 0.05h / 0.05h / 0.1h / 0.1h / 0.1h / 0.2h / 0.2h / 0.25h
 *  筑基初/中/后  0.5h / 0.5h / 1h
 *  金丹初/中/后  0.8h / 1.2h / 2h
 *  元婴初/中/后  1.5h / 2.5h / 4h
 *  化神初/中/后  3h / 4h / 6h
 *  渡劫1-9重   5h / 5.5h / 7h / 6h / 7h / 10h / 9h / 11h / 14h
 *
 *  requiredExp = expPerSecond × staySeconds × expMultiplier
 *  expMultiplier（普通玩家，中档功法+精通+装备词条，无转生）：
 *    练气 ≈ 1.07  筑基 ≈ 1.26  金丹 ≈ 1.51
 *    元婴 ≈ 1.90  化神 ≈ 2.49  渡劫 ≈ 3.40
 */
function generateRealmTable(): RealmLevel[] {
  const realms: RealmLevel[] = [];

  // 每个子境界的精确参数
  // [expPerSecond, goldPerSecond, requiredExp, breakthroughCost, breakthroughRate, atk, def, hp]
  const subConfigs: [number, number, number, number, number, number, number, number][] = [
    // ── 练气期（mul=1.07）──
    // expPS  gPS    reqExp  bkCost  rate   atk   def   hp
    [  1,     0.5,   193,    0,      1.00,   1000,   750,   10000  ], // 练气一层 0.1% / 0.05h
    [  1,     0.5,   193,    0,      1.00,   2000,   1500,  20000  ], // 练气二层 0.2% / 0.05h
    [  2,     1,     385,    0,      1.00,   3000,   2250,  30000  ], // 练气三层 0.3% / 0.05h
    [  2,     1,     770,    0,      1.00,   4000,   3000,  40000  ], // 练气四层 0.4% / 0.1h
    [  3,     1,     1156,   0,      1.00,   5000,   3750,  50000  ], // 练气五层 0.5% / 0.1h
    [  3,     1,     1156,   0,      1.00,   6000,   4500,  60000  ], // 练气六层 0.6% / 0.1h
    [  4,     2,     3082,   0,      1.00,   7000,   5250,  70000  ], // 练气七层 0.7% / 0.2h
    [  4,     2,     3082,   0,      1.00,   8000,   6000,  80000  ], // 练气八层 0.8% / 0.2h
    [  5,     2,     4815,   0,      1.00,   9000,   6750,  90000  ], // 练气九层 0.9% / 0.25h
    [  5,     3,     11340,  500,    0.90,   20000,  15000, 200000 ], // 筑基初期 2.0% / 0.5h
    [  10,    5,     22680,  800,    0.85,   25000,  18750, 250000 ], // 筑基中期 2.5% / 0.5h
    [  15,    7,     68040,  1200,   0.80,   30000,  22500, 300000 ], // 筑基后期 3.0% / 1h
    [  60,    25,    260928, 5000,   0.80,   50000,  37500, 500000 ], // 金丹初期 5.0% / 0.8h
    [  100,   40,    652320, 8000,   0.75,   55000,  41250, 550000 ], // 金丹中期 5.5% / 1.2h
    [  140,   55,    1522080,12000,  0.70,   60000,  45000, 600000 ], // 金丹后期 6.0% / 2h
    [  800,   300,   8208000,80000,  0.70,   100000, 75000, 1000000], // 元婴初期 10% / 1.5h
    [  1200,  450,   20520000,120000,0.65,   115000, 86250, 1150000], // 元婴中期 11.5% / 2.5h
    [  1600,  600,   43776000,180000,0.60,   130000, 97500, 1300000], // 元婴后期 13% / 4h
    [  12000, 4500,  322704000,1200000,0.60, 200000, 150000,2000000], // 化神初期 20% / 3h
    [  18000, 6500,  645408000,1800000,0.55, 225000, 168750,2250000], // 化神中期 22.5% / 4h
    [  24000, 9000,  1290816000,2500000,0.50, 250000, 187500,2500000], // 化神后期 25% / 6h
    [  180000,70000, 11016000000,20000000,0.50,400000, 300000,4000000], // 渡劫一重 40% / 5h
    [  220000,85000, 14810400000,28000000,0.50,425000,318750,4250000], // 渡劫二重 42.5% / 5.5h
    [  270000,105000,23133600000,38000000,0.50,450000,337500,4500000], // 渡劫三重 45% / 7h
    [  330000,128000,24235200000,52000000,0.50,500000,375000,5000000], // 渡劫四重 50% / 6h
    [  400000,155000,34272000000,70000000,0.50,550000,412500,5500000], // 渡劫五重 55% / 7h
    [  490000,190000,59976000000,95000000,0.50,600000,450000,6000000], // 渡劫六重 60% / 10h
    [  600000,230000,66096000000,128000000,0.50,700000,525000,7000000], // 渡劫七重 70% / 9h
    [  730000,280000,98287200000,170000000,0.50,800000,600000,8000000], // 渡劫八重 80% / 11h
    [  890000,340000,152510400000,230000000,0.50,1000000,750000,10000000], // 渡劫九重 100% / 14h
  ];
  const realmOf = [
    0,0,0,0,0,0,0,0,0,  // 练气1-9
    1,1,1,                // 筑基初中后
    2,2,2,                // 金丹初中后
    3,3,3,                // 元婴初中后
    4,4,4,                // 化神初中后
    5,5,5,5,5,5,5,5,5,   // 渡劫1-9重
  ];
  const subOf = [
    0,1,2,3,4,5,6,7,8,   // 练气
    0,1,2,                // 筑基
    0,1,2,                // 金丹
    0,1,2,                // 元婴
    0,1,2,                // 化神
    0,1,2,3,4,5,6,7,8,   // 渡劫
  ];

  const allSubs = [
    ...LIANQI_SUB,
    ...NORMAL_SUB, ...NORMAL_SUB, ...NORMAL_SUB, ...NORMAL_SUB,
    ...DUJIE_SUB,
  ];

  for (let i = 0; i < subConfigs.length; i++) {
    const [eps, gps, reqExp, bkCost, rate, atk, def, hp] = subConfigs[i];
    const ri = realmOf[i];
    const si = subOf[i];
    realms.push({
      id: `${ri}_${si}`,
      name: REALM_NAMES[ri],
      subLevel: si,
      subLevelName: `${REALM_NAMES[ri]}${allSubs[i]}`,
      requiredExp: reqExp,
      expPerSecond: eps,
      goldPerSecond: gps,
      breakthroughCost: bkCost,
      breakthroughRate: rate,
      attributes: { attack: atk * MAIN_ATTRIBUTE_SCALE, defense: def * MAIN_ATTRIBUTE_SCALE, hp: hp * MAIN_ATTRIBUTE_SCALE },
    });
  }

  return realms;
}

export const REALM_TABLE = generateRealmTable();

/** 根据索引获取境界 */
export function getRealm(index: number): RealmLevel {
  return REALM_TABLE[Math.min(index, REALM_TABLE.length - 1)];
}

/** 获取下一个境界，如果已是最高则返回null */
export function getNextRealm(index: number): RealmLevel | null {
  if (index >= REALM_TABLE.length - 1) return null;
  return REALM_TABLE[index + 1];
}

/** 判断是否是大境界突破（需要消耗灵石） */
export function isMajorBreakthrough(currentIndex: number): boolean {
  const current = REALM_TABLE[currentIndex];
  const next = getNextRealm(currentIndex);
  if (!next) return false;
  return next.name !== current.name;
}

/** 总境界数 */
export const TOTAL_REALMS = REALM_TABLE.length;
