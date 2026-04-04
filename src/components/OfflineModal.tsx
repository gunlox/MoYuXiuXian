import { formatNumber } from '../engine/gameEngine';

interface Props {
  offlineGains: {
    exp: number;
    gold: number;
    seconds: number;
    staminaRecovered: number;
    herbs: number;
    fragments: number;
    artifactCount: number;
    techniqueCount: number;
    autoSalvageFragments: number;
  };
  onDismiss: () => void;
}

export default function OfflineModal({ offlineGains, onDismiss }: Props) {
  const hours = Math.floor(offlineGains.seconds / 3600);
  const mins = Math.floor((offlineGains.seconds % 3600) / 60);
  const timeStr = hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0f3460] rounded-2xl p-8 border border-xian-gold/40 max-w-sm w-full mx-4 shadow-2xl">
        <div className="text-center">
          <div className="text-4xl mb-3">🌙</div>
          <div className="text-xl font-bold text-xian-gold font-kai mb-2">
            欢迎回来，道友
          </div>
          <div className="text-base text-xian-gold/80 mb-6">
            你已闭关修炼 {timeStr}
          </div>

          <div className="space-y-3 mb-6">
            <div className="bg-black/30 rounded-lg p-3 flex justify-between items-center">
              <span className="text-xian-gold/90">获得修为</span>
              <span className="text-xian-jade font-bold">+{formatNumber(offlineGains.exp)}</span>
            </div>
            <div className="bg-black/30 rounded-lg p-3 flex justify-between items-center">
              <span className="text-xian-gold/90">获得灵石</span>
              <span className="text-yellow-400 font-bold">+{formatNumber(offlineGains.gold)}</span>
            </div>
            {offlineGains.staminaRecovered > 0 && (
              <div className="bg-black/30 rounded-lg p-3 flex justify-between items-center">
                <span className="text-xian-gold/90">恢复体力</span>
                <span className="text-green-300 font-bold">+{formatNumber(offlineGains.staminaRecovered)}</span>
              </div>
            )}
            {offlineGains.herbs > 0 && (
              <div className="bg-black/30 rounded-lg p-3 flex justify-between items-center">
                <span className="text-xian-gold/90">获得灵草</span>
                <span className="text-green-400 font-bold">+{offlineGains.herbs}</span>
              </div>
            )}
            {offlineGains.fragments > 0 && (
              <div className="bg-black/30 rounded-lg p-3 flex justify-between items-center">
                <span className="text-xian-gold/90">获得碎片{offlineGains.autoSalvageFragments > 0 ? '（含自动分解）' : ''}</span>
                <span className="text-cyan-300 font-bold">+{offlineGains.fragments}</span>
              </div>
            )}
            {offlineGains.autoSalvageFragments > 0 && (
              <div className="bg-black/30 rounded-lg p-3 flex justify-between items-center">
                <span className="text-xian-gold/90">自动分解获得碎片</span>
                <span className="text-cyan-200 font-bold">+{offlineGains.autoSalvageFragments}</span>
              </div>
            )}
            {offlineGains.artifactCount > 0 && (
              <div className="bg-black/30 rounded-lg p-3 flex justify-between items-center">
                <span className="text-xian-gold/90">获得装备</span>
                <span className="text-purple-300 font-bold">+{offlineGains.artifactCount}件</span>
              </div>
            )}
            {offlineGains.techniqueCount > 0 && (
              <div className="bg-black/30 rounded-lg p-3 flex justify-between items-center">
                <span className="text-xian-gold/90">获得功法</span>
                <span className="text-pink-300 font-bold">+{offlineGains.techniqueCount}本</span>
              </div>
            )}
          </div>

          <div className="text-sm text-xian-gold/60 mb-4">
            离线收益为在线的80%
          </div>

          <button
            onClick={onDismiss}
            className="w-full py-3 bg-gradient-to-r from-xian-gold to-xian-darkgold text-black font-bold font-kai rounded-lg hover:shadow-lg hover:shadow-xian-gold/30 transition-all active:scale-95"
          >
            继续修炼
          </button>
        </div>
      </div>
    </div>
  );
}
