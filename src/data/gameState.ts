import { TechniqueInstance, ArtifactInstance, EquipSlot, generateAffixes, getArtifactTemplate, Quality } from './equipment';
import { PillStack, ActiveBuff } from './alchemy';
import { GameStats, createInitialStats } from './achievements';
import { RebirthPerks, createInitialPerks } from './rebirth';

function createInitialAutoSalvageQualities(): Record<Quality, boolean> {
  return {
    white: false,
    green: false,
    blue: false,
    purple: false,
    orange: false,
    red: false,
    legend: false,
  };
}

/** 游戏存档状态 */
export interface GameState {
  /** 当前境界索引 */
  realmIndex: number;
  /** 当前修为 */
  exp: number;
  /** 灵石数量 */
  gold: number;
  /** 灵草数量 */
  herbs: number;
  /** 法宝碎片数量 */
  fragments: number;
  /** 上次保存时间戳(ms) */
  lastSaveTime: number;
  /** 累计修炼时间(秒) */
  totalPlayTime: number;
  /** 突破成功次数 */
  breakthroughCount: number;
  /** 突破失败次数 */
  breakthroughFailCount: number;
  /** 击杀妖兽数 */
  killCount: number;
  /** 当前所在区域ID */
  currentAreaId: string | null;
  /** 是否正在挂机战斗 */
  isBattling: boolean;
  /** 当前修炼的功法 */
  equippedTechnique: TechniqueInstance | null;
  /** 功法背包 */
  techniqueBag: TechniqueInstance[];
  /** 当前装备的法宝 (3个槽位) */
  equippedArtifacts: Record<EquipSlot, ArtifactInstance | null>;
  /** 法宝背包 */
  artifactBag: ArtifactInstance[];
  /** 自动分解品质筛选 */
  autoSalvageQualities: Record<Quality, boolean>;
  sessionAutoSalvageCount: number;
  sessionAutoSalvageFragments: number;
  /** 丹药背包 */
  pills: PillStack[];
  /** 激活中的buff */
  buffs: ActiveBuff[];
  /** 突破成功率加成总和（一次性，用后清零，由 breakthroughPillBonuses 合计） */
  breakthroughBonus: number;
  /** 各突破丹分条目加成记录（用于按来源分别判定境界翻倍） */
  breakthroughPillBonuses: Array<{ pillId: string; bonus: number }>;
  /** @deprecated 旧字段，已被 breakthroughPillBonuses 替代，仅用于存档迁移 */
  breakthroughPillId?: string | null;
  /** 当前体力 */
  stamina: number;
  /** 秘境每日已进入次数 {dungeonId: count} */
  dungeonDailyCounts: Record<string, number>;
  /** 秘境每日次数重置日期 (YYYY-MM-DD) */
  dungeonResetDate: string;
  /** 秘境当日首通记录 {dungeonId: true}，每日重置，用于解锁扫荡 */
  dungeonFirstClears: Record<string, boolean>;
  /** 门派ID（null表示未选择） */
  sectId: string | null;
  /** 当前门派等级 */
  sectLevel: number;
  /** 当前累计门派贡献 */
  sectContribution: number;
  /** 当前日常门派任务ID列表 */
  sectDailyTasks: string[];
  /** 门派日常任务刷新日期 (YYYY-MM-DD) */
  sectDailyTaskDate: string;
  /** 门派任务进度缓存 */
  sectTaskProgress: Record<string, number>;
  /** 已领取的门派任务奖励ID */
  sectClaimedTasks: string[];
  /** 已解锁的门派成长被动ID */
  sectUnlockedPassives: string[];
  /** 已解锁成就ID列表 */
  unlockedAchievements: string[];
  /** 统计数据 */
  stats: GameStats;
  /** 转生次数 */
  rebirthCount: number;
  /** 仙缘（转生货币） */
  xianyuan: number;
  /** 转生永久加成 */
  rebirthPerks: RebirthPerks;
  /** 转生商店已购买次数 {itemId: count} */
  rebirthShopPurchases: Record<string, number>;
  /** 已精通（满级）的功法templateId列表，永久保留加成 */
  masteredTechniques: string[];
  /** 自定义浏览器标签页标题 */
  customTabTitle: string;
  /** 灵石商店每日购买次数 {itemId: count} */
  shopPurchases: Record<string, number>;
  /** 灵石商店每日重置日期 (YYYY-MM-DD) */
  shopResetDate: string;
  /** 游戏消息日志 */
  logs: string[];
}

/** 初始状态 */
export function createInitialState(): GameState {
  return {
    realmIndex: 0,
    exp: 0,
    gold: 0,
    herbs: 0,
    fragments: 0,
    lastSaveTime: Date.now(),
    totalPlayTime: 0,
    breakthroughCount: 0,
    breakthroughFailCount: 0,
    killCount: 0,
    currentAreaId: null,
    isBattling: false,
    equippedTechnique: null,
    techniqueBag: [],
    equippedArtifacts: { weapon: null, chest: null, pants: null, boots: null, accessory: null },
    artifactBag: [],
    autoSalvageQualities: createInitialAutoSalvageQualities(),
    sessionAutoSalvageCount: 0,
    sessionAutoSalvageFragments: 0,
    pills: [],
    buffs: [],
    breakthroughBonus: 0,
    breakthroughPillBonuses: [],
    stamina: 100,
    dungeonDailyCounts: {},
    dungeonResetDate: new Date().toISOString().slice(0, 10),
    dungeonFirstClears: {},
    sectId: null,
    sectLevel: 1,
    sectContribution: 0,
    sectDailyTasks: [],
    sectDailyTaskDate: new Date().toISOString().slice(0, 10),
    sectTaskProgress: {},
    sectClaimedTasks: [],
    sectUnlockedPassives: [],
    unlockedAchievements: [],
    stats: createInitialStats(),
    rebirthCount: 0,
    xianyuan: 0,
    rebirthPerks: createInitialPerks(),
    rebirthShopPurchases: {},
    masteredTechniques: [],
    customTabTitle: '摸鱼修仙',
    shopPurchases: {},
    shopResetDate: new Date().toISOString().slice(0, 10),
    logs: ['你睁开双眼，决定踏上修仙之路……'],
  };
}

const SAVE_KEY = 'moyu_xiuxian_save'; // 旧版单存档key，仅用于迁移
const MAX_LOGS = 50;

/** 多槽位存档key列表（最多3个） */
export const SLOT_KEYS = ['moyu_slot_1', 'moyu_slot_2', 'moyu_slot_3'] as const;
export type SlotIndex = 0 | 1 | 2;

/** 槽位存档元信息（用于选档界面展示） */
export interface SlotMeta {
  slotIndex: SlotIndex;
  label: string;
  isEmpty: boolean;
  realmName: string;
  subLevelName: string;
  rebirthCount: number;
  lastSaveTime: number;
}

/** 保存游戏到指定槽位 */
export function saveGameToSlot(state: GameState, slotIndex: SlotIndex): void {
  const data = { ...state, lastSaveTime: Date.now() };
  localStorage.setItem(SLOT_KEYS[slotIndex], JSON.stringify(data));
}

/** 从指定槽位加载游戏（含字段迁移） */
export function loadGameFromSlot(slotIndex: SlotIndex): GameState | null {
  const raw = localStorage.getItem(SLOT_KEYS[slotIndex]);
  if (!raw) return null;
  return migrateState(raw);
}

/** 删除指定槽位存档 */
export function deleteSlot(slotIndex: SlotIndex): void {
  localStorage.removeItem(SLOT_KEYS[slotIndex]);
}

/** 读取所有槽位元信息（不含完整状态） */
export function loadAllSlotMeta(): SlotMeta[] {
  return SLOT_KEYS.map((key, i) => {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return { slotIndex: i as SlotIndex, label: `存档${i + 1}`, isEmpty: true, realmName: '', subLevelName: '', rebirthCount: 0, lastSaveTime: 0 };
    }
    try {
      const d = JSON.parse(raw) as GameState;
      // 动态import会循环依赖，直接用境界索引简单显示
      return {
        slotIndex: i as SlotIndex,
        label: `存档${i + 1}`,
        isEmpty: false,
        realmName: '',      // 由UI层用getRealm填充
        subLevelName: '',
        rebirthCount: d.rebirthCount ?? 0,
        lastSaveTime: d.lastSaveTime ?? 0,
        _raw: d,
      } as SlotMeta & { _raw: GameState };
    } catch {
      return { slotIndex: i as SlotIndex, label: `存档${i + 1}`, isEmpty: true, realmName: '', subLevelName: '', rebirthCount: 0, lastSaveTime: 0 };
    }
  });
}

/** 将旧版单存档迁移到槽位1（如果槽位1为空） */
export function migrateLegacySave(): void {
  const legacy = localStorage.getItem(SAVE_KEY);
  if (!legacy) return;
  const slot1 = localStorage.getItem(SLOT_KEYS[0]);
  if (!slot1) {
    localStorage.setItem(SLOT_KEYS[0], legacy);
  }
  localStorage.removeItem(SAVE_KEY);
}

/** 保存游戏（保持旧接口，存至当前活跃槽位——由App层管理） */
export function saveGame(state: GameState): void {
  const data = { ...state, lastSaveTime: Date.now() };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

/** 字段版本迁移（所有槽位共用） */
function migrateState(raw: string): GameState | null {
  try {
    const data = JSON.parse(raw) as GameState;
    // v0.3
    if (data.herbs === undefined) data.herbs = 0;
    if (data.fragments === undefined) data.fragments = 0;
    if (data.killCount === undefined) data.killCount = 0;
    if (data.currentAreaId === undefined) data.currentAreaId = null;
    if (data.isBattling === undefined) data.isBattling = false;
    // v0.4
    if (data.equippedTechnique === undefined) data.equippedTechnique = null;
    if (data.techniqueBag === undefined) data.techniqueBag = [];
    if (data.equippedArtifacts === undefined) data.equippedArtifacts = { weapon: null, chest: null, pants: null, boots: null, accessory: null };
    // v1.1 装备槽扩展迁移（armor拆分为chest/pants/boots）
    if (data.equippedArtifacts) {
      const ea = data.equippedArtifacts as Record<string, unknown>;
      if (ea['armor'] !== undefined && ea['chest'] === undefined) {
        ea['chest'] = ea['armor'];
        delete ea['armor'];
      }
      if (ea['chest'] === undefined) ea['chest'] = null;
      if (ea['pants'] === undefined) ea['pants'] = null;
      if (ea['boots'] === undefined) ea['boots'] = null;
    }
    if (data.artifactBag === undefined) data.artifactBag = [];
    if (data.autoSalvageQualities === undefined) data.autoSalvageQualities = createInitialAutoSalvageQualities();
    else {
      const defaults = createInitialAutoSalvageQualities();
      data.autoSalvageQualities = { ...defaults, ...data.autoSalvageQualities };
    }
    if (data.sessionAutoSalvageCount === undefined) data.sessionAutoSalvageCount = 0;
    if (data.sessionAutoSalvageFragments === undefined) data.sessionAutoSalvageFragments = 0;
    // v0.5
    if (data.pills === undefined) data.pills = [];
    if (data.buffs === undefined) data.buffs = [];
    if (data.breakthroughBonus === undefined) data.breakthroughBonus = 0;
    // 迁移旧 breakthroughPillId → breakthroughPillBonuses 数组
    if (data.breakthroughPillBonuses === undefined) {
      if (data.breakthroughPillId && data.breakthroughBonus > 0) {
        data.breakthroughPillBonuses = [{ pillId: data.breakthroughPillId, bonus: data.breakthroughBonus }];
      } else {
        data.breakthroughPillBonuses = [];
      }
    }
    delete data.breakthroughPillId;
    // v0.6
    if (data.stamina === undefined) data.stamina = 100;
    if (data.dungeonDailyCounts === undefined) data.dungeonDailyCounts = {};
    if (data.dungeonResetDate === undefined) data.dungeonResetDate = new Date().toISOString().slice(0, 10);
    // v3.6.0 秘境扫荡首通记录
    if (data.dungeonFirstClears === undefined) data.dungeonFirstClears = {};
    // v0.8
    if (data.sectId === undefined) data.sectId = null;
    // v3.6.0 门派深度化
    if (data.sectLevel === undefined) data.sectLevel = 1;
    if (data.sectContribution === undefined) data.sectContribution = 0;
    if (data.sectDailyTasks === undefined) data.sectDailyTasks = [];
    if (data.sectDailyTaskDate === undefined) data.sectDailyTaskDate = new Date().toISOString().slice(0, 10);
    if (data.sectTaskProgress === undefined) data.sectTaskProgress = {};
    if (data.sectClaimedTasks === undefined) data.sectClaimedTasks = [];
    if (data.sectUnlockedPassives === undefined) data.sectUnlockedPassives = [];
    if (data.unlockedAchievements === undefined) data.unlockedAchievements = [];
    if (data.stats === undefined) data.stats = createInitialStats();
    // v0.9
    if (data.rebirthCount === undefined) data.rebirthCount = 0;
    if (data.xianyuan === undefined) data.xianyuan = 0;
    if (data.rebirthPerks === undefined) data.rebirthPerks = createInitialPerks();
    if (data.rebirthShopPurchases === undefined) data.rebirthShopPurchases = {};
    // v1.0
    if (data.customTabTitle === undefined) data.customTabTitle = '摸鱼修仙';
    // 灵石商店
    if (data.shopPurchases === undefined) data.shopPurchases = {};
    if (data.shopResetDate === undefined) data.shopResetDate = new Date().toISOString().slice(0, 10);
    // v1.0.5
    if (data.masteredTechniques === undefined) data.masteredTechniques = [];
    // v1.0.6
    if (data.rebirthPerks) {
      if (data.rebirthPerks.staminaBonus === undefined) data.rebirthPerks.staminaBonus = 0;
      if (data.rebirthPerks.breakthroughBonus === undefined) data.rebirthPerks.breakthroughBonus = 0;
      if (data.rebirthPerks.dungeonBonus === undefined) data.rebirthPerks.dungeonBonus = 0;
      if (data.rebirthPerks.battleGoldBonus === undefined) data.rebirthPerks.battleGoldBonus = 0;
      if (data.rebirthPerks.expRetain === undefined) data.rebirthPerks.expRetain = 0;
    }
    if (data.logs && data.logs.length > MAX_LOGS) {
      data.logs = data.logs.slice(-MAX_LOGS);
    }
    // v2.0 装备词条系统迁移：旧存档装备缺少quality/affixes字段时补充
    const migrateArt = (art: ArtifactInstance): ArtifactInstance => {
      const a = art as ArtifactInstance & { quality?: Quality; affixes?: unknown[] };
      if (a.quality === undefined || a.affixes === undefined) {
        // 从旧templateId推断品质（旧id格式含品质字母如_w/_g/_b/_p/_o/_r/_legend）
        const oldId = a.templateId ?? '';
        let guessQuality: Quality = 'white';
        if (oldId.includes('legend')) guessQuality = 'legend';
        else if (oldId.includes('_r'))  guessQuality = 'red';
        else if (oldId.includes('_o'))  guessQuality = 'orange';
        else if (oldId.includes('_p'))  guessQuality = 'purple';
        else if (oldId.includes('_b'))  guessQuality = 'blue';
        else if (oldId.includes('_g'))  guessQuality = 'green';
        // 尝试匹配新模板（如果旧templateId在新模板中不存在则保留旧id）
        const tmpl = getArtifactTemplate(oldId);
        const slot = tmpl ? tmpl.slot : 'accessory';
        const tier = tmpl ? tmpl.realmTier : 0;
        return {
          ...a,
          quality: guessQuality,
          affixes: generateAffixes(guessQuality, slot, tier),
        };
      }
      return a;
    };
    if (data.equippedArtifacts) {
      const slots: EquipSlot[] = ['weapon', 'chest', 'pants', 'boots', 'accessory'];
      for (const slot of slots) {
        const art = data.equippedArtifacts[slot];
        if (art) data.equippedArtifacts[slot] = migrateArt(art);
      }
    }
    if (data.artifactBag) {
      data.artifactBag = data.artifactBag.map(migrateArt);
    }
    return data;
  } catch {
    return null;
  }
}

/** 加载游戏（旧接口，兼容迁移） */
export function loadGame(): GameState | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  return migrateState(raw);
}

/** 清除存档（旧接口） */
export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

/** 添加日志（保留最近N条） */
export function addLog(state: GameState, message: string): GameState {
  const logs = [...state.logs, message];
  if (logs.length > MAX_LOGS) {
    logs.splice(0, logs.length - MAX_LOGS);
  }
  return { ...state, logs } as GameState;
}
