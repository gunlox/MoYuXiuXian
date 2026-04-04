import { useEffect, useRef } from 'react';
import { GameState, addLog } from '../data/gameState';
import { AREAS, getUnlockedAreas } from '../data/monsters';
import { getRealm } from '../data/realms';
import { BattleLogEntry } from '../engine/battleEngine';
import { formatNumber } from '../engine/gameEngine';

interface Props {
  gameState: GameState;
  onStateChange: (updater: (prev: GameState) => GameState) => void;
  battleUI: {
    logs: BattleLogEntry[];
    currentMonster: string;
    playerHpBar: { current: number; max: number } | null;
  };
  clearBattleLogs: () => void;
}

export default function BattlePanel({ gameState, onStateChange, battleUI, clearBattleLogs }: Props) {
  const logContainerRef = useRef<HTMLDivElement>(null);

  const unlockedAreas = getUnlockedAreas(gameState.realmIndex, gameState.rebirthCount ?? 0);
  const currentArea = AREAS.find(a => a.id === gameState.currentAreaId) || null;

  const { logs: battleLogs, currentMonster, playerHpBar } = battleUI;

  // 滚动到日志底部（仅容器内滚动）
  useEffect(() => {
    const el = logContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [battleLogs.length]);

  // 选择区域
  const selectArea = (areaId: string) => {
    onStateChange(prev => {
      let s: GameState = { ...prev, currentAreaId: areaId, isBattling: false };
      const area = AREAS.find(a => a.id === areaId);
      if (area) {
        s = addLog(s, `📍 进入【${area.name}】`);
      }
      return s;
    });
    clearBattleLogs();
  };

  // 开始/停止战斗
  const toggleBattle = () => {
    onStateChange(prev => {
      if (prev.isBattling) {
        return addLog({ ...prev, isBattling: false }, '⏸️ 停止讨伐');
      } else {
        return addLog({ ...prev, isBattling: true }, '⚔️ 开始挂机讨伐！');
      }
    });
    if (gameState.isBattling) {
      clearBattleLogs();
    }
  };

  // 日志文字颜色
  const getLogColor = (type: BattleLogEntry['type']): string => {
    switch (type) {
      case 'player_attack': return 'text-xian-jade';
      case 'monster_attack': return 'text-red-400';
      case 'victory': return 'text-yellow-400';
      case 'defeat': return 'text-red-500';
      case 'drop': return 'text-purple-400';
      default: return 'text-xian-gold/70';
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-5 border border-xian-gold/30">
      <div className="text-base text-xian-gold/80 font-kai mb-3">⚔️ 讨伐妖兽</div>

      {/* 资源显示 */}
      <div className="flex items-center gap-4 mb-4 text-base">
        <div className="flex items-center gap-1">
          <span>🌿</span>
          <span className="text-green-400 font-bold">{gameState.herbs}</span>
          <span className="text-xian-gold/70">灵草</span>
        </div>
        <div className="flex items-center gap-1">
          <span>💠</span>
          <span className="text-blue-400 font-bold">{gameState.fragments}</span>
          <span className="text-xian-gold/70">碎片</span>
        </div>
        <div className="flex items-center gap-1">
          <span>💀</span>
          <span className="text-red-400 font-bold">{gameState.killCount}</span>
          <span className="text-xian-gold/70">击杀</span>
        </div>
      </div>

      {/* 当前区域信息 + 战斗控制 */}
      {currentArea && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xian-gold font-kai">📍 {currentArea.name}</span>
              {currentMonster && gameState.isBattling && (
                <span className="text-sm text-red-400 ml-2">正在讨伐：{currentMonster}</span>
              )}
            </div>
            <button
              onClick={toggleBattle}
              className={`px-4 py-2 rounded-lg font-bold font-kai text-base transition-all ${
                gameState.isBattling
                  ? 'bg-red-600/80 text-white hover:bg-red-600 border border-red-500/50'
                  : 'bg-gradient-to-r from-xian-gold to-xian-darkgold text-black hover:shadow-lg hover:shadow-xian-gold/20'
              }`}
            >
              {gameState.isBattling ? '⏸ 停止' : '⚔️ 讨伐'}
            </button>
          </div>

          {/* 玩家血条 */}
          {playerHpBar && gameState.isBattling && (
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-xian-gold/80">气血</span>
                <span className="text-green-400">
                  {formatNumber(playerHpBar.current)}/{formatNumber(playerHpBar.max)}
                </span>
              </div>
              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-300"
                  style={{ width: `${(playerHpBar.current / playerHpBar.max) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* 妖兽列表 */}
          {!gameState.isBattling && (
            <div className="mb-3">
              <div className="text-sm text-xian-gold/80 mb-2">出没妖兽</div>
              <div className="space-y-1">
                {currentArea.monsters.map(m => (
                  <div key={m.id} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2 text-sm">
                    <span className="text-red-300 font-bold">{m.name}</span>
                    <div className="flex gap-3 text-xian-gold/80">
                      <span>攻{formatNumber(m.attackMin)}~{formatNumber(m.attackMax)}</span>
                      <span>防{formatNumber(m.defense)}</span>
                      <span>血{formatNumber(m.hpMin)}~{formatNumber(m.hpMax)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 战斗日志 */}
          {battleLogs.length > 0 && (
            <div className="bg-black/30 rounded-lg p-3 border border-white/5">
              <div className="text-sm text-xian-gold/80 mb-2">战斗日志</div>
              <div ref={logContainerRef} className="h-40 overflow-y-auto space-y-0.5 pr-1">
                {battleLogs.map((log, i) => (
                  <div key={i} className={`text-sm ${getLogColor(log.type)}`}>
                    {log.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!currentArea && (
        <div className="text-center text-xian-gold/70 text-base py-4">
          选择一个区域开始讨伐妖兽
        </div>
      )}

      {/* 区域选择 */}
      <div className="mt-4">
        <div className="text-sm text-xian-gold/80 mb-2">选择区域（已解锁 {unlockedAreas.length}/{AREAS.length}）</div>
        <div className="grid grid-cols-2 gap-2">
          {AREAS.map(area => {
            const unlocked = unlockedAreas.includes(area);
            const isSelected = gameState.currentAreaId === area.id;
            return (
              <button
                key={area.id}
                onClick={() => unlocked && selectArea(area.id)}
                disabled={!unlocked}
                className={`text-left p-2 rounded-lg text-sm transition-all border ${
                  isSelected
                    ? 'bg-xian-gold/20 border-xian-gold/50 text-xian-gold'
                    : unlocked
                      ? 'bg-black/20 border-white/5 text-xian-gold/80 hover:border-xian-gold/30 hover:bg-black/30'
                      : 'bg-black/10 border-white/5 text-gray-500 cursor-not-allowed'
                }`}
              >
                <div className="font-bold">{unlocked ? area.name : `🔒 ${area.name}`}</div>
                <div className="text-xs opacity-80 mt-0.5">
                  {unlocked ? area.description : `需要：${getRealm(area.requiredRealmIndex).subLevelName}`}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
