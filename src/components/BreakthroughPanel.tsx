import { formatNumber } from '../engine/gameEngine';

interface BreakthroughInfo {
  canDo: boolean;
  needExp: number;
  needGold: number;
  successRate: number;
  isMajor: boolean;
  nextName: string;
}

interface Props {
  info: BreakthroughInfo;
  currentExp: number;
  currentGold: number;
  breakthroughBonus: number;
  onBreakthrough: () => void;
}

export default function BreakthroughPanel({ info, currentExp, currentGold, breakthroughBonus, onBreakthrough }: Props) {
  const expReady = currentExp >= info.needExp;
  const goldReady = !info.isMajor || currentGold >= info.needGold;

  if (info.nextName === '已达巅峰') {
    return (
      <div className="bg-gradient-to-br from-[#2a1a1e] to-[#1a1a2e] rounded-xl p-6 border border-red-500/30 text-center">
        <div className="text-2xl mb-2">🏆</div>
        <div className="text-red-400 font-bold font-kai text-xl">已臻至境</div>
        <div className="text-xian-gold/70 text-base mt-2">天地之间，唯你独尊</div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-6 border transition-all duration-300 ${
      info.canDo
        ? 'bg-gradient-to-br from-[#1a2e1a] to-[#1a1a2e] border-green-500/40 shadow-lg shadow-green-500/10'
        : 'bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-xian-gold/20'
    }`}>
      <div className="text-center mb-4">
        <div className="text-base text-xian-gold/80 mb-1">
          {info.isMajor ? '🌟 大境界突破' : '突破修炼'}
        </div>
        <div className="text-xl font-bold text-xian-gold font-kai">
          → {info.nextName}
        </div>
      </div>

      {/* 条件列表 */}
      <div className="space-y-2 mb-4">
        {/* 修为条件 */}
        <div className="flex justify-between items-center text-base">
          <span className="text-xian-gold/90">
            {expReady ? '✅' : '❌'} 修为
          </span>
          <span className={expReady ? 'text-green-400' : 'text-red-400'}>
            {formatNumber(currentExp)} / {formatNumber(info.needExp)}
          </span>
        </div>

        {/* 灵石条件（仅大境界突破） */}
        {info.isMajor && (
          <div className="flex justify-between items-center text-base">
            <span className="text-xian-gold/90">
              {goldReady ? '✅' : '❌'} 灵石
            </span>
            <span className={goldReady ? 'text-green-400' : 'text-red-400'}>
              {formatNumber(currentGold)} / {formatNumber(info.needGold)}
            </span>
          </div>
        )}

        {/* 成功率 */}
        <div className="flex justify-between items-center text-base">
          <span className="text-xian-gold/90">📊 成功率</span>
          <div className="flex items-center gap-1">
            <span className={info.successRate >= 0.8 ? 'text-green-400' : info.successRate >= 0.5 ? 'text-yellow-400' : 'text-red-400'}>
              {Math.floor(info.successRate * 100)}%
            </span>
            {breakthroughBonus > 0 && (
              <span className="text-purple-400 text-sm">
                +{Math.floor(breakthroughBonus * 100)}%💊
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 突破按钮 */}
      <button
        onClick={onBreakthrough}
        disabled={!info.canDo}
        className={`w-full py-3 rounded-lg font-bold font-kai text-xl transition-all duration-300 ${
          info.canDo
            ? 'bg-gradient-to-r from-xian-gold to-xian-darkgold text-black hover:shadow-lg hover:shadow-xian-gold/30 hover:scale-[1.02] active:scale-95'
            : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
        }`}
      >
        {info.canDo ? '⚡ 尝试突破' : '条件不足'}
      </button>

      {info.isMajor && info.canDo && (
        <div className="text-center text-sm text-yellow-400/80 mt-2">
          ⚠ 失败将损失30%修为
        </div>
      )}
    </div>
  );
}
