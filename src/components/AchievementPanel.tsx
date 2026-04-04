import { GameState } from '../data/gameState';
import { ACHIEVEMENTS, checkAchievement, Achievement } from '../data/achievements';
import { getSect } from '../data/sect';
import { formatNumber } from '../engine/gameEngine';

interface Props {
  gameState: GameState;
  onStateChange: (updater: (prev: GameState) => GameState) => void;
}

export default function AchievementPanel({ gameState, onStateChange }: Props) {
  const sect = gameState.sectId ? getSect(gameState.sectId) : null;
  const stats = gameState.stats;
  const achievementItems = ACHIEVEMENTS
    .map((ach, index) => {
      const unlocked = gameState.unlockedAchievements.includes(ach.id);
      const canClaim = !unlocked && checkAchievement(
        ach, gameState.realmIndex, gameState.killCount,
        gameState.breakthroughCount, gameState.totalPlayTime,
        gameState.stats
      );
      const sortGroup = canClaim ? 0 : unlocked ? 2 : 1;
      return { ach, unlocked, canClaim, sortGroup, index };
    })
    .sort((a, b) => {
      if (a.sortGroup !== b.sortGroup) return a.sortGroup - b.sortGroup;
      return a.index - b.index;
    });

  // 领取成就奖励
  const claimAchievement = (ach: Achievement) => {
    onStateChange(prev => {
      if (prev.unlockedAchievements.includes(ach.id)) return prev;
      const r = ach.reward;
      let s = { ...prev, unlockedAchievements: [...prev.unlockedAchievements, ach.id] };
      switch (r.type) {
        case 'gold': s = { ...s, gold: s.gold + r.amount }; break;
        case 'herb': s = { ...s, herbs: s.herbs + r.amount }; break;
        case 'fragment': s = { ...s, fragments: s.fragments + r.amount }; break;
        case 'exp': s = { ...s, exp: s.exp + r.amount }; break;
      }
      const logs = [...s.logs, `🏆 达成成就【${ach.name}】！获得奖励`];
      return { ...s, logs };
    });
  };

  // 格式化时间
  const fmtTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}时${m}分`;
    return `${m}分`;
  };

  return (
    <div className="space-y-4">
      {/* 门派信息 */}
      {sect && (
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-4 border border-xian-gold/30">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{sect.emoji}</span>
            <div>
              <div className={`font-bold font-kai text-lg ${sect.color}`}>{sect.name}</div>
              <div className="text-sm text-xian-gold/70 italic">「{sect.philosophy}」</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {sect.bonus.expBonus > 0 && <span className="bg-purple-500/10 border border-purple-500/20 rounded px-2 py-0.5 text-purple-400">修炼+{(sect.bonus.expBonus * 100).toFixed(0)}%</span>}
            {sect.bonus.atkBonus > 0 && <span className="bg-red-500/10 border border-red-500/20 rounded px-2 py-0.5 text-red-400">攻击+{(sect.bonus.atkBonus * 100).toFixed(0)}%</span>}
            {sect.bonus.defBonus > 0 && <span className="bg-blue-500/10 border border-blue-500/20 rounded px-2 py-0.5 text-blue-400">防御+{(sect.bonus.defBonus * 100).toFixed(0)}%</span>}
            {sect.bonus.hpBonus > 0 && <span className="bg-green-500/10 border border-green-500/20 rounded px-2 py-0.5 text-green-400">生命+{(sect.bonus.hpBonus * 100).toFixed(0)}%</span>}
            {sect.bonus.critRateBonus > 0 && <span className="bg-yellow-500/10 border border-yellow-500/20 rounded px-2 py-0.5 text-yellow-400">暴击率+{(sect.bonus.critRateBonus * 100).toFixed(1)}%</span>}
            {sect.bonus.alchemyBonus > 0 && <span className="bg-orange-500/10 border border-orange-500/20 rounded px-2 py-0.5 text-orange-400">炼丹+{(sect.bonus.alchemyBonus * 100).toFixed(0)}%</span>}
            {sect.bonus.dropBonus > 0 && <span className="bg-yellow-500/10 border border-yellow-500/20 rounded px-2 py-0.5 text-yellow-400">掉落+{(sect.bonus.dropBonus * 100).toFixed(0)}%</span>}
          </div>
        </div>
      )}

      {/* 统计面板 */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-4 border border-xian-gold/30">
        <div className="text-base text-xian-gold/80 font-kai mb-3">📊 修仙统计</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <StatRow label="累计修炼" value={fmtTime(gameState.totalPlayTime)} />
          <StatRow label="击杀妖兽" value={`${gameState.killCount}只`} />
          <StatRow label="突破成功" value={`${gameState.breakthroughCount}次`} />
          <StatRow label="突破失败" value={`${gameState.breakthroughFailCount}次`} />
          <StatRow label="炼丹成功" value={`${stats?.alchemySuccessCount ?? 0}次`} />
          <StatRow label="炼丹失败" value={`${stats?.alchemyFailCount ?? 0}次`} />
          <StatRow label="秘境通关" value={`${stats?.dungeonClearCount ?? 0}次`} />
          <StatRow label="秘境进入" value={`${stats?.dungeonEnterCount ?? 0}次`} />
          <StatRow label="累计灵石" value={formatNumber(stats?.totalGoldEarned ?? 0)} />
          <StatRow label="累计灵草" value={`${stats?.totalHerbsEarned ?? 0}`} />
        </div>
      </div>

      {/* 成就列表 */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-4 border border-xian-gold/30">
        <div className="flex items-center justify-between mb-3">
          <div className="text-base text-xian-gold/80 font-kai">🏆 成就</div>
          <div className="text-sm text-xian-gold/70">
            {gameState.unlockedAchievements.length}/{ACHIEVEMENTS.length}
          </div>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {achievementItems.map(({ ach, unlocked, canClaim }) => {

            return (
              <div
                key={ach.id}
                className={`rounded-lg p-3 border transition-all ${
                  unlocked
                    ? 'border-yellow-500/30 bg-yellow-500/5'
                    : canClaim
                      ? 'border-green-500/40 bg-green-500/5 shadow-sm shadow-green-500/10'
                      : 'border-white/5 bg-black/10 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{ach.emoji}</span>
                    <div>
                      <div className={`text-base font-bold ${unlocked ? 'text-yellow-400' : canClaim ? 'text-green-400' : 'text-xian-gold/60'}`}>
                        {ach.name}
                      </div>
                      <div className="text-sm text-xian-gold/70">{ach.description}</div>
                    </div>
                  </div>
                  {unlocked && (
                    <span className="text-sm text-yellow-400/80">✅ 已达成</span>
                  )}
                  {canClaim && (
                    <button
                      onClick={() => claimAchievement(ach)}
                      className="px-3 py-1 text-sm rounded bg-green-600/40 border border-green-500/40 text-green-300 hover:bg-green-600/60 transition-all animate-pulse"
                    >
                      领取
                    </button>
                  )}
                </div>
                {(canClaim || unlocked) && (
                  <div className="text-xs text-xian-gold/60 mt-1">
                    奖励：{describeReward(ach)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center bg-black/20 rounded-lg px-3 py-2">
      <span className="text-xian-gold/70">{label}</span>
      <span className="text-xian-gold font-bold">{value}</span>
    </div>
  );
}

function describeReward(ach: Achievement): string {
  const r = ach.reward;
  switch (r.type) {
    case 'gold': return `${r.amount}灵石`;
    case 'herb': return `${r.amount}灵草`;
    case 'fragment': return `${r.amount}装备碎片`;
    case 'exp': return `${r.amount}修为`;
  }
}
