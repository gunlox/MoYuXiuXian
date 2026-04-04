import { useState, useCallback } from 'react';

export interface FloatItem {
  id: number;
  text: string;
  color: string;
  x: number; // 0~100 百分比
}

let nextId = 0;

/** 飘字管理hook */
export function useFloatingText() {
  const [items, setItems] = useState<FloatItem[]>([]);

  const addFloat = useCallback((text: string, color: string = 'text-yellow-400') => {
    const item: FloatItem = {
      id: nextId++,
      text,
      color,
      x: 30 + Math.random() * 40, // 30%~70%水平位置
    };
    setItems(prev => [...prev, item]);
    // 1.2秒后移除
    setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== item.id));
    }, 1200);
  }, []);

  return { items, addFloat };
}

/** 飘字渲染组件 */
export function FloatingTextLayer({ items }: { items: FloatItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {items.map(item => (
        <div
          key={item.id}
          className={`absolute animate-float-up text-lg font-bold font-kai ${item.color} drop-shadow-[0_0_8px_currentColor]`}
          style={{ left: `${item.x}%`, top: '40%' }}
        >
          {item.text}
        </div>
      ))}
    </div>
  );
}
