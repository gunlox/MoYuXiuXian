import { GameState } from '../data/gameState';
import { getSect, SectId } from '../data/sect';
import { getSectTaskById, getSectGrowthTasks, SectTaskDefinition } from '../data/sectTasks';
import { SECT_LEVEL_REQUIREMENTS } from '../data/sectPassives';
import {
  claimSectTaskReward,
  getActiveSectPassives,
  getSectTaskProgressValue,
  isSectTaskClaimed,
  isSectTaskCompleted,
} from '../engine/sectEngine';

interface Props {
  gameState: GameState;
  onStateChange: (updater: (prev: GameState) => GameState) => void;
}

export default function SectPanel({ gameState, onStateChange }: Props) {
  if (!gameState.sectId) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-5 border border-xian-gold/30 text-center text-xian-gold/70">
        尚未加入门派。
      </div>
    );
  }

  const sectId = gameState.sectId as SectId;
  const sect = getSect(sectId);
  const activePassives = getActiveSectPassives(gameState);
  const dailyTasks = gameState.sectDailyTasks
    .map(taskId => getSectTaskById(taskId))
    .filter((task): task is NonNullable<typeof task> => !!task);
  const growthTasks = getSectGrowthTasks(sectId);
  const currentRequirement = SECT_LEVEL_REQUIREMENTS[Math.max(0, gameState.sectLevel - 1)] ?? 0;
  const nextRequirement = SECT_LEVEL_REQUIREMENTS[gameState.sectLevel] ?? currentRequirement;
  const progressPercent = nextRequirement > currentRequirement
    ? Math.min(100, Math.floor(((gameState.sectContribution - currentRequirement) / (nextRequirement - currentRequirement)) * 100))
    : 100;

  const handleClaim = (taskId: string) => {
    onStateChange(prev => claimSectTaskReward(prev, taskId));
  };

  return (
    <div className="space-y-4">
      {sect && (
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-4 border border-xian-gold/30">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{sect.emoji}</span>
            <div>
              <div className={`font-bold font-kai text-lg ${sect.color}`}>{sect.name}</div>
              <div className="text-sm text-xian-gold/70 italic">「{sect.philosophy}」</div>
            </div>
          </div>
          <div className="text-sm text-xian-gold/80">{sect.description}</div>
        </div>
      )}

      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-4 border border-xian-gold/30">
        <div className="flex items-center justify-between mb-2">
          <div className="text-base text-xian-gold/80 font-kai">🏯 门派进度</div>
          <div className="text-sm text-xian-gold/70">等级 {gameState.sectLevel}/5</div>
        </div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-xian-gold/70">当前贡献</span>
          <span className="text-xian-gold font-bold">{gameState.sectContribution}</span>
        </div>
        <div className="bg-black/30 rounded-full h-3 overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="text-xs text-xian-gold/60 text-right">
          {nextRequirement > currentRequirement
            ? `距离下一级还需 ${Math.max(0, nextRequirement - gameState.sectContribution)} 贡献`
            : '已达到当前版本等级上限'}
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-4 border border-xian-gold/30">
        <div className="text-base text-xian-gold/80 font-kai mb-3">✨ 已解锁被动</div>
        <div className="space-y-2">
          {activePassives.length > 0 ? activePassives.map(passive => (
            <div key={passive.id} className="rounded-lg p-3 border border-green-500/20 bg-green-500/5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-green-300 font-bold">{passive.name}</div>
                <div className="text-xs text-green-400/80">Lv.{passive.unlockLevel}</div>
              </div>
              <div className="text-sm text-xian-gold/70 mt-1">{passive.description}</div>
            </div>
          )) : (
            <div className="text-sm text-xian-gold/60">当前尚未解锁门派里程碑被动。</div>
          )}
        </div>
      </div>

      <TaskSection
        title="📜 今日门派任务"
        tasks={dailyTasks}
        gameState={gameState}
        onClaim={handleClaim}
      />

      <TaskSection
        title="🌟 门派成长任务"
        tasks={growthTasks}
        gameState={gameState}
        onClaim={handleClaim}
      />
    </div>
  );
}

function TaskSection({
  title,
  tasks,
  gameState,
  onClaim,
}: {
  title: string;
  tasks: SectTaskDefinition[];
  gameState: GameState;
  onClaim: (taskId: string) => void;
}) {
  return (
    <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-4 border border-xian-gold/30">
      <div className="text-base text-xian-gold/80 font-kai mb-3">{title}</div>
      <div className="space-y-2">
        {tasks.length > 0 ? tasks.map(task => {
          const progress = getSectTaskProgressValue(gameState, task);
          const completed = isSectTaskCompleted(gameState, task);
          const claimed = isSectTaskClaimed(gameState, task);
          const percent = Math.min(100, Math.floor((progress / task.target) * 100));
          return (
            <div
              key={task.id}
              className={`rounded-lg p-3 border ${claimed ? 'border-yellow-500/20 bg-yellow-500/5' : completed ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-black/10'}`}
            >
              <div className="flex items-center justify-between gap-3 mb-1">
                <div>
                  <div className={`font-bold ${claimed ? 'text-yellow-400' : completed ? 'text-green-400' : 'text-xian-gold/90'}`}>{task.name}</div>
                  <div className="text-sm text-xian-gold/70">{task.description}</div>
                </div>
                {claimed ? (
                  <span className="text-sm text-yellow-400/80">已领取</span>
                ) : completed ? (
                  <button
                    onClick={() => onClaim(task.id)}
                    className="px-3 py-1 text-sm rounded bg-green-600/40 border border-green-500/40 text-green-300 hover:bg-green-600/60 transition-all"
                  >
                    领取
                  </button>
                ) : (
                  <span className="text-sm text-xian-gold/50">进行中</span>
                )}
              </div>
              <div className="bg-black/30 rounded-full h-2 overflow-hidden mb-1">
                <div
                  className={`h-full transition-all duration-300 ${claimed ? 'bg-yellow-400' : completed ? 'bg-green-400' : 'bg-cyan-400'}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-xian-gold/60">
                <span>{Math.min(progress, task.target)} / {task.target}</span>
                <span>奖励：{task.rewardContribution} 门派贡献</span>
              </div>
            </div>
          );
        }) : (
          <div className="text-sm text-xian-gold/60">暂无任务。</div>
        )}
      </div>
    </div>
  );
}
