import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, saveGameToSlot, SlotIndex, addLog } from '../data/gameState';
import {
  TICK_INTERVAL,
  advanceGameTime,
  BATTLE_INTERVAL,
  calcOfflineGains,
  applyElapsedOfflineProgress,
  attemptBreakthrough,
  canBreakthrough,
  getBreakthroughInfo,
  runOneAutoBattle,
} from '../engine/gameEngine';
import { BattleLogEntry } from '../engine/battleEngine';

/** 自动保存间隔(ms) */
const AUTO_SAVE_INTERVAL = 10000;
const BATTLE_LOG_STEP_INTERVAL = 220;

interface QueuedBattleLogEntry extends BattleLogEntry {
  monsterName: string;
}

/** 战斗UI状态（不存入存档） */
export interface BattleUIState {
  logs: BattleLogEntry[];
  currentMonster: string;
  playerHpBar: { current: number; max: number } | null;
}

interface UseGameLoopOptions {
  initialState: GameState;
  slotIndex: SlotIndex;
  offlineGains: ReturnType<typeof calcOfflineGains> | null;
}

export function useGameLoop({ initialState, slotIndex, offlineGains: initOfflineGains }: UseGameLoopOptions) {
  const [gameState, setGameState] = useState<GameState>(initialState);

  const [breakthroughResult, setBreakthroughResult] = useState<'success' | 'fail' | null>(null);

  const [showOfflineModal, setShowOfflineModal] = useState((initOfflineGains?.seconds ?? 0) >= 60);

  // 战斗UI状态（独立于存档的纯展示数据）
  const [battleUI, setBattleUI] = useState<BattleUIState>({
    logs: [], currentMonster: '', playerHpBar: null,
  });

  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  const lastTickRef = useRef(Date.now());
  const pendingBattleLogsRef = useRef<QueuedBattleLogEntry[]>([]);
  const battleLogTimerRef = useRef<number | null>(null);
  // 记录页面隐藏时间
  const hiddenTimeRef = useRef<number | null>(null);

  const stopBattleLogPlayback = useCallback(() => {
    if (battleLogTimerRef.current !== null) {
      window.clearTimeout(battleLogTimerRef.current);
      battleLogTimerRef.current = null;
    }
  }, []);

  const playNextBattleLog = useCallback(() => {
    const nextLog = pendingBattleLogsRef.current.shift();
    if (!nextLog) {
      battleLogTimerRef.current = null;
      return;
    }

    setBattleUI(prev => {
      const newLogs = [...prev.logs, nextLog];
      return {
        logs: newLogs.length > 100 ? newLogs.slice(-100) : newLogs,
        currentMonster: nextLog.monsterName,
        playerHpBar: nextLog.playerHpBar ?? prev.playerHpBar,
      };
    });

    if (pendingBattleLogsRef.current.length <= 0) {
      battleLogTimerRef.current = null;
      return;
    }

    battleLogTimerRef.current = window.setTimeout(playNextBattleLog, BATTLE_LOG_STEP_INTERVAL);
  }, []);

  const enqueueBattleLogs = useCallback((logs: BattleLogEntry[], monsterName: string) => {
    if (logs.length <= 0) return;
    pendingBattleLogsRef.current.push(...logs.map(log => ({ ...log, monsterName })));
    if (battleLogTimerRef.current === null) {
      playNextBattleLog();
    }
  }, [playNextBattleLog]);

  // 游戏主循环
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.hidden) return;
      const now = Date.now();
      const elapsedSeconds = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      if (elapsedSeconds <= 0) return;
      setGameState(prev => advanceGameTime(prev, elapsedSeconds));
    }, TICK_INTERVAL);

    return () => clearInterval(timer);
  }, []);

  // 页面可见性监听 - 后台运行补偿
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const now = Date.now();
        const elapsedVisibleSeconds = (now - lastTickRef.current) / 1000;
        lastTickRef.current = now;
        if (elapsedVisibleSeconds > 0) {
          setGameState(prev => advanceGameTime(prev, elapsedVisibleSeconds));
        }
        hiddenTimeRef.current = now;
      } else {
        const now = Date.now();
        lastTickRef.current = now;
        if (hiddenTimeRef.current) {
          const hiddenDuration = now - hiddenTimeRef.current;
          const secondsHidden = hiddenDuration / 1000;

          if (secondsHidden >= 1) {
            setGameState(prev => applyElapsedOfflineProgress(prev, secondsHidden, now));
          }
          hiddenTimeRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // ===== 后台战斗循环 =====
  useEffect(() => {
    const state = stateRef.current;
    if (!state.isBattling || !state.currentAreaId || state.sectId === null) return;

    const doOneBattle = () => {
      if (document.hidden) return;
      setGameState(prev => {
        if (!prev.isBattling || !prev.currentAreaId) return prev;

        const battle = runOneAutoBattle(prev, { captureLogs: true });
        if (!battle.result) return prev;

        // 更新战斗UI状态
        const allLogs = [...battle.result.logs, ...battle.extraLogs];
        enqueueBattleLogs(allLogs, battle.monsterName);

        return battle.state;
      });
    };

    // 立即打一次
    doOneBattle();

    const timer = window.setInterval(doOneBattle, BATTLE_INTERVAL);

    return () => clearInterval(timer);
  }, [enqueueBattleLogs, gameState.isBattling, gameState.currentAreaId]);

  // 自动保存到对应槽位
  useEffect(() => {
    const timer = setInterval(() => {
      saveGameToSlot(stateRef.current, slotIndex);
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(timer);
  }, [slotIndex]);

  // 页面关闭前保存
  useEffect(() => {
    const handler = () => saveGameToSlot(stateRef.current, slotIndex);
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [slotIndex]);

  // 突破
  const doBreakthrough = useCallback(() => {
    setGameState(prev => {
      if (!canBreakthrough(prev)) return prev;
      const { newState, success } = attemptBreakthrough(prev);
      setBreakthroughResult(success ? 'success' : 'fail');
      setTimeout(() => setBreakthroughResult(null), 1500);
      return newState;
    });
  }, []);

  // 获取突破信息
  const breakthroughInfo = getBreakthroughInfo(gameState);

  // 手动保存
  const doSave = useCallback(() => {
    saveGameToSlot(stateRef.current, slotIndex);
    setGameState(prev => addLog(prev, '💾 存档成功'));
  }, [slotIndex]);

  // 关闭离线弹窗
  const dismissOfflineModal = useCallback(() => {
    setShowOfflineModal(false);
  }, []);

  // 清空战斗日志（切换区域/停止战斗时调用）
  const clearBattleLogs = useCallback(() => {
    pendingBattleLogsRef.current = [];
    stopBattleLogPlayback();
    setBattleUI({ logs: [], currentMonster: '', playerHpBar: null });
  }, [stopBattleLogPlayback]);

  useEffect(() => () => stopBattleLogPlayback(), [stopBattleLogPlayback]);

  return {
    gameState,
    setGameState,
    breakthroughInfo,
    breakthroughResult,
    doBreakthrough,
    doSave,
    showOfflineModal,
    dismissOfflineModal,
    offlineGains: initOfflineGains,
    battleUI,
    clearBattleLogs,
  };
}
