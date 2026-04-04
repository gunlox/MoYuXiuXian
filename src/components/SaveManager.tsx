import { useState, useRef } from 'react';
import { GameState } from '../data/gameState';
import { getRealm } from '../data/realms';

const SLOT_KEYS = ['moyu_slot_1', 'moyu_slot_2', 'moyu_slot_3'];

interface SlotInfo {
  key: string;
  label: string;
  data: GameState | null;
}

interface Props {
  gameState: GameState;
  onLoad: (state: GameState) => void;
  onClose: () => void;
}

export default function SaveManager({ gameState, onLoad, onClose }: Props) {
  const [slots, setSlots] = useState<SlotInfo[]>(() => loadSlots());
  const fileRef = useRef<HTMLInputElement>(null);

  function loadSlots(): SlotInfo[] {
    return SLOT_KEYS.map((key, i) => {
      const raw = localStorage.getItem(key);
      let data: GameState | null = null;
      if (raw) {
        try { data = JSON.parse(raw); } catch { /* ignore */ }
      }
      return { key, label: `存档${i + 1}`, data };
    });
  }

  const saveToSlot = (slotKey: string) => {
    const data = { ...gameState, lastSaveTime: Date.now() };
    localStorage.setItem(slotKey, JSON.stringify(data));
    setSlots(loadSlots());
  };

  const loadFromSlot = (slot: SlotInfo) => {
    if (!slot.data) return;
    onLoad(slot.data);
    onClose();
  };

  const deleteSlot = (slotKey: string) => {
    localStorage.removeItem(slotKey);
    setSlots(loadSlots());
  };

  // 导出存档为JSON文件
  const exportSave = () => {
    const data = { ...gameState, lastSaveTime: Date.now() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `摸鱼修仙_${getRealm(gameState.realmIndex).name}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 导入存档
  const importSave = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as GameState;
        if (data.realmIndex !== undefined && data.exp !== undefined) {
          onLoad(data);
          onClose();
        } else {
          alert('无效的存档文件');
        }
      } catch {
        alert('无法解析存档文件');
      }
    };
    reader.readAsText(file);
  };

  const fmtDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="max-w-md w-full mx-4 bg-gradient-to-br from-[#1a1a2e] to-[#0a0a1a] rounded-2xl border border-xian-gold/30 p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-kai text-xian-gold">💾 存档管理</h2>
          <button onClick={onClose} className="text-xian-gold/60 hover:text-xian-gold/90 text-xl">&times;</button>
        </div>

        {/* 槽位列表 */}
        <div className="space-y-2 mb-4">
          {slots.map(slot => (
            <div key={slot.key} className="rounded-lg p-3 border border-xian-gold/20 bg-black/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-base font-kai text-xian-gold/80">{slot.label}</span>
                {slot.data && (
                  <span className="text-sm text-xian-gold/60">{fmtDate(slot.data.lastSaveTime)}</span>
                )}
              </div>
              {slot.data ? (
                <>
                  <div className="text-sm text-xian-gold/70 mb-2">
                    {getRealm(slot.data.realmIndex).name}{getRealm(slot.data.realmIndex).subLevelName}
                    {slot.data.rebirthCount > 0 && ` · 第${slot.data.rebirthCount}世`}
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => loadFromSlot(slot)} className="px-3 py-1 text-sm rounded bg-green-600/30 border border-green-500/30 text-green-400 hover:bg-green-600/50 transition-all">读取</button>
                    <button onClick={() => saveToSlot(slot.key)} className="px-3 py-1 text-sm rounded bg-blue-600/30 border border-blue-500/30 text-blue-400 hover:bg-blue-600/50 transition-all">覆盖</button>
                    <button onClick={() => deleteSlot(slot.key)} className="px-3 py-1 text-sm rounded bg-red-600/30 border border-red-500/30 text-red-400 hover:bg-red-600/50 transition-all">删除</button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-xian-gold/50">空槽位</span>
                  <button onClick={() => saveToSlot(slot.key)} className="px-3 py-1 text-sm rounded bg-xian-gold/10 border border-xian-gold/20 text-xian-gold/70 hover:bg-xian-gold/20 transition-all">保存</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 导入导出 */}
        <div className="flex gap-2">
          <button
            onClick={exportSave}
            className="flex-1 py-2 text-sm font-kai rounded-lg bg-purple-600/30 border border-purple-500/30 text-purple-300 hover:bg-purple-600/50 transition-all"
          >
            📤 导出存档
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 py-2 text-sm font-kai rounded-lg bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-600/50 transition-all"
          >
            📥 导入存档
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={importSave} className="hidden" />
        </div>
      </div>
    </div>
  );
}
