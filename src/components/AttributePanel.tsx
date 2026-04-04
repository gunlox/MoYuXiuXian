import { GameState } from '../data/gameState';
import { formatNumber } from '../engine/gameEngine';
import { calcFinalAttributes, calcBonusAttributes, getCharacterPower, getExpMultiplier } from '../engine/attributeCalc';

interface Props {
  gameState: GameState;
}

export default function AttributePanel({ gameState }: Props) {
  const attrs = calcFinalAttributes(gameState);
  const bonus = calcBonusAttributes(gameState);
  const expMul = getExpMultiplier(gameState);

  const totalPower = getCharacterPower(attrs);

  return (
    <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-5 border border-xian-gold/30">
      <div className="flex items-center justify-between mb-4">
        <div className="text-base text-xian-gold/80 font-kai">🔮 修仙属性</div>
        <div className="text-sm bg-xian-gold/10 border border-xian-gold/20 rounded-full px-3 py-1">
          战力 <span className="text-xian-gold font-bold">{formatNumber(totalPower)}</span>
        </div>
      </div>

      {/* 基础属性 */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="bg-black/20 rounded-lg p-3 flex items-center gap-2 border border-white/5 hover:border-xian-gold/20 transition-colors">
          <span className="text-xl">⚔️</span>
          <div>
            <div className="text-xs text-xian-gold/80">攻击</div>
            <div className="text-base font-bold text-red-400">{formatNumber(attrs.attack)}</div>
          </div>
        </div>
        <div className="bg-black/20 rounded-lg p-3 flex items-center gap-2 border border-white/5 hover:border-xian-gold/20 transition-colors">
          <span className="text-xl">🛡️</span>
          <div>
            <div className="text-xs text-xian-gold/80">防御</div>
            <div className="text-base font-bold text-blue-400">{formatNumber(attrs.defense)}</div>
          </div>
        </div>
        <div className="bg-black/20 rounded-lg p-3 flex items-center gap-2 border border-white/5 hover:border-xian-gold/20 transition-colors">
          <span className="text-xl">❤️</span>
          <div>
            <div className="text-xs text-xian-gold/80">气血</div>
            <div className="text-base font-bold text-green-400">{formatNumber(attrs.hp)}</div>
          </div>
        </div>
      </div>

      {/* 附加属性 */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-black/20 rounded-lg p-2.5 text-center border border-white/5 hover:border-yellow-500/20 transition-colors">
          <div className="text-xs text-xian-gold/70 mb-0.5">🎯 暴击率</div>
          <div className="text-sm font-bold text-yellow-400">{(bonus.critRate * 100).toFixed(1)}%</div>
        </div>
        <div className="bg-black/20 rounded-lg p-2.5 text-center border border-white/5 hover:border-orange-500/20 transition-colors">
          <div className="text-xs text-xian-gold/70 mb-0.5">💥 暴击伤害</div>
          <div className="text-sm font-bold text-orange-400">+{(bonus.critDmg * 100).toFixed(0)}%</div>
        </div>
        <div className="bg-black/20 rounded-lg p-2.5 text-center border border-white/5 hover:border-cyan-500/20 transition-colors">
          <div className="text-xs text-xian-gold/70 mb-0.5">💨 闪避</div>
          <div className="text-sm font-bold text-cyan-400">{(bonus.dodge * 100).toFixed(1)}%</div>
        </div>
      </div>

      {expMul > 1 && (
        <div className="mt-3 text-center text-sm text-green-400 bg-green-500/5 rounded-lg py-1.5 border border-green-500/10">
          📖 修炼加持：速度 x{expMul.toFixed(2)}
        </div>
      )}
    </div>
  );
}
