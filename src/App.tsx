import { useState, useEffect, useCallback } from 'react';
import { useSingleInstance } from './hooks/useSingleInstance';
import { useGameLoop } from './hooks/useGameLoop';
import RealmInfo from './components/RealmInfo';
import ResourceBar from './components/ResourceBar';
import BreakthroughPanel from './components/BreakthroughPanel';
import AttributePanel from './components/AttributePanel';
import BattlePanel from './components/BattlePanel';
import EquipmentPanel from './components/EquipmentPanel';
import TechniquePanel from './components/TechniquePanel';
import AlchemyPanel from './components/AlchemyPanel';
import DungeonPanel from './components/DungeonPanel';
import AchievementPanel from './components/AchievementPanel';
import RebirthPanel from './components/RebirthPanel';
import SectSelectModal from './components/SectSelectModal';
import TutorialOverlay from './components/TutorialOverlay';
import DisclaimerModal from './components/DisclaimerModal';
import GoldShop from './components/GoldShop';
import SaveManager from './components/SaveManager';
import SaveSlotModal from './components/SaveSlotModal';
import GameLog from './components/GameLog';
import OfflineModal from './components/OfflineModal';
import { FloatingTextLayer, useFloatingText } from './components/FloatingText';
import { sfxBreakthroughSuccess, sfxBreakthroughFail, sfxClick, isMuted, setMuted } from './engine/audioEngine';
import { GameState, SlotIndex, addLog, migrateLegacySave } from './data/gameState';
import { calcOfflineGains, applyOfflineGains } from './engine/gameEngine';
import { getTechTemplate, TECHNIQUE_TEMPLATES } from './data/equipment';
import { getSect } from './data/sect';

const APP_VERSION = `v${__APP_VERSION__}`;

type Tab = 'cultivate' | 'battle' | 'technique' | 'equip' | 'alchemy' | 'dungeon' | 'achieve' | 'rebirth';

// ===== 游戏主体（选档后渲染）=====
interface GameAppProps {
  initialState: GameState;
  slotIndex: SlotIndex;
  isNewGame: boolean;
}

function GameApp({ initialState, slotIndex, isNewGame }: GameAppProps) {
  // 离线收益只在首次挂载时计算一次，避免每次渲染重新调用随机掉落导致数值跳动
  const [{ offlineGainsOnLoad, adjustedInitial }] = useState(() => {
    if (isNewGame) {
      return { offlineGainsOnLoad: null, adjustedInitial: initialState };
    }
    const gains = calcOfflineGains(initialState);
    const validGains = gains.seconds >= 1 ? gains : null;
    const adjusted = validGains ? applyOfflineGains(initialState) : initialState;
    return { offlineGainsOnLoad: validGains, adjustedInitial: adjusted };
  });

  const blocked = useSingleInstance();

  const {
    gameState,
    setGameState,
    breakthroughInfo,
    breakthroughResult,
    doBreakthrough,
    doSave,
    showOfflineModal,
    dismissOfflineModal,
    offlineGains,
    battleUI,
    clearBattleLogs,
  } = useGameLoop({ initialState: adjustedInitial, slotIndex, offlineGains: offlineGainsOnLoad });

  const [activeTab, setActiveTab] = useState<Tab>('cultivate');
  const [muted, setMutedState] = useState(isMuted());
  const { items: floatItems, addFloat } = useFloatingText();
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const [showTutorial, setShowTutorial] = useState(() => isNewGame || !localStorage.getItem('moyu_tutorial_done'));
  const [showSaveManager, setShowSaveManager] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [showTabTitleModal, setShowTabTitleModal] = useState(false);
  const [tempTabTitle, setTempTabTitle] = useState('');
  const [showDevTools, setShowDevTools] = useState(false);
  const isDev = import.meta.env.DEV;

  const toggleMute = useCallback(() => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
  }, [muted]);

  // 突破音效 + 飘字 + 粒子
  useEffect(() => {
    if (breakthroughResult === 'success') {
      sfxBreakthroughSuccess();
      addFloat('✨ 突破成功！', 'text-yellow-300');
      // 生成粒子
      const ps = Array.from({ length: 20 }, (_, i) => ({
        id: Date.now() + i,
        x: 50 + (Math.random() - 0.5) * 30,
        y: 40 + (Math.random() - 0.5) * 20,
        color: ['#ffd700', '#ffed4a', '#f6e05e', '#ecc94b'][Math.floor(Math.random() * 4)],
      }));
      setParticles(ps);
      setTimeout(() => setParticles([]), 1000);
    } else if (breakthroughResult === 'fail') {
      sfxBreakthroughFail();
      addFloat('突破失败！', 'text-red-500');
    }
  }, [breakthroughResult, addFloat]);

  const handleTabChange = (tab: Tab) => {
    sfxClick();
    setActiveTab(tab);
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    localStorage.setItem('moyu_tutorial_done', '1');
  };

  const handleLoadSave = (state: GameState) => {
    setGameState(state);
  };

  const handleOpenTabTitleModal = () => {
    setTempTabTitle(gameState.customTabTitle);
    setShowTabTitleModal(true);
  };

  const handleSaveTabTitle = () => {
    const title = tempTabTitle.trim() || '摸鱼修仙';
    setGameState(prev => ({ ...prev, customTabTitle: title }));
    document.title = title;
    setShowTabTitleModal(false);
    sfxClick();
  };

  const addTestPills = () => {
    setGameState(prev => {
      const existIdx = prev.pills.findIndex(p => p.recipeId === 'pill_w1');
      const pills = existIdx >= 0
        ? prev.pills.map((p, i) => i === existIdx ? { ...p, count: p.count + 100 } : p)
        : [...prev.pills, { recipeId: 'pill_w1', count: 100 }];
      return addLog({ ...prev, pills }, '🧪 开发者工具：添加了100个聚灵丹');
    });
    setShowDevTools(false);
  };

  const addTestResources = () => {
    setGameState(prev => {
      const existIdx = prev.pills.findIndex(p => p.recipeId === 'pill_w1');
      const pills = existIdx >= 0
        ? prev.pills.map((p, i) => i === existIdx ? { ...p, count: p.count + 100 } : p)
        : [...prev.pills, { recipeId: 'pill_w1', count: 100 }];
      return addLog({
        ...prev,
        pills,
        herbs: prev.herbs + 1000,
        gold: prev.gold + 100000,
        fragments: prev.fragments + 500,
      }, '🧪 开发者工具：添加了测试资源（100聚灵丹+1000灵草+10万灵石+500碎片）');
    });
    setShowDevTools(false);
  };

  const addAllTechniques = () => {
    setGameState(prev => {
      const equippedId = prev.equippedTechnique?.templateId;
      const bagIds = new Set(prev.techniqueBag.map(t => t.templateId));
      const toAdd = TECHNIQUE_TEMPLATES.filter(
        t => t.id !== equippedId && !bagIds.has(t.id)
      ).map(t => ({ templateId: t.id, level: 1 }));
      if (toAdd.length === 0) return addLog(prev, '🧪 [开发工具] 所有功法已在背包中');
      let s: GameState = { ...prev, techniqueBag: [...prev.techniqueBag, ...toAdd] };
      s = addLog(s, `🧪 [开发工具] 已添加 ${toAdd.length} 本功法到背包`);
      return s;
    });
    setShowDevTools(false);
  };

  const addTestTechniqueMastery = () => {
    setGameState(prev => {
      if (!prev.equippedTechnique) return addLog(prev, '请先装备一本功法再测试');
      const tmpl = getTechTemplate(prev.equippedTechnique.templateId);
      if (!tmpl) return prev;
      const maxedTech = { ...prev.equippedTechnique, level: tmpl.maxLevel };
      const already = (prev.masteredTechniques ?? []).includes(tmpl.id);
      let s: GameState = { ...prev, equippedTechnique: maxedTech };
      if (!already) {
        s = { ...s, masteredTechniques: [...(s.masteredTechniques ?? []), tmpl.id] };
        s = addLog(s, `✨ [开发工具] 功法【${tmpl.name}】已精通！永久获得其加成效果（50%强度）`);
      } else {
        s = addLog(s, `✨ [开发工具] 功法【${tmpl.name}】已设为满级`);
      }
      return s;
    });
    setShowDevTools(false);
  };

  // 门派选择
  const handleSectSelect = (sectId: string) => {
    const sect = getSect(sectId);
    setGameState(prev => {
      let s: GameState = { ...prev, sectId };
      s = addLog(s, `🏥 拜入【${sect?.name ?? sectId}】，开启修仙之旅！`);
      // 赠送门派初始功法
      if (sect?.initialTechniqueId) {
        const tmpl = getTechTemplate(sect.initialTechniqueId);
        if (tmpl) {
          const initialTech = { templateId: tmpl.id, level: 1 };
          if (!s.equippedTechnique) {
            s = { ...s, equippedTechnique: initialTech };
            s = addLog(s, `📖 获得门派入门功法【${tmpl.name}】并已装备！`);
          } else {
            s = { ...s, techniqueBag: [...s.techniqueBag, initialTech] };
            s = addLog(s, `📖 获得门派入门功法【${tmpl.name}】！`);
          }
        }
      }
      return s;
    });
  };

  // 动态更新浏览器标签页标题
  useEffect(() => {
    document.title = gameState.customTabTitle;
  }, [gameState.customTabTitle]);

  // 单实例检测 - 阻止重复窗口
  if (blocked) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="max-w-sm mx-4 text-center p-8 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-xian-gold/30">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold font-kai text-xian-gold mb-3">游戏已在其他窗口运行</h1>
          <p className="text-sm text-xian-gold/60 mb-4">为防止存档冲突，同一时间只允许运行一个游戏实例。</p>
          <p className="text-xs text-xian-gold/40">请关闭其他窗口中的游戏，此页面将自动接管。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 text-9xl font-kai text-xian-gold select-none">仙</div>
        <div className="absolute bottom-10 right-10 text-9xl font-kai text-xian-gold select-none">道</div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[12rem] font-kai text-xian-gold select-none">修</div>
      </div>
      {/* 环境光晕 */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-halo" />
      <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-yellow-500/5 rounded-full blur-3xl animate-halo" style={{ animationDelay: '1.5s' }} />

      {/* 主内容 */}
      <div className="relative z-10 max-w-lg md:max-w-xl mx-auto px-3 sm:px-4 py-4 sm:py-6 min-h-screen flex flex-col">
        {/* 标题 */}
        <header className="text-center mb-6">
          <h1 className="text-4xl font-bold font-kai text-transparent bg-clip-text bg-gradient-to-r from-xian-gold via-yellow-300 to-xian-gold">
            摸鱼修仙
          </h1>
          <p className="text-xian-gold/70 text-base mt-1">大道三千，摸鱼为先</p>
        </header>

        {/* 资源栏 */}
        <div className="mb-4">
          <ResourceBar gameState={gameState} />
        </div>

        {/* 境界信息 */}
        <div className="mb-4">
          <RealmInfo gameState={gameState} />
        </div>

        {/* Tab导航 3x2 */}
        <div className="grid grid-cols-4 gap-[1px] mb-4 bg-xian-gold/10 rounded-xl border border-xian-gold/20 overflow-hidden">
          {([
            { key: 'cultivate' as Tab, label: '🧘 修炼', extra: null },
            { key: 'battle' as Tab, label: '⚔️ 讨伐', extra: gameState.isBattling ? <span className="ml-1 inline-block w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> : null },
            { key: 'technique' as Tab, label: '📖 功法', extra: null },
            { key: 'equip' as Tab, label: '🛡️ 装备', extra: null },
            { key: 'alchemy' as Tab, label: '🔥 炼丹', extra: null },
            { key: 'dungeon' as Tab, label: '🌀 秘境', extra: null },
            { key: 'achieve' as Tab, label: '🏆 成就', extra: null },
            { key: 'rebirth' as Tab, label: '🌟 轮回', extra: null },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`py-2.5 text-sm font-kai transition-all ${
                activeTab === t.key
                  ? 'bg-xian-gold/20 text-xian-gold'
                  : 'bg-[#1a1a2e] text-xian-gold/70 hover:text-xian-gold/90 hover:bg-white/5'
              }`}
            >
              {t.label}{t.extra}
            </button>
          ))}
        </div>

        {/* Tab内容 */}
        {activeTab === 'cultivate' && (
          <div className="animate-tab-in">
            {/* 属性面板 */}
            <div className="mb-4">
              <AttributePanel gameState={gameState} />
            </div>

            {/* 突破面板 */}
            <div className="mb-4">
              <BreakthroughPanel
                info={breakthroughInfo}
                currentExp={gameState.exp}
                currentGold={gameState.gold}
                breakthroughBonus={gameState.breakthroughBonus || 0}
                onBreakthrough={doBreakthrough}
              />
            </div>

            {/* 灵石商店 */}
            <div className="mb-4">
              <GoldShop gameState={gameState} onStateChange={setGameState} />
            </div>
          </div>
        )}

        {activeTab === 'battle' && (
          <div className="mb-4 animate-tab-in">
            <BattlePanel gameState={gameState} onStateChange={setGameState} battleUI={battleUI} clearBattleLogs={clearBattleLogs} />
          </div>
        )}

        {activeTab === 'technique' && (
          <div className="mb-4 animate-tab-in">
            <TechniquePanel gameState={gameState} onStateChange={setGameState} />
          </div>
        )}

        {activeTab === 'equip' && (
          <div className="mb-4 animate-tab-in">
            <EquipmentPanel gameState={gameState} onStateChange={setGameState} />
          </div>
        )}

        {activeTab === 'alchemy' && (
          <div className="mb-4 animate-tab-in">
            <AlchemyPanel gameState={gameState} onStateChange={setGameState} />
          </div>
        )}

        {activeTab === 'dungeon' && (
          <div className="mb-4 animate-tab-in">
            <DungeonPanel gameState={gameState} onStateChange={setGameState} />
          </div>
        )}

        {activeTab === 'achieve' && (
          <div className="mb-4 animate-tab-in">
            <AchievementPanel gameState={gameState} onStateChange={setGameState} />
          </div>
        )}

        {activeTab === 'rebirth' && (
          <div className="mb-4 animate-tab-in">
            <RebirthPanel gameState={gameState} onStateChange={setGameState} />
          </div>
        )}

        {/* 修仙日志 */}
        <div className="mb-4 flex-1">
          <GameLog logs={gameState.logs} />
        </div>

        {/* 底部操作栏 */}
        <footer className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={doSave}
              className="px-3 py-2 bg-xian-scroll/50 border border-xian-gold/20 rounded-lg text-xian-gold/80 text-base hover:bg-xian-scroll hover:border-xian-gold/40 transition-all"
            >
              💾 存档
            </button>
            <button
              onClick={() => setShowSaveManager(true)}
              className="px-3 py-2 bg-xian-scroll/50 border border-xian-gold/20 rounded-lg text-xian-gold/80 text-base hover:bg-xian-scroll hover:border-xian-gold/40 transition-all"
            >
              📁 管理
            </button>
            <button
              onClick={toggleMute}
              className="px-3 py-2 bg-xian-scroll/50 border border-xian-gold/20 rounded-lg text-xian-gold/80 text-base hover:bg-xian-scroll hover:border-xian-gold/40 transition-all"
            >
              {muted ? '🔇' : '🔊'}
            </button>
            <button
              onClick={handleOpenTabTitleModal}
              className="px-3 py-2 bg-xian-scroll/50 border border-xian-gold/20 rounded-lg text-xian-gold/80 text-base hover:bg-xian-scroll hover:border-xian-gold/40 transition-all"
              title="设置标签页名称"
            >
              🏷️
            </button>
            {isDev && (
              <button
                onClick={() => setShowDevTools(true)}
                className="px-3 py-2 bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-300 text-base hover:bg-purple-600/50 hover:border-purple-500/50 transition-all"
                title="开发者工具"
              >
                🔧
              </button>
            )}
          </div>
          <span className="text-sm text-xian-gold/50">{APP_VERSION} · 摸鱼修仙</span>
        </footer>
      </div>

      {/* 飘字层 */}
      <FloatingTextLayer items={floatItems} />

      {/* 突破动画遮罩 */}
      {breakthroughResult && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
          <div className={`breakthrough-flash text-6xl font-kai font-bold ${
            breakthroughResult === 'success'
              ? 'text-yellow-300 drop-shadow-[0_0_30px_rgba(250,204,21,0.8)]'
              : 'text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]'
          }`}>
            {breakthroughResult === 'success' ? '突破成功！' : '突破失败！'}
          </div>
          {breakthroughResult === 'success' && (
            <div className="absolute inset-0 bg-gradient-radial from-yellow-500/10 to-transparent breakthrough-flash" />
          )}
          {breakthroughResult === 'fail' && (
            <div className="absolute inset-0 bg-gradient-radial from-red-500/10 to-transparent breakthrough-flash" />
          )}
        </div>
      )}

      {/* 粒子效果 */}
      {particles.length > 0 && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {particles.map(p => (
            <div
              key={p.id}
              className="particle"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                backgroundColor: p.color,
                ['--px' as string]: `${(Math.random() - 0.5) * 200}px`,
                ['--py' as string]: `${(Math.random() - 0.5) * 200}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* 新手引导 */}
      {showTutorial && (
        <TutorialOverlay onComplete={handleTutorialComplete} />
      )}

      {/* 门派选择弹窗 */}
      {!showTutorial && gameState.sectId === null && (
        <SectSelectModal onSelect={handleSectSelect} />
      )}

      {/* 存档管理（槽内管理：导入/导出/删档等） */}
      {showSaveManager && (
        <SaveManager gameState={gameState} onLoad={handleLoadSave} onClose={() => setShowSaveManager(false)} />
      )}

      {/* 离线收益弹窗 */}
      {showOfflineModal && offlineGains && (
        <OfflineModal offlineGains={offlineGains} onDismiss={dismissOfflineModal} />
      )}

      {/* 版权声明（每次启动） */}
      {showDisclaimer && (
        <DisclaimerModal onConfirm={() => setShowDisclaimer(false)} />
      )}

      {/* 标签页名称设置弹窗 */}
      {showTabTitleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border-2 border-xian-gold/30 p-6 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-kai text-xian-gold mb-4 text-center">🏷️ 设置标签页名称</h2>
            <p className="text-sm text-xian-gold/70 mb-4 text-center">
              自定义浏览器标签页上显示的游戏名称
            </p>
            <input
              type="text"
              value={tempTabTitle}
              onChange={(e) => setTempTabTitle(e.target.value)}
              placeholder="摸鱼修仙"
              maxLength={30}
              className="w-full px-4 py-3 bg-xian-scroll/30 border border-xian-gold/20 rounded-lg text-xian-gold text-center text-lg focus:outline-none focus:border-xian-gold/50 transition-all mb-6"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowTabTitleModal(false)}
                className="flex-1 px-4 py-3 bg-xian-scroll/30 border border-xian-gold/20 rounded-lg text-xian-gold/70 hover:bg-xian-scroll/50 hover:border-xian-gold/40 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleSaveTabTitle}
                className="flex-1 px-4 py-3 bg-xian-gold/20 border border-xian-gold/40 rounded-lg text-xian-gold hover:bg-xian-gold/30 transition-all font-bold"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 开发者工具弹窗（仅开发模式） */}
      {isDev && showDevTools && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border-2 border-purple-500/30 p-6 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-kai text-purple-400 mb-4 text-center">🔧 开发者工具</h2>
            <p className="text-sm text-purple-300/70 mb-6 text-center">
              快速添加测试资源
            </p>
            <div className="space-y-3">
              <button
                onClick={addTestPills}
                className="w-full px-4 py-3 bg-purple-600/30 border border-purple-500/40 rounded-lg text-purple-200 hover:bg-purple-600/50 transition-all text-left"
              >
                <div className="font-bold">🧪 添加100个聚灵丹</div>
                <div className="text-xs text-purple-300/70 mt-1">用于测试丹药叠加时间功能</div>
              </button>
              <button
                onClick={addTestResources}
                className="w-full px-4 py-3 bg-purple-600/30 border border-purple-500/40 rounded-lg text-purple-200 hover:bg-purple-600/50 transition-all text-left"
              >
                <div className="font-bold">💎 添加全部测试资源</div>
                <div className="text-xs text-purple-300/70 mt-1">100聚灵丹 + 1000灵草 + 10万灵石 + 500碎片</div>
              </button>
              <button
                onClick={addAllTechniques}
                className="w-full px-4 py-3 bg-purple-600/30 border border-purple-500/40 rounded-lg text-purple-200 hover:bg-purple-600/50 transition-all text-left"
              >
                <div className="font-bold">📖 一键添加所有功法书</div>
                <div className="text-xs text-purple-300/70 mt-1">将全部功法添加到背包（Lv.1，已有的跳过）</div>
              </button>
              <button
                onClick={addTestTechniqueMastery}
                className="w-full px-4 py-3 bg-purple-600/30 border border-purple-500/40 rounded-lg text-purple-200 hover:bg-purple-600/50 transition-all text-left"
              >
                <div className="font-bold">✨ 当前功法满级并精通</div>
                <div className="text-xs text-purple-300/70 mt-1">先在装备面板上修炼一本功法，再点此按鈕测试精通功能</div>
              </button>
            </div>
            <button
              onClick={() => setShowDevTools(false)}
              className="w-full mt-4 px-4 py-3 bg-xian-scroll/30 border border-xian-gold/20 rounded-lg text-xian-gold/70 hover:bg-xian-scroll/50 hover:border-xian-gold/40 transition-all"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== 根组件：负责选档流程 =====
export default function App() {
  const [disclaimerDone, setDisclaimerDone] = useState(false);
  const [launched, setLaunched] = useState<{ state: GameState; slotIndex: SlotIndex; isNew: boolean } | null>(null);

  // 迁移旧版单存档
  useEffect(() => { migrateLegacySave(); }, []);

  // 1. 先显示版权声明
  if (!disclaimerDone) {
    return <DisclaimerModal onConfirm={() => setDisclaimerDone(true)} />;
  }

  // 2. 再显示选档界面
  if (!launched) {
    return (
      <SaveSlotModal
        onConfirm={(state, slotIndex, isNew) => setLaunched({ state, slotIndex, isNew })}
      />
    );
  }

  // 3. 进入游戏（游戏内不再显示版权声明弹窗）
  return <GameApp initialState={launched.state} slotIndex={launched.slotIndex} isNewGame={launched.isNew} />;
}
