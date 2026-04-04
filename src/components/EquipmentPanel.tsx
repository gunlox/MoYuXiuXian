import { useState } from 'react';
import { GameState, addLog } from '../data/gameState';
import {
  getArtifactTemplate, getArtifactEnhanceCost, getArtifactBaseStats, getArtifactEnhancedBaseStats, getArtifactPower,
  QUALITY_COLORS, QUALITY_BORDER, QUALITY_BG, QUALITY_NAMES,
  QUALITY_MAX_LEVEL, QUALITY_ORDER, getArtifactSalvageRewards,
  SLOT_NAMES, SLOT_ICONS,
  ArtifactInstance, EquipSlot, Affix, Quality, getBoundedAffixValue,
} from '../data/equipment';
import { formatNumber } from '../engine/gameEngine';

interface Props {
  gameState: GameState;
  onStateChange: (updater: (prev: GameState) => GameState) => void;
}

export default function EquipmentPanel({ gameState, onStateChange }: Props) {
  const [salvagingUids, setSalvagingUids] = useState<string[]>([]);

  // ========== 装备操作 ==========
  const equipArtifact = (art: ArtifactInstance) => {
    const tmpl = getArtifactTemplate(art.templateId);
    if (!tmpl) return;
    onStateChange(prev => {
      const slot = tmpl.slot;
      let bag = prev.artifactBag.filter(a => a.uid !== art.uid);
      const current = prev.equippedArtifacts[slot];
      if (current) bag = [...bag, current];
      const newEquipped = { ...prev.equippedArtifacts, [slot]: art };
      let s = { ...prev, equippedArtifacts: newEquipped, artifactBag: bag };
      s = addLog(s, `${SLOT_ICONS[slot]} 装备【${tmpl.name}】`);
      return s;
    });
  };

  const enhanceArtifact = (slot: EquipSlot) => {
    onStateChange(prev => {
      const art = prev.equippedArtifacts[slot];
      if (!art) return prev;
      const tmpl = getArtifactTemplate(art.templateId);
      if (!tmpl) return prev;
      const maxLevel = QUALITY_MAX_LEVEL[art.quality];
      if (art.level >= maxLevel) return addLog(prev, '装备已达最高等级');
      const cost = getArtifactEnhanceCost(art);
      if (prev.gold < cost.gold) return addLog(prev, `灵石不足，需要 ${formatNumber(cost.gold)}`);
      if (prev.fragments < cost.fragments) return addLog(prev, `碎片不足，需要 ${cost.fragments}`);
      const newArt = { ...art, level: art.level + 1 };
      const newEquipped = { ...prev.equippedArtifacts, [slot]: newArt };
      let s = { ...prev, equippedArtifacts: newEquipped, gold: prev.gold - cost.gold, fragments: prev.fragments - cost.fragments };
      s = addLog(s, `⬆️ 装备【${tmpl.name}】强化至+${newArt.level}`);
      return s;
    });
  };

  const sellArtifact = (art: ArtifactInstance) => {
    if (salvagingUids.includes(art.uid)) return;
    const tmpl = getArtifactTemplate(art.templateId);
    if (!tmpl) return;
    const rewards = getArtifactSalvageRewards(art.quality);
    setSalvagingUids(prev => prev.includes(art.uid) ? prev : [...prev, art.uid]);
    onStateChange(prev => {
      const exists = prev.artifactBag.some(a => a.uid === art.uid);
      if (!exists) return prev;
      const bag = prev.artifactBag.filter(a => a.uid !== art.uid);
      let s = { ...prev, artifactBag: bag, gold: prev.gold + rewards.gold, fragments: prev.fragments + rewards.fragments };
      s = addLog(s, `💰 分解【${tmpl.name}】，获得 ${formatNumber(rewards.gold)} 灵石和 ${rewards.fragments} 碎片`);
      return s;
    });
    window.setTimeout(() => {
      setSalvagingUids(prev => prev.filter(uid => uid !== art.uid));
    }, 150);
  };

  const toggleAutoSalvage = (quality: Quality) => {
    onStateChange(prev => ({
      ...prev,
      autoSalvageQualities: {
        ...prev.autoSalvageQualities,
        [quality]: !prev.autoSalvageQualities[quality],
      },
    }));
  };

  const salvageSelectedQualities = () => {
    const targetArtifacts = gameState.artifactBag.filter(art => gameState.autoSalvageQualities[art.quality]);
    if (targetArtifacts.length === 0) {
      onStateChange(prev => addLog(prev, '当前没有符合勾选品质的装备可分解'));
      return;
    }

    const targetUids = targetArtifacts.map(art => art.uid);
    setSalvagingUids(prev => [...new Set([...prev, ...targetUids])]);

    onStateChange(prev => {
      const artifactsToSalvage = prev.artifactBag.filter(art => prev.autoSalvageQualities[art.quality]);
      if (artifactsToSalvage.length === 0) return prev;

      const uidSet = new Set(artifactsToSalvage.map(art => art.uid));
      const bag = prev.artifactBag.filter(art => !uidSet.has(art.uid));
      const totalRewards = artifactsToSalvage.reduce(
        (acc, art) => {
          const rewards = getArtifactSalvageRewards(art.quality);
          acc.gold += rewards.gold;
          acc.fragments += rewards.fragments;
          return acc;
        },
        { gold: 0, fragments: 0 }
      );

      let s = {
        ...prev,
        artifactBag: bag,
        gold: prev.gold + totalRewards.gold,
        fragments: prev.fragments + totalRewards.fragments,
      };
      s = addLog(s, `💥 立即分解 ${artifactsToSalvage.length} 件装备，获得 ${formatNumber(totalRewards.gold)} 灵石和 ${totalRewards.fragments} 碎片`);
      return s;
    });

    window.setTimeout(() => {
      setSalvagingUids(prev => prev.filter(uid => !targetUids.includes(uid)));
    }, 150);
  };

  const selectedQualityArtifactCount = gameState.artifactBag.filter(art => gameState.autoSalvageQualities[art.quality]).length;

  return (
    <div className="space-y-4">
      {/* ===== 装备区域 ===== */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-5 border border-xian-gold/30">
        <div className="flex items-center justify-between mb-3">
          <div className="text-base text-xian-gold/80 font-kai">⚔️ 装备</div>
          <div className="text-sm text-xian-gold/70">
            💠 碎片: <span className="text-blue-400">{gameState.fragments}</span>
          </div>
        </div>

        {/* 5个装备槽 */}
        <div className="space-y-2 mb-3">
          {(['weapon', 'chest', 'pants', 'boots', 'accessory'] as EquipSlot[]).map(slot => {
            const art = gameState.equippedArtifacts[slot];
            const tmpl = art ? getArtifactTemplate(art.templateId) : null;
            const maxLevel = art ? QUALITY_MAX_LEVEL[art.quality] : 0;
            const power = art && tmpl ? getArtifactPower(art) : 0;
            return (
              <div key={slot} className={`rounded-lg p-3 border ${art ? QUALITY_BORDER[art.quality] : 'border-white/10'} ${art ? QUALITY_BG[art.quality] : 'bg-black/20'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{SLOT_ICONS[slot]}</span>
                    <div>
                      <div className="text-sm text-xian-gold/80">{SLOT_NAMES[slot]}</div>
                      {tmpl && art ? (
                        <div>
                          <span className={`text-base font-bold ${QUALITY_COLORS[art.quality]}`}>{tmpl.name}</span>
                          <span className="text-sm text-xian-gold/70 ml-1">+{art.level}</span>
                          <span className={`text-xs ml-1 ${QUALITY_COLORS[art.quality]}`}>[{QUALITY_NAMES[art.quality]}]</span>
                          <div className="text-xs text-cyan-300/90 font-semibold mt-0.5">装备战力 {formatNumber(power)}</div>
                        </div>
                      ) : (
                        <div className="text-base text-gray-500">未装备</div>
                      )}
                    </div>
                  </div>
                  {art && art.level < maxLevel && (
                    <button
                      onClick={() => enhanceArtifact(slot)}
                      className="px-2 py-1 text-sm rounded bg-blue-600/30 border border-blue-500/30 text-blue-300 hover:bg-blue-600/50 transition-all"
                    >
                      强化
                    </button>
                  )}
                </div>
                {/* 基础属性展示 */}
                {tmpl && art && (() => {
                  const base = getArtifactEnhancedBaseStats(tmpl.slot, tmpl.realmTier, art.quality, art.level, gameState.rebirthCount ?? 0);
                  const items: string[] = [];
                  if (base.atk > 0)      items.push(`攻击 +${formatNumber(base.atk)}`);
                  if (base.def > 0)      items.push(`防御 +${formatNumber(base.def)}`);
                  if (base.hp > 0)       items.push(`气血 +${formatNumber(base.hp)}`);
                  if (base.critRate > 0) items.push(`暴击率 +${(base.critRate * 100).toFixed(1)}%`);
                  if (base.critDmg > 0)  items.push(`暴击伤 +${(base.critDmg * 100).toFixed(0)}%`);
                  if (base.dodge > 0)    items.push(`闪避率 +${(base.dodge * 100).toFixed(1)}%`);
                  return items.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {items.map(i => (
                        <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-yellow-900/30 text-yellow-300/90">{i}</span>
                      ))}
                    </div>
                  ) : null;
                })()}
                {/* 词条展示 */}
                {art && art.affixes && art.affixes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {art.affixes.map((af, i) => (
                      <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-xian-gold/80">
                        {renderAffix(af, tmpl?.realmTier)}
                      </span>
                    ))}
                  </div>
                )}
                {/* 强化后属性展示 */}
                {art && art.level > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-green-400/80">
                    {renderArtBonuses(art)}
                  </div>
                )}
                {/* 强化费用 */}
                {art && art.level < maxLevel && (
                  <div className="text-xs text-xian-gold/60 mt-1">
                    {(() => { const c = getArtifactEnhanceCost(art); return `强化: ${formatNumber(c.gold)}灵石 + ${c.fragments}碎片 (当前+${art.level} → +${art.level + 1})`; })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 装备背包 */}
        <div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-xian-gold/70 mb-2">
            <div>装备背包 ({gameState.artifactBag.length})</div>
            <div>拾取自动分解</div>
            {QUALITY_ORDER.map(quality => (
              <label key={quality} className={`inline-flex items-center gap-1 cursor-pointer ${QUALITY_COLORS[quality]}`}>
                <input
                  type="checkbox"
                  checked={gameState.autoSalvageQualities[quality]}
                  onChange={() => toggleAutoSalvage(quality)}
                  className="accent-xian-gold"
                />
                <span>{QUALITY_NAMES[quality]}</span>
              </label>
            ))}
            <button
              onClick={salvageSelectedQualities}
              disabled={selectedQualityArtifactCount === 0}
              className={`px-3 py-1 text-sm rounded border transition-all ${selectedQualityArtifactCount === 0 ? 'bg-gray-700/20 border-gray-600/30 text-gray-500 cursor-not-allowed' : 'bg-red-600/20 border-red-500/30 text-red-300 hover:bg-red-600/30'}`}
            >
              立即分解
            </button>
          </div>
          <div className="text-sm text-xian-gold/60 mb-2">
            本局累计自动分解了 <span className="text-green-300 font-semibold">{gameState.sessionAutoSalvageCount}</span> 件 / 获得碎片 <span className="text-cyan-300 font-semibold">{gameState.sessionAutoSalvageFragments}</span>
          </div>
        {gameState.artifactBag.length > 0 ? (
          <div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {gameState.artifactBag.map(art => {
                const tmpl = getArtifactTemplate(art.templateId);
                if (!tmpl) return null;
                const isSalvaging = salvagingUids.includes(art.uid);
                const power = getArtifactPower(art);
                const equipped = gameState.equippedArtifacts[tmpl.slot];
                const equippedPower = equipped ? getArtifactPower(equipped) : 0;
                const diff = equipped ? power - equippedPower : null;
                const betterThanEquipped = diff !== null && diff > 0;
                return (
                  <div key={art.uid} className={`p-2 rounded-lg border ${QUALITY_BORDER[art.quality]} ${QUALITY_BG[art.quality]}`}>
                    <div className="flex items-center justify-between">
                    <div>
                      <span className="text-base mr-1">{SLOT_ICONS[tmpl.slot]}</span>
                      <span className={`text-base font-bold ${QUALITY_COLORS[art.quality]}`}>{tmpl.name}</span>
                      <span className="text-sm text-xian-gold/70 ml-1">+{art.level}</span>
                      <span className={`text-xs ml-1 ${QUALITY_COLORS[art.quality]}`}>[{QUALITY_NAMES[art.quality]}]</span>
                      <div className="text-xs mt-0.5">
                        <span className="text-cyan-300/90 font-semibold">装备战力 {formatNumber(power)}</span>
                        <span className={`ml-2 font-semibold ${diff === null ? 'text-blue-300/90' : diff > 0 ? 'text-green-300' : diff < 0 ? 'text-red-300' : 'text-gray-400'}`}>
                          {diff === null ? '可装备' : diff > 0 ? `↑+${formatNumber(diff)}` : diff < 0 ? `↓-${formatNumber(Math.abs(diff))}` : '≈0'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => equipArtifact(art)}
                        className="px-2 py-1 text-sm rounded bg-xian-gold/20 text-xian-gold hover:bg-xian-gold/30 transition-all"
                      >
                        {betterThanEquipped ? '替换装备' : '装备'}
                      </button>
                      <button
                        onClick={() => sellArtifact(art)}
                        disabled={isSalvaging}
                        className={`px-2 py-1 text-sm rounded transition-all ${isSalvaging ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed' : 'bg-red-600/20 text-red-400 hover:bg-red-600/30'}`}
                      >
                        {isSalvaging ? '处理中' : '分解'}
                      </button>
                    </div>
                    </div>
                    {/* 基础属性展示 */}
                    {(() => {
                      const base = getArtifactBaseStats(tmpl.slot, tmpl.realmTier, gameState.rebirthCount ?? 0);
                      const items: string[] = [];
                      if (base.atk > 0)      items.push(`攻击 +${formatNumber(base.atk)}`);
                      if (base.def > 0)      items.push(`防御 +${formatNumber(base.def)}`);
                      if (base.hp > 0)       items.push(`气血 +${formatNumber(base.hp)}`);
                      if (base.critRate > 0) items.push(`暴击率 +${(base.critRate * 100).toFixed(1)}%`);
                      if (base.critDmg > 0)  items.push(`暴击伤 +${(base.critDmg * 100).toFixed(0)}%`);
                      if (base.dodge > 0)    items.push(`闪避率 +${(base.dodge * 100).toFixed(1)}%`);
                      return items.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {items.map(i => (
                            <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-yellow-900/30 text-yellow-300/90">{i}</span>
                          ))}
                        </div>
                      ) : null;
                    })()}
                    {/* 词条展示 */}
                    {art.affixes && art.affixes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {art.affixes.map((af, i) => (
                          <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-xian-gold/70">
                            {renderAffix(af, tmpl?.realmTier)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-sm text-xian-gold/50 bg-black/20 rounded-lg p-3">当前没有未分解装备</div>
        )}
        </div>
      </div>
    </div>
  );
}


function renderAffix(af: Affix, realmTier?: number): string {
  const value = getBoundedAffixValue(af.type, af.value, realmTier);
  switch (af.type) {
    case 'atk':      return `攻击 +${formatNumber(Math.floor(value))}`;
    case 'def':      return `防御 +${formatNumber(Math.floor(value))}`;
    case 'hp':       return `气血 +${formatNumber(Math.floor(value))}`;
    case 'critRate': return `暴击率 +${(value * 100).toFixed(1)}%`;
    case 'critDmg':  return `暴击伤 +${(value * 100).toFixed(0)}%`;
    case 'dodge':    return `闪避率 +${(value * 100).toFixed(1)}%`;
    case 'expRate':  return `修炼速度 +${(value * 100).toFixed(2)}%`;
    default:         return '';
  }
}

function renderArtBonuses(art: ArtifactInstance) {
  if (art.level === 0) return null;
  const tmpl = getArtifactTemplate(art.templateId);
  if (!tmpl) return null;
  const base = getArtifactBaseStats(tmpl.slot, tmpl.realmTier);
  const enhanced = getArtifactEnhancedBaseStats(tmpl.slot, tmpl.realmTier, art.quality, art.level);
  const items: string[] = [];
  if (enhanced.atk > base.atk) items.push(`强化攻+${formatNumber(enhanced.atk - base.atk)}`);
  if (enhanced.def > base.def) items.push(`强化防+${formatNumber(enhanced.def - base.def)}`);
  if (enhanced.hp > base.hp) items.push(`强化血+${formatNumber(enhanced.hp - base.hp)}`);
  if (enhanced.critRate > base.critRate) items.push(`强化暴+${((enhanced.critRate - base.critRate) * 100).toFixed(1)}%`);
  if (enhanced.critDmg > base.critDmg) items.push(`强化爆+${((enhanced.critDmg - base.critDmg) * 100).toFixed(0)}%`);
  if (enhanced.dodge > base.dodge) items.push(`强化闪+${((enhanced.dodge - base.dodge) * 100).toFixed(1)}%`);
  return items.map(i => <span key={i}>{i}</span>);
}
