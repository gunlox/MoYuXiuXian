import { SECTS } from '../data/sect';

interface Props {
  onSelect: (sectId: string) => void;
}

export default function SectSelectModal({ onSelect }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="max-w-lg w-full mx-4 bg-gradient-to-br from-[#1a1a2e] to-[#0a0a1a] rounded-2xl border border-xian-gold/30 p-6 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🏯</div>
          <h2 className="text-2xl font-bold font-kai text-transparent bg-clip-text bg-gradient-to-r from-xian-gold via-yellow-300 to-xian-gold">
            选择门派
          </h2>
          <p className="text-xian-gold/70 text-base mt-1">道途万千，各有机缘</p>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {SECTS.map(sect => (
            <button
              key={sect.id}
              onClick={() => onSelect(sect.id)}
              className="w-full text-left rounded-xl p-4 border border-xian-gold/20 bg-black/20 hover:border-xian-gold/50 hover:bg-xian-gold/5 transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{sect.emoji}</span>
                <div>
                  <div className={`font-bold font-kai text-lg ${sect.color}`}>{sect.name}</div>
                  <div className="text-sm text-xian-gold/70 italic">「{sect.philosophy}」</div>
                </div>
              </div>
              <div className="text-base text-xian-gold/80 mb-2">{sect.description}</div>
              <div className="flex flex-wrap gap-2 text-xs">
                {sect.bonus.expBonus > 0 && <BonusTag label="修炼速度" value={sect.bonus.expBonus} />}
                {sect.bonus.atkBonus > 0 && <BonusTag label="攻击" value={sect.bonus.atkBonus} />}
                {sect.bonus.defBonus > 0 && <BonusTag label="防御" value={sect.bonus.defBonus} />}
                {sect.bonus.hpBonus > 0 && <BonusTag label="生命" value={sect.bonus.hpBonus} />}
                {sect.bonus.critRateBonus > 0 && <BonusTag label="暴击率" value={sect.bonus.critRateBonus} />}
                {sect.bonus.alchemyBonus > 0 && <BonusTag label="炼丹成功率" value={sect.bonus.alchemyBonus} />}
                {sect.bonus.dropBonus > 0 && <BonusTag label="掉落率" value={sect.bonus.dropBonus} />}
                {sect.bonus.breakthroughBonus != null && sect.bonus.breakthroughBonus > 0 && <BonusTag label="突破成功率" value={sect.bonus.breakthroughBonus} />}
                {sect.id === 'sect_pill' && <PassiveTag label="炼丹30%概率双倍产出" />}
                {sect.id === 'sect_fortune' && <PassiveTag label="秘境每日次数+1" />}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BonusTag({ label, value }: { label: string; value: number }) {
  return (
    <span className="bg-xian-gold/10 border border-xian-gold/20 rounded px-2 py-0.5 text-xian-gold/90">
      {label} +{(value * 100).toFixed(0)}%
    </span>
  );
}

function PassiveTag({ label }: { label: string }) {
  return (
    <span className="bg-purple-500/10 border border-purple-500/20 rounded px-2 py-0.5 text-purple-300/90">
      {label}
    </span>
  );
}
