import { useState, useEffect, useRef } from 'react';

const CHANNEL_NAME = 'moyu_xiuxian_instance';
const LOCK_KEY = 'moyu_instance_lock';
const HEARTBEAT_INTERVAL = 2000;
const LOCK_TIMEOUT = 5000;

/**
 * 单实例检测 Hook
 * 返回 true 表示当前是被阻止的重复实例
 */
export function useSingleInstance(): boolean {
  const [blocked, setBlocked] = useState(false);
  const idRef = useRef(Date.now().toString(36) + Math.random().toString(36).slice(2));

  useEffect(() => {
    const myId = idRef.current;
    const channel = new BroadcastChannel(CHANNEL_NAME);

    // 尝试获取锁
    const tryLock = (): boolean => {
      const raw = localStorage.getItem(LOCK_KEY);
      if (raw) {
        try {
          const lock = JSON.parse(raw) as { id: string; ts: number };
          // 如果锁还没过期且不是自己，说明有其他实例
          if (lock.id !== myId && Date.now() - lock.ts < LOCK_TIMEOUT) {
            return false;
          }
        } catch { /* corrupt lock, take over */ }
      }
      // 获取锁
      localStorage.setItem(LOCK_KEY, JSON.stringify({ id: myId, ts: Date.now() }));
      return true;
    };

    if (!tryLock()) {
      setBlocked(true);
      // 监听：如果占锁实例关闭了，自己可以接管
      const retryTimer = setInterval(() => {
        if (tryLock()) {
          setBlocked(false);
          clearInterval(retryTimer);
        }
      }, HEARTBEAT_INTERVAL);

      return () => {
        clearInterval(retryTimer);
        channel.close();
      };
    }

    // 心跳续锁
    const heartbeat = setInterval(() => {
      localStorage.setItem(LOCK_KEY, JSON.stringify({ id: myId, ts: Date.now() }));
    }, HEARTBEAT_INTERVAL);

    // 监听其他实例的挑战
    channel.onmessage = (e) => {
      if (e.data?.type === 'ping') {
        channel.postMessage({ type: 'pong', id: myId });
      }
    };

    // 广播自己的存在
    channel.postMessage({ type: 'ping', id: myId });

    // 页面关闭时释放锁
    const cleanup = () => {
      const raw = localStorage.getItem(LOCK_KEY);
      if (raw) {
        try {
          const lock = JSON.parse(raw);
          if (lock.id === myId) {
            localStorage.removeItem(LOCK_KEY);
          }
        } catch { /* ignore */ }
      }
    };

    window.addEventListener('beforeunload', cleanup);

    return () => {
      clearInterval(heartbeat);
      cleanup();
      window.removeEventListener('beforeunload', cleanup);
      channel.close();
    };
  }, []);

  return blocked;
}
