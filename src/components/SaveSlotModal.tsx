import { useState } from 'react';
import { GameState, SlotIndex, SLOT_KEYS, loadGameFromSlot, deleteSlot, createInitialState, saveGameToSlot } from '../data/gameState';
import { getRealm } from '../data/realms';

interface SlotDisplay {
  slotIndex: SlotIndex;
  label: string;
  isEmpty: boolean;
  state: GameState | null;
}

interface Props {
  onConfirm: (state: GameState, slotIndex: SlotIndex, isNew: boolean) => void;
}

function loadAllSlots(): SlotDisplay[] {
  return SLOT_KEYS.map((key, i) => {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return { slotIndex: i as SlotIndex, label: `存档${i + 1}`, isEmpty: true, state: null };
    }
    const s = loadGameFromSlot(i as SlotIndex);
    return { slotIndex: i as SlotIndex, label: `存档${i + 1}`, isEmpty: s === null, state: s };
  });
}

function fmtDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function SaveSlotModal({ onConfirm }: Props) {
  const [slots, setSlots] = useState<SlotDisplay[]>(() => loadAllSlots());
  const [confirmDelete, setConfirmDelete] = useState<SlotIndex | null>(null);

  // 刷新槽位列表
  const refresh = () => setSlots(loadAllSlots());

  const handleSelect = (slot: SlotDisplay) => {
    if (slot.isEmpty) {
      // 新建存档
      const newState = createInitialState();
      saveGameToSlot(newState, slot.slotIndex);
      onConfirm(newState, slot.slotIndex, true);
    } else if (slot.state) {
      onConfirm(slot.state, slot.slotIndex, false);
    }
  };

  const handleDelete = (slotIndex: SlotIndex) => {
    deleteSlot(slotIndex);
    setConfirmDelete(null);
    refresh();
  };

  const allEmpty = slots.every(s => s.isEmpty);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a1a] via-[#0d0d2b] to-[#1a0a2e] pointer-events-none" />
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #6b21a8 0%, transparent 50%), radial-gradient(circle at 80% 70%, #1e3a5f 0%, transparent 50%)' }} />

      <div className="relative w-full max-w-md mx-4">
        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="text-4xl font-kai text-xian-gold mb-2 tracking-widest drop-shadow-lg">摸鱼修仙</div>
          <div className="text-xian-gold/50 text-sm tracking-widest">— 选择存档 —</div>
        </div>

        {/* 存档槽位列表 */}
        <div className="space-y-3 mb-6">
          {slots.map(slot => (
            <div key={slot.slotIndex} className={`rounded-xl border transition-all ${
              slot.isEmpty
                ? 'border-xian-gold/20 bg-black/30 hover:border-xian-gold/40 hover:bg-black/50'
                : 'border-xian-gold/40 bg-gradient-to-r from-[#1a1a2e]/80 to-[#16213e]/80 hover:border-xian-gold/70'
            }`}>
              {confirmDelete === slot.slotIndex ? (
                // 删除确认
                <div className="p-4 flex items-center justify-between">
                  <span className="text-red-300 text-sm">确定删除【{slot.label}】？此操作不可撤销</span>
                  <div className="flex gap-2 ml-2 shrink-0">
                    <button
                      onClick={() => handleDelete(slot.slotIndex)}
                      className="px-3 py-1 text-xs rounded bg-red-600/40 border border-red-500/50 text-red-300 hover:bg-red-600/70 transition-all"
                    >
                      删除
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="px-3 py-1 text-xs rounded bg-gray-600/30 border border-gray-500/30 text-gray-400 hover:bg-gray-600/50 transition-all"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 flex items-center justify-between">
                  {/* 槽位信息 */}
                  <button
                    className="flex-1 text-left"
                    onClick={() => handleSelect(slot)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl ${slot.isEmpty ? 'opacity-30' : ''}`}>
                        {slot.isEmpty ? '📭' : '📖'}
                      </div>
                      <div>
                        <div className="text-xian-gold/90 font-kai text-base">{slot.label}</div>
                        {slot.isEmpty ? (
                          <div className="text-xian-gold/40 text-sm">— 空档位，点击创建新游戏 —</div>
                        ) : slot.state ? (
                          <div className="space-y-0.5">
                            <div className="text-xian-gold/80 text-sm">
                              {getRealm(slot.state.realmIndex).name}
                              {getRealm(slot.state.realmIndex).subLevelName}
                              {slot.state.rebirthCount > 0 && (
                                <span className="ml-2 text-purple-300 text-xs">第{slot.state.rebirthCount}世</span>
                              )}
                            </div>
                            <div className="text-xian-gold/40 text-xs">{fmtDate(slot.state.lastSaveTime)}</div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </button>

                  {/* 删除按钮（非空槽位才显示） */}
                  {!slot.isEmpty && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(slot.slotIndex); }}
                      className="ml-3 px-2 py-1 text-xs rounded bg-red-900/20 border border-red-700/30 text-red-500/70 hover:bg-red-900/40 hover:text-red-400 transition-all shrink-0"
                    >
                      删除
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="text-center text-xian-gold/30 text-xs">
          {allEmpty ? '还没有存档，请选择一个空档位开始你的修仙之路' : '点击存档继续游戏，或选择空档位开始新游戏'}
        </div>
      </div>
    </div>
  );
}
