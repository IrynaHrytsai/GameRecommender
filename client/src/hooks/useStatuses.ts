import { useState, useCallback, useEffect } from 'react';
import type { GameStatus } from '../types';
import { fetchStatuses, saveStatus, clearAllStatuses } from '../utils/api';

// This hook manages game statuses — syncs to DB when logged in,
// falls back to local state when not authenticated.
export function useStatuses(isAuthenticated: boolean) {
  const [statuses, setStatuses] = useState<Record<string, GameStatus>>({});
  const [syncing, setSyncing] = useState(false);

  // Load from DB on login
  useEffect(() => {
    if (!isAuthenticated) {
      setStatuses({});
      return;
    }
    setSyncing(true);
    fetchStatuses()
      .then(s => setStatuses(s))
      .finally(() => setSyncing(false));
  }, [isAuthenticated]);

  // const setStatus = useCallback((id: string, status: GameStatus) => {
  //   setStatuses(prev => {
  //     const next = { ...prev, [id]: status };
  //     if (status === 'none') delete next[id];
  //     return next;
  //   });
  //   if (isAuthenticated) {
  //     saveStatus(id, status).catch(console.error);
  //   }
  // }, [isAuthenticated]);

  const handleLike = useCallback((id: string) => {
    setStatuses(prev => {
      const next = prev[id] === 'liked' ? 'none' : 'liked';
      if (isAuthenticated) saveStatus(id, next).catch(console.error);
      return { ...prev, [id]: next };
    });
  }, [isAuthenticated]);

  const handleDislike = useCallback((id: string) => {
    setStatuses(prev => {
      const next = prev[id] === 'disliked' ? 'none' : 'disliked';
      if (isAuthenticated) saveStatus(id, next).catch(console.error);
      return { ...prev, [id]: next };
    });
  }, [isAuthenticated]);

  const handleComplete = useCallback((id: string) => {
    setStatuses(prev => {
      const next = prev[id] === 'completed' ? 'none' : 'completed';
      if (isAuthenticated) saveStatus(id, next).catch(console.error);
      return { ...prev, [id]: next };
    });
  }, [isAuthenticated]);

  const handleRemove = useCallback((id: string) => {
    setStatuses(prev => {
      const s = { ...prev };
      delete s[id];
      return s;
    });
    if (isAuthenticated) saveStatus(id, 'none').catch(console.error);
  }, [isAuthenticated]);

  const handleClearAll = useCallback(() => {
    setStatuses({});
    if (isAuthenticated) clearAllStatuses().catch(console.error);
  }, [isAuthenticated]);

  return {
    statuses,
    syncing,
    handleLike,
    handleDislike,
    handleComplete,
    handleRemove,
    handleClearAll,
  };
}
