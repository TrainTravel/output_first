import { useState, useEffect } from 'react';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';

export type Priority = 'A' | 'B' | 'C';

export interface TodoItem {
  id: string;
  text: string;
  priority: Priority;
  pendingAI: boolean;
  aiReason: string;
  completed: boolean;
  createdAt: string;
}

const TODOS_KEY = 'outputfirst_todos';

export function useTodoList() {
  const [items, setItems] = useState<TodoItem[]>([]);

  useEffect(() => {
    pipe(
      O.fromNullable(localStorage.getItem(TODOS_KEY)),
      O.flatMap(stored => {
        try { return O.some(JSON.parse(stored) as TodoItem[]); }
        catch { return O.none; }
      }),
      O.map(setItems),
    );
  }, []);

  useEffect(() => {
    localStorage.setItem(TODOS_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (text: string): string => {
    const id = crypto.randomUUID();
    setItems(prev => [...prev, {
      id,
      text,
      priority: 'C',
      pendingAI: true,
      aiReason: '',
      completed: false,
      createdAt: new Date().toISOString(),
    }]);
    return id;
  };

  const resolveAI = (id: string, priority: Priority, aiReason: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, priority, aiReason, pendingAI: false } : item
    ));
  };

  const setPriority = (id: string, priority: Priority) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, priority, pendingAI: false } : item
    ));
  };

  const toggleComplete = (id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return { items, addItem, resolveAI, setPriority, toggleComplete, deleteItem };
}
