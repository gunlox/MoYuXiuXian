import { memo, useEffect, useRef } from 'react';

interface Props {
  logs: string[];
}

export default memo(function GameLog({ logs }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [logs.length]);

  return (
    <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-4 border border-xian-gold/30">
      <div className="text-base text-xian-gold/80 mb-2 font-kai">📜 修仙日志</div>
      <div ref={containerRef} className="h-48 overflow-y-auto space-y-1 pr-2">
        {logs.map((log, i) => (
          <div
            key={i}
            className="text-base text-xian-gold/90 py-1 border-b border-xian-gold/5 last:border-0"
          >
            {log}
          </div>
        ))}
      </div>
    </div>
  );
});
