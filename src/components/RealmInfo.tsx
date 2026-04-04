import { getRealm, getNextRealm } from '../data/realms';
import { GameState } from '../data/gameState';
import { formatNumber } from '../engine/gameEngine';
import { getExpMultiplier } from '../engine/attributeCalc';

interface Props {
  gameState: GameState;
}

/** 境界颜色映射 */
function getRealmColor(realmName: string): string {
  const colors: Record<string, string> = {
    '练气': 'text-gray-300',
    '筑基': 'text-green-400',
    '金丹': 'text-blue-400',
    '元婴': 'text-purple-400',
    '化神': 'text-orange-400',
    '渡劫': 'text-red-400',
  };
  return colors[realmName] || 'text-gray-300';
}

function getRealmGlow(realmName: string): string {
  const glows: Record<string, string> = {
    '练气': '',
    '筑基': 'drop-shadow(0 0 6px rgba(74,222,128,0.4))',
    '金丹': 'drop-shadow(0 0 8px rgba(96,165,250,0.5))',
    '元婴': 'drop-shadow(0 0 10px rgba(167,139,250,0.5))',
    '化神': 'drop-shadow(0 0 12px rgba(251,146,60,0.5))',
    '渡劫': 'drop-shadow(0 0 14px rgba(248,113,113,0.6))',
  };
  return glows[realmName] || '';
}

export default function RealmInfo({ gameState }: Props) {
  const realm = getRealm(gameState.realmIndex);
  const nextRealm = getNextRealm(gameState.realmIndex);
  const progress = nextRealm ? Math.min((gameState.exp / realm.requiredExp) * 100, 100) : 100;
  const colorClass = getRealmColor(realm.name);
  const glowStyle = getRealmGlow(realm.name);
  const expMul = getExpMultiplier(gameState);
  const baseExpPS = realm.expPerSecond;
  const bonusExpPS = baseExpPS * (expMul - 1);
  const actualExpPS = baseExpPS * expMul;

  return (
    <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-6 border border-xian-gold/30">
      {/* 境界名称 */}
      <div className="text-center mb-4">
        <div className="text-base text-xian-gold/80 mb-1">当前境界</div>
        <div
          className={`text-3xl font-bold ${colorClass} font-kai`}
          style={{ filter: glowStyle }}
        >
          {realm.subLevelName}
        </div>
      </div>

      {/* 修为进度 */}
      <div className="mb-3">
        <div className="flex justify-between text-base mb-1">
          <span className="text-xian-gold/90">修为</span>
          <span className="text-xian-gold">
            {formatNumber(gameState.exp)} / {formatNumber(realm.requiredExp)}
          </span>
        </div>
        <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-xian-gold/20">
          <div
            className="h-full rounded-full transition-all duration-200 progress-shimmer"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 修炼速度 */}
      <div className="grid grid-cols-2 gap-3 text-base">
        <div className="bg-black/20 rounded-lg p-3 text-center">
          <div className="text-xian-gold/80 text-sm">修为速度</div>
          <div className="text-xian-jade font-bold">
            {actualExpPS.toFixed(2)}/秒
            {expMul > 1 && (
              <span className="text-xs text-green-400 ml-1">
                ({baseExpPS.toFixed(2)}+{bonusExpPS.toFixed(2)})
              </span>
            )}
          </div>
          {expMul > 1 && (
            <div className="text-xs text-green-400 mt-0.5">加成 +{((expMul - 1) * 100).toFixed(0)}%</div>
          )}
        </div>
        <div className="bg-black/20 rounded-lg p-3 text-center">
          <div className="text-xian-gold/80 text-sm">灵石速度</div>
          <div className="text-yellow-400 font-bold">{formatNumber(realm.goldPerSecond)}/秒</div>
        </div>
      </div>

      {/* 下一境界 */}
      {nextRealm && (
        <div className="mt-3 text-center text-sm text-xian-gold/70">
          下一境界：{nextRealm.subLevelName}
        </div>
      )}
      {!nextRealm && (
        <div className="mt-3 text-center text-sm text-red-400">
          已达修仙巅峰！
        </div>
      )}
    </div>
  );
}
