import { GameState } from '../data/gameState';
import { formatNumber } from '../engine/gameEngine';

interface Props {
  gameState: GameState;
}

export default function ResourceBar({ gameState }: Props) {
  return (
    <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] rounded-xl p-4 border border-xian-gold/30">
      <div className="flex items-center justify-around">
        {/* 灵石 */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">💎</span>
          <div>
            <div className="text-sm text-xian-gold/80">灵石</div>
            <div className="text-xl font-bold text-yellow-400">{formatNumber(gameState.gold)}</div>
          </div>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-10 bg-xian-gold/20" />

        {/* 修炼时长 */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">⏳</span>
          <div>
            <div className="text-sm text-xian-gold/80">修炼时长</div>
            <div className="text-xl font-bold text-xian-jade">
              {formatPlayTime(gameState.totalPlayTime)}
            </div>
          </div>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-10 bg-xian-gold/20" />

        {/* 突破次数 */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <div>
            <div className="text-sm text-xian-gold/80">突破次数</div>
            <div className="text-xl font-bold text-purple-400">
              {gameState.breakthroughCount}
              {gameState.breakthroughFailCount > 0 && (
                <span className="text-sm text-red-400/80 ml-1">
                  (败{gameState.breakthroughFailCount})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatPlayTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}时${m}分`;
  if (m > 0) return `${m}分`;
  return `${Math.floor(seconds)}秒`;
}
