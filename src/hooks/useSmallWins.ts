import { useProfileStorage } from './useProfileStorage';
import { tickEngagement } from './useEngagement';

export interface SmallWin {
  id: string;
  text: string;
  date: string;
  createdAt: string;
}

/** Legacy unprefixed key — one-shot migrated to per-profile storage in Phase 1. */
const LEGACY_WINS_KEY = 'outputfirst_wins';
/** Per-profile storage suffix. */
export const WINS_STORAGE_KEY = 'wins';

export function useSmallWins() {
  const [wins, setWins] = useProfileStorage<SmallWin[]>(
    WINS_STORAGE_KEY,
    [],
    { legacyKey: LEGACY_WINS_KEY },
  );

  const today = new Date().toISOString().split('T')[0] ?? '';
  const winsToday = wins.filter(w => w.date === today);

  const addWin = (text: string): SmallWin => {
    const win: SmallWin = {
      id: crypto.randomUUID(),
      text,
      date: today,
      createdAt: new Date().toISOString(),
    };
    setWins(prev => [...prev, win]);
    tickEngagement();
    return win;
  };

  return { wins, winsToday, addWin };
}
