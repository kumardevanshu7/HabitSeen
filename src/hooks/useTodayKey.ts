import { useState, useEffect } from 'react';
import { getTodayKey } from '../utils/dateMath';

export function useTodayKey(): string {
  const [todayKey, setTodayKey] = useState<string>(getTodayKey);

  useEffect(() => {
    let timerId: NodeJS.Timeout;

    const scheduleMidnightUpdate = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
      const msUntilMidnight = Math.max(1000, tomorrow.getTime() - now.getTime());

      timerId = setTimeout(() => {
        setTodayKey(getTodayKey());
        scheduleMidnightUpdate();
      }, msUntilMidnight);
    };

    scheduleMidnightUpdate();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const current = getTodayKey();
        setTodayKey((prev) => (prev !== current ? current : prev));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timerId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return todayKey;
}
