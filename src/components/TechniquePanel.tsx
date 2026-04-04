import { GameState, addLog } from '../data/gameState';
import {
  getTechTemplate, getTechUpgradeCost, getTechBonuses, getMasteryBonuses,
  QUALITY_COLORS, QUALITY_BORDER, QUALITY_BG, QUALITY_NAMES,
  QUALITY_ORDER, TechniqueInstance,
} from '../data/equipment';
import { formatNumber } from '../engine/gameEngine';

interface Props {
  gameState: GameState;
  onStateChange: (updater: (prev: GameState) => GameState) => void;
}

export default function TechniquePanel({ gameState, onStateChange }: Props) {
  const equipTechnique = (tech: TechniqueInstance) => {
    onStateChange(prev => {
      const tmpl = getTechTemplate(tech.templateId);
      let bag = prev.techniqueBag.filter(t => t.templateId !== tech.templateId);
      if (prev.equippedTechnique) {
        bag = [...bag, prev.equippedTechnique];
      }
      let s: GameState = { ...prev, equippedTechnique: tech, techniqueBag: bag };
      s = addLog(s, `📖 修炼功法【${tmpl?.name}】`);
      return s;
    });
  };

  const upgradeTechnique = () => {
    onStateChange(prev => {
      if (!prev.equippedTechnique) return prev;
      const tmpl = getTechTemplate(prev.equippedTechnique.templateId);
      if (!tmpl) return prev;
      if (prev.equippedTechnique.level >= tmpl.maxLevel) return addLog(prev, '功法已达最高等级');
      const cost = getTechUpgradeCost(tmpl, prev.equippedTechnique.level);
      if (prev.exp < cost) return addLog(prev, `修为不足，升级需要 ${formatNumber(cost)} 修为`);
      const newTech = { ...prev.equippedTechnique, level: prev.equippedTechnique.level + 1 };
      let s: GameState = { ...prev, equippedTechnique: newTech, exp: prev.exp - cost };
      s = addLog(s, `⬆️ 功法【${tmpl.name}】升至${newTech.level}级`);
      if (newTech.level >= tmpl.maxLevel) {
        const already = (s.masteredTechniques ?? []).includes(tmpl.id);
        if (!already) {
          s = { ...s, masteredTechniques: [...(s.masteredTechniques ?? []), tmpl.id] };
          s = addLog(s, `✨ 功法【${tmpl.name}】已精通！永久获得其加成效果（50%强度）`);
        }
      }
      return s;
    });
  };

  const equippedTech = gameState.equippedTechnique;
  const equippedTechTmpl = equippedTech ? getTechTemplate(equippedTech.templateId) : null;
  const qualityRank = new Map(QUALITY_ORDER.map((quality, index) => [quality, index]));
  const sortedTechniqueBag = [...gameState.techniqueBag].sort((a, b) => {
    const tmplA = getTechTemplate(a.templateId);
    const tmplB = getTechTemplate(b.templateId);
    if (!tmplA || !tmplB) return 0;

    const aMaxed = a.level >= tmplA.maxLevel;
    const bMaxed = b.level >= tmplB.maxLevel;
    if (aMaxed !== bMaxed) return aMaxed ? 1 : -1;

    const qualityDiff = (qualityRank.get(tmplB.quality) ?? -1) - (qualityRank.get(tmplA.quality) ?? -1);
    if (qualityDiff !== 0) return qualityDiff;

    if (!aMaxed && !bMaxed && a.level !== b.level) return b.level - a.level;

    return a.templateId.localeCompare(b.templateId, 'zh-CN');
  });

  return (
    <div className="space-y-4">
      {/* 当前修炼的功法 */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-5 border border-xian-gold/30">
        <div className="text-base text-xian-gold/80 font-kai mb-3">📖 当前修炼</div>

        {equippedTech && equippedTechTmpl ? (
          <div className={`rounded-lg p-4 border ${QUALITY_BORDER[equippedTechTmpl.quality]} ${QUALITY_BG[equippedTechTmpl.quality]}`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className={`font-bold font-kai text-lg ${QUALITY_COLORS[equippedTechTmpl.quality]}`}>
                  {equippedTechTmpl.name}
                </span>
                <span className="text-sm text-xian-gold/70 ml-2">
                  Lv.{equippedTech.level}/{equippedTechTmpl.maxLevel}
                </span>
                <span className={`text-sm ml-2 ${QUALITY_COLORS[equippedTechTmpl.quality]}`}>
                  [{QUALITY_NAMES[equippedTechTmpl.quality]}]
                </span>
              </div>
            </div>
            <div className="text-sm text-xian-gold/70 mb-3">{equippedTechTmpl.description}</div>
            {/* 加成显示 */}
            <div className="grid grid-cols-3 gap-1 text-sm mb-3">
              {renderTechBonuses(equippedTech)}
            </div>
            {/* 升级进度条 */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-xian-gold/60 mb-1">
                <span>修炼进度</span>
                <span>{equippedTech.level}/{equippedTechTmpl.maxLevel}</span>
              </div>
              <div className="bg-black/30 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-300"
                  style={{ width: `${(equippedTech.level / equippedTechTmpl.maxLevel) * 100}%` }}
                />
              </div>
            </div>
            {equippedTech.level < equippedTechTmpl.maxLevel ? (
              <button
                onClick={upgradeTechnique}
                className="w-full py-2 text-sm rounded-lg bg-purple-600/30 border border-purple-500/30 text-purple-300 hover:bg-purple-600/50 transition-all"
              >
                ⬆️ 升级 (消耗修为 {formatNumber(getTechUpgradeCost(equippedTechTmpl, equippedTech.level))})
              </button>
            ) : (
              <div className="w-full py-2 text-sm rounded-lg bg-yellow-600/20 border border-yellow-500/30 text-yellow-300 text-center">
                ✨ 已达最高等级
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-xian-gold/60 text-base py-6 bg-black/20 rounded-lg">
            尚未修炼任何功法
          </div>
        )}
      </div>

      {/* 已精通功法 */}
      {(gameState.masteredTechniques ?? []).length > 0 && (
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-5 border border-yellow-500/30">
          <div className="text-base text-yellow-400/90 font-kai mb-3">✨ 已精通功法 ({gameState.masteredTechniques.length})</div>
          <div className="space-y-2">
            {gameState.masteredTechniques.map(id => {
              const tmpl = getTechTemplate(id);
              if (!tmpl) return null;
              const mb = getMasteryBonuses([id]);
              const bonuses: string[] = [];
              if (mb.expBonus > 0) bonuses.push(`修炼+${(mb.expBonus * 100).toFixed(0)}%`);
              if (mb.atkBonus > 0) bonuses.push(`攻击+${(mb.atkBonus * 100).toFixed(0)}%`);
              if (mb.defBonus > 0) bonuses.push(`防御+${(mb.defBonus * 100).toFixed(0)}%`);
              if (mb.hpBonus > 0) bonuses.push(`气血+${(mb.hpBonus * 100).toFixed(0)}%`);
              if (mb.critRateBonus > 0) bonuses.push(`暴击率+${(mb.critRateBonus * 100).toFixed(1)}%`);
              if (mb.critDmgBonus > 0) bonuses.push(`暴击伤害+${(mb.critDmgBonus * 100).toFixed(0)}%`);
              if (mb.dodgeBonus > 0) bonuses.push(`闪避+${(mb.dodgeBonus * 100).toFixed(1)}%`);
              return (
                <div key={id} className={`p-3 rounded-lg border ${QUALITY_BORDER[tmpl.quality]} ${QUALITY_BG[tmpl.quality]}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-300">✨</span>
                    <span className={`font-bold font-kai ${QUALITY_COLORS[tmpl.quality]}`}>{tmpl.name}</span>
                    <span className={`text-xs ${QUALITY_COLORS[tmpl.quality]}`}>[{QUALITY_NAMES[tmpl.quality]}]</span>
                    <span className="text-xs text-xian-gold/50">Lv.{tmpl.maxLevel}（已精通）</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {bonuses.map(b => (
                      <span key={b} className="bg-black/20 rounded px-1.5 py-0.5 text-green-400">{b}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 功法背包 */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-5 border border-xian-gold/30">
        <div className="text-base text-xian-gold/80 font-kai mb-3">
          📚 功法背包 {gameState.techniqueBag.length > 0 && `(${gameState.techniqueBag.length})`}
        </div>
        {sortedTechniqueBag.length > 0 ? (
          <div className="space-y-2">
            {sortedTechniqueBag.map(tech => {
              const tmpl = getTechTemplate(tech.templateId);
              if (!tmpl) return null;
              const b = getTechBonuses(tech);
              const bonusStr: string[] = [];
              if (b.expBonus > 0) bonusStr.push(`修炼+${(b.expBonus * 100).toFixed(0)}%`);
              if (b.atkBonus > 0) bonusStr.push(`攻+${(b.atkBonus * 100).toFixed(0)}%`);
              if (b.defBonus > 0) bonusStr.push(`防+${(b.defBonus * 100).toFixed(0)}%`);
              if (b.hpBonus > 0) bonusStr.push(`血+${(b.hpBonus * 100).toFixed(0)}%`);
              if (b.critRateBonus > 0) bonusStr.push(`暴击+${(b.critRateBonus * 100).toFixed(1)}%`);
              if (b.critDmgBonus > 0) bonusStr.push(`爆伤+${(b.critDmgBonus * 100).toFixed(0)}%`);
              if (b.dodgeBonus > 0) bonusStr.push(`闪避+${(b.dodgeBonus * 100).toFixed(1)}%`);
              return (
                <div key={tech.templateId} className={`p-3 rounded-lg border ${QUALITY_BORDER[tmpl.quality]} ${QUALITY_BG[tmpl.quality]}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className={`text-base font-bold ${QUALITY_COLORS[tmpl.quality]}`}>{tmpl.name}</span>
                      <span className="text-sm text-xian-gold/70 ml-1">Lv.{tech.level}</span>
                      <span className={`text-sm ml-1 ${QUALITY_COLORS[tmpl.quality]}`}>[{QUALITY_NAMES[tmpl.quality]}]</span>
                    </div>
                    <button
                      onClick={() => equipTechnique(tech)}
                      className="px-3 py-1 text-sm rounded bg-xian-gold/20 text-xian-gold hover:bg-xian-gold/30 transition-all"
                    >
                      修炼
                    </button>
                  </div>
                  <div className="text-xs text-xian-gold/60 mb-1">{tmpl.description}</div>
                  {bonusStr.length > 0 && (
                    <div className="flex flex-wrap gap-1 text-xs">
                      {bonusStr.map(b => (
                        <span key={b} className="bg-black/20 rounded px-1.5 py-0.5 text-green-400">{b}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-xian-gold/60 text-sm py-4 bg-black/20 rounded-lg">
            背包中暂无功法<br />
            <span className="text-xs text-xian-gold/40">通过战斗可获得功法书</span>
          </div>
        )}
      </div>
    </div>
  );
}

function renderTechBonuses(tech: TechniqueInstance) {
  const b = getTechBonuses(tech);
  const items: { label: string; value: string }[] = [];
  if (b.expBonus > 0) items.push({ label: '修炼', value: `+${(b.expBonus * 100).toFixed(0)}%` });
  if (b.atkBonus > 0) items.push({ label: '攻击', value: `+${(b.atkBonus * 100).toFixed(0)}%` });
  if (b.defBonus > 0) items.push({ label: '防御', value: `+${(b.defBonus * 100).toFixed(0)}%` });
  if (b.hpBonus > 0) items.push({ label: '气血', value: `+${(b.hpBonus * 100).toFixed(0)}%` });
  if (b.critRateBonus > 0) items.push({ label: '暴击率', value: `+${(b.critRateBonus * 100).toFixed(1)}%` });
  if (b.critDmgBonus > 0) items.push({ label: '暴击伤害', value: `+${(b.critDmgBonus * 100).toFixed(0)}%` });
  if (b.dodgeBonus > 0) items.push({ label: '闪避', value: `+${(b.dodgeBonus * 100).toFixed(1)}%` });
  return items.map(i => (
    <div key={i.label} className="bg-black/20 rounded px-2 py-1 text-center">
      <span className="text-xian-gold/70">{i.label} </span>
      <span className="text-green-400">{i.value}</span>
    </div>
  ));
}
