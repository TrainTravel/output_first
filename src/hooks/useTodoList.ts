import { useProfileStorage } from './useProfileStorage';

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

/** Legacy unprefixed key — one-shot migrated to per-profile storage in Phase 1. */
const LEGACY_TODOS_KEY = 'outputfirst_todos';
/** Per-profile storage suffix. */
export const TODOS_STORAGE_KEY = 'todos';

export function useTodoList() {
  const [items, setItems] = useProfileStorage<TodoItem[]>(
    TODOS_STORAGE_KEY,
    [],
    { legacyKey: LEGACY_TODOS_KEY },
  );

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
