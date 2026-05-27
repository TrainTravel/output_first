import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import {
  LanguageProvider,
  useLanguage,
  DEFAULT_PROFILE_ID,
} from '@/contexts/LanguageContext';
import { profileKey } from './useProfileStorage';
import { useTodoList, TODOS_STORAGE_KEY } from './useTodoList';

const LEGACY_KEY = 'outputfirst_todos';
const STORAGE_KEY = profileKey(DEFAULT_PROFILE_ID, TODOS_STORAGE_KEY);

beforeEach(() => localStorage.clear());

function makeWrapper() {
  return ({ children }: { children: ReactNode }) =>
    createElement(LanguageProvider, null, children);
}

describe('useTodoList — basic surface', () => {
  it('starts with an empty list', () => {
    const { result } = renderHook(() => useTodoList(), { wrapper: makeWrapper() });
    expect(result.current.items).toEqual([]);
  });

  it('addItem appends with default priority C and pendingAI=true', () => {
    const { result } = renderHook(() => useTodoList(), { wrapper: makeWrapper() });
    let id = '';
    act(() => { id = result.current.addItem('Buy milk'); });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toMatchObject({
      id,
      text: 'Buy milk',
      priority: 'C',
      pendingAI: true,
      completed: false,
    });
  });

  it('toggleComplete flips the completed flag', () => {
    const { result } = renderHook(() => useTodoList(), { wrapper: makeWrapper() });
    let id = '';
    act(() => { id = result.current.addItem('Read book'); });
    act(() => result.current.toggleComplete(id));
    expect(result.current.items[0].completed).toBe(true);
    act(() => result.current.toggleComplete(id));
    expect(result.current.items[0].completed).toBe(false);
  });

  it('deleteItem removes an item by id', () => {
    const { result } = renderHook(() => useTodoList(), { wrapper: makeWrapper() });
    let id = '';
    act(() => { id = result.current.addItem('Throwaway'); });
    expect(result.current.items).toHaveLength(1);
    act(() => result.current.deleteItem(id));
    expect(result.current.items).toEqual([]);
  });

  it('persists items to the per-profile localStorage key', () => {
    const { result } = renderHook(() => useTodoList(), { wrapper: makeWrapper() });
    act(() => { result.current.addItem('Persist me'); });
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].text).toBe('Persist me');
  });
});

describe('useTodoList — per-profile isolation', () => {
  it('items in profile A do not appear under profile B', () => {
    localStorage.setItem('outputfirst_profiles', JSON.stringify({
      profiles: [
        { id: DEFAULT_PROFILE_ID, primary: 'en', target: 'fr', createdAt: '2026-05-27T00:00:00.000Z' },
        { id: 'profile-b', primary: 'en', target: 'es', createdAt: '2026-05-27T00:00:00.000Z' },
      ],
      activeProfileId: DEFAULT_PROFILE_ID,
    }));

    const useBoth = () => ({ todo: useTodoList(), lang: useLanguage() });
    const { result } = renderHook(useBoth, { wrapper: makeWrapper() });

    act(() => { result.current.todo.addItem('Task A'); });
    expect(result.current.todo.items).toHaveLength(1);

    act(() => result.current.lang.switchProfile('profile-b'));
    expect(result.current.todo.items).toEqual([]);

    act(() => { result.current.todo.addItem('Task B'); });
    expect(result.current.todo.items).toHaveLength(1);

    act(() => result.current.lang.switchProfile(DEFAULT_PROFILE_ID));
    expect(result.current.todo.items[0].text).toBe('Task A');
  });

  it('one-shot legacy migration: outputfirst_todos → default profile key', () => {
    const legacyItems = [
      { id: 'legacy-1', text: 'Legacy todo', priority: 'C', pendingAI: false, aiReason: '', completed: false, createdAt: '2026-05-20T00:00:00.000Z' },
    ];
    localStorage.setItem(LEGACY_KEY, JSON.stringify(legacyItems));

    const { result } = renderHook(() => useTodoList(), { wrapper: makeWrapper() });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].text).toBe('Legacy todo');
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull();
    expect(
      localStorage.getItem(`outputfirst_profile_migrated_${TODOS_STORAGE_KEY}`),
    ).toBe('true');
  });
});
