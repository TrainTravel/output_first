import { useState, useEffect } from 'react';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';

export interface SmallWin {
  id: string;
  text: string;
  date: string;
  createdAt: string;
}

const WINS_KEY = 'outputfirst_wins';

export function useSmallWins() {
  const [wins, setWins] = useState<SmallWin[]>([]);

  useEffect(() => {
    pipe(
      O.fromNullable(localStorage.getItem(WINS_KEY)),
      O.flatMap(stored => {
        try { return O.some(JSON.parse(stored) as SmallWin[]); }
        catch (e) { console.error('Failed to load wins:', e); return O.none; }
      }),
      O.map(setWins),
    );
  }, []);

  useEffect(() => {
    if (wins.length > 0) {
      localStorage.setItem(WINS_KEY, JSON.stringify(wins));
    }
  }, [wins]);

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
    return win;
  };

  return { wins, winsToday, addWin };
}
