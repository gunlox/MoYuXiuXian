import { useState } from 'react';

interface Props {
  onComplete: () => void;
}

interface TutorialStep {
  title: string;
  emoji: string;
  tab?: string;
  lines: string[];
  tip?: string;
}

const STEPS: TutorialStep[] = [
  {
    title: '欢迎来到修仙世界',
    emoji: '🌟',
    lines: [
      '你是一名踏入修仙之路的凡人。',
      '在这里，你将挂机修炼、讨伐妖兽、炼丹锻体，一步步从练气期修至渡劫飞升。',
      '游戏支持后台运行与离线收益，关掉页面也不会白费修炼。',
    ],
    tip: '先跟着引导了解各个系统，之后随时可以按自己的节奏来玩。',
  },
  {
    title: '选择门派',
    emoji: '🏯',
    lines: [
      '引导结束后需要先选择一个门派，门派一旦选定不可更改。',
      '剑宗 — 攻击+15%、暴击率+5%，战斗输出最强。',
      '丹宗 — 炼丹成功率+15%，适合靠丹药加速修炼。',
      '体修宗 — 防御+12%、生命+12%，战斗最耐打。',
      '灵宗 — 修炼速度+15%，升级最快。',
      '福地宗 — 掉落率+15%，装备功法产出最多。',
      '门派不只是初始加成！拜入后可在"门派"页签接取日常任务和成长任务。',
      '完成任务获得门派贡献 → 贡献累积提升门派等级 → 解锁里程碑被动（攻防/暴击/修炼/炼丹/掉落等永久加成）。',
    ],
    tip: '新手推荐灵宗（修炼快）或福地宗（掉落多），老手可选剑宗或丹宗。门派等级最高5级，每个门派的里程碑被动各有侧重。',
  },
  {
    title: '修炼与突破',
    emoji: '🧘',
    tab: '修炼',
    lines: [
      '游戏自动积累修为和灵石，在"修炼"页可以查看属性与突破进度。',
      '修为满后点击突破按钮，突破有一定概率失败。',
      '大境界突破（如练气→筑基）还需消耗灵石。',
      '境界共30层：练气9层 → 筑基/金丹/元婴/化神各3层 → 渡劫9层。',
    ],
    tip: '突破前可以服用筑基丹/破境丹/渡劫丹来提高成功率。',
  },
  {
    title: '讨伐妖兽',
    emoji: '⚔️',
    tab: '讨伐',
    lines: [
      '在"讨伐"页选择一个区域，点击开始即可自动挂机战斗。',
      '击杀妖兽可获得灵石、灵草、碎片，还有概率掉落装备和功法。',
      '随着境界提升，更高级的区域会逐步解锁。',
      '每个区域的妖兽强度不同，选择适合当前实力的区域效率最高。',
    ],
    tip: '讨伐是获取灵草（炼丹原料）和装备的主要途径，建议一直保持挂机状态。',
  },
  {
    title: '功法修炼',
    emoji: '�',
    tab: '功法',
    lines: [
      '功法可提升修炼速度、攻击、防御、暴击等属性。',
      '功法有白/绿/蓝/紫/橙/红六个品阶，品阶越高加成越强。',
      '功法可消耗灵石升级，升到满级后自动精通，永久获得其50%加成。',
      '精通多本功法的加成可以叠加，是后期提升实力的重要途径。',
    ],
    tip: '白色功法各专精一种属性（修炼/攻击/防御等），高品质功法综合加成更强。',
  },
  {
    title: '装备系统',
    emoji: '🛡️',
    tab: '装备',
    lines: [
      '共有5个装备槽：武器（攻击）、上衣（生命）、裤子（防御）、鞋子（闪避）、饰品（暴击）。',
      '装备有7种品质（白→绿→蓝→紫→橙→红→传说），品质越高词条越多。',
      '装备可消耗灵石和碎片强化，强化提升基础属性，满强化为原始值的2.5倍。',
      '不需要的装备可以分解获取灵石和碎片，也可以勾选品质自动分解。',
    ],
    tip: '装备词条包含攻防血、暴击率/暴击伤害/闪避、修炼速度共7种，注意挑选适合的词条。',
  },
  {
    title: '炼丹之术',
    emoji: '🔥',
    tab: '炼丹',
    lines: [
      '消耗灵草和灵石炼制丹药，丹药覆盖修炼加速、战斗增强、突破加成、体力恢复等。',
      '每个大境界都有对应的新丹药解锁，高品质丹药效果更强但成功率更低。',
      '同种持续丹药重复服用只延长时间不叠加倍率，最多叠加12小时。',
      '低阶丹药在高境界会衰减效果，高出4个大境界以上完全失效。',
    ],
    tip: '体力恢复丹按境界升级：回春丹→活力丹→续灵丹→归元丹→天髓丹，记得及时切换。',
  },
  {
    title: '秘境探索',
    emoji: '🌀',
    tab: '秘境',
    lines: [
      '秘境消耗体力进入，逐层探索可获取灵石、修为、灵草、碎片和丹药奖励。',
      '每个秘境有每日次数限制，不同境界解锁不同秘境，低级秘境自动折叠。',
      '体力上限和恢复速度随境界提升：练气100→渡劫200，恢复速度也翻倍。',
      'Boss胜率由你的境界决定（30%~95%），击败Boss有概率掉落丹药。',
      '全层通关可获得额外奖励宝箱；每日首通后解锁"扫荡"，一键领取奖励且体力打七折。',
    ],
    tip: '优先探索带"推荐"标记的秘境，首通后用扫荡消耗剩余次数更高效。',
  },
  {
    title: '成就与轮回',
    emoji: '🏆',
    tab: '成就 / 轮回',
    lines: [
      '完成各种里程碑（境界、击杀、炼丹、秘境等）可领取成就奖励。',
      '当境界达到渡劫三重及以上时，可以选择轮回转生。',
      '轮回会重置境界、装备、功法和资源，但获得仙缘货币。',
      '仙缘可在轮回商店兑换永久加成：修炼速度、属性、突破率、秘境奖励等13种。',
    ],
    tip: '境界越高轮回获得的仙缘越多。前几次轮回优先买修炼速度和修为传承。',
  },
  {
    title: '准备好了吗？',
    emoji: '✨',
    lines: [
      '大道三千，摸鱼为先。',
      '接下来请选择一个门派，正式开始你的修仙之旅！',
      '别忘了每天去"门派"页签完成日常任务，积攒贡献提升门派等级！',
    ],
    tip: '游戏每10秒自动保存，支持3个存档槽位，可随时切换。关闭页面后再打开会结算离线收益。',
  },
];

export default function TutorialOverlay({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="max-w-md w-full mx-4 bg-gradient-to-br from-[#1a1a2e] to-[#0a0a1a] rounded-2xl border border-xian-gold/30 p-6 shadow-2xl max-h-[90vh] flex flex-col">
        {/* 进度指示 */}
        <div className="flex justify-center gap-1.5 mb-3">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-xian-gold' : i < step ? 'w-3 bg-xian-gold/40' : 'w-3 bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* 步骤计数 */}
        <div className="text-center text-xs text-xian-gold/40 mb-2">
          {step + 1} / {STEPS.length}
        </div>

        {/* 可滚动内容区 */}
        <div className="flex-1 overflow-y-auto min-h-0 mb-4">
          <div className="text-center mb-4">
            <div className="text-5xl mb-2">{current.emoji}</div>
            <h2 className="text-xl font-bold font-kai text-transparent bg-clip-text bg-gradient-to-r from-xian-gold via-yellow-300 to-xian-gold">
              {current.title}
            </h2>
            {current.tab && (
              <div className="mt-1 inline-block px-2 py-0.5 rounded-full bg-xian-gold/10 border border-xian-gold/20 text-xs text-xian-gold/70">
                对应页签：{current.tab}
              </div>
            )}
          </div>

          {/* 正文内容 */}
          <div className="space-y-2 mb-4 text-left px-1">
            {current.lines.map((line, i) => (
              <div key={i} className="flex gap-2 text-sm text-xian-gold/80 leading-relaxed">
                <span className="text-xian-gold/40 mt-0.5 shrink-0">•</span>
                <span>{line}</span>
              </div>
            ))}
          </div>

          {/* 小贴士 */}
          {current.tip && (
            <div className="mx-1 rounded-lg bg-cyan-500/8 border border-cyan-500/20 px-3 py-2">
              <div className="text-xs text-cyan-400/90 leading-relaxed">
                <span className="font-bold">💡 小贴士：</span>{current.tip}
              </div>
            </div>
          )}
        </div>

        {/* 按钮 */}
        <div className="flex gap-2 shrink-0">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="px-5 py-2.5 rounded-xl font-kai bg-gray-700/50 text-xian-gold/80 hover:bg-gray-600/50 transition-all"
            >
              上一步
            </button>
          )}
          <button
            onClick={() => isLast ? onComplete() : setStep(s => s + 1)}
            className="flex-1 py-2.5 rounded-xl font-bold font-kai bg-gradient-to-r from-xian-gold/80 to-yellow-500/80 text-[#0a0a1a] hover:from-xian-gold hover:to-yellow-500 transition-all"
          >
            {isLast ? '选择门派，开始修仙！' : '下一步'}
          </button>
        </div>

        {/* 跳过 */}
        {!isLast && (
          <button
            onClick={onComplete}
            className="w-full mt-3 text-sm text-xian-gold/50 hover:text-xian-gold/70 transition-all"
          >
            跳过教程
          </button>
        )}
      </div>
    </div>
  );
}
