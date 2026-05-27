import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import {
  LanguageProvider,
  useLanguage,
  DEFAULT_PROFILE_ID,
} from '@/contexts/LanguageContext';
import { useProfileStorage, profileKey } from './useProfileStorage';

beforeEach(() => {
  localStorage.clear();
});

function makeWrapper() {
  return ({ children }: { children: ReactNode }) =>
    createElement(LanguageProvider, null, children);
}

/**
 * Compose two hooks into a single renderHook subject. The order matters:
 * `useLanguage()` must mount under the same provider so both hooks share
 * the same context instance.
 */
function useStorageAndLang<T>(suffix: string, def: T) {
  const lang = useLanguage();
  const [value, setValue] = useProfileStorage<T>(suffix, def);
  return { value, setValue, lang };
}

describe('useProfileStorage — basic read/write', () => {
  it('returns the default value when storage is empty', () => {
    const { result } = renderHook(
      () => useStorageAndLang<string[]>('test_key', []),
      { wrapper: makeWrapper() },
    );
    expect(result.current.value).toEqual([]);
  });

  it('returns a lazy default value when storage is empty', () => {
    const { result } = renderHook(
      () => useStorageAndLang('test_key', () => ({ greeting: 'hello' })),
      { wrapper: makeWrapper() },
    );
    expect(result.current.value).toEqual({ greeting: 'hello' });
  });

  it('reads pre-existing stored data from the active profile key', () => {
    // Seed the default profile's namespaced key directly.
    localStorage.setItem(
      profileKey(DEFAULT_PROFILE_ID, 'test_key'),
      JSON.stringify(['a', 'b']),
    );
    const { result } = renderHook(
      () => useStorageAndLang<string[]>('test_key', []),
      { wrapper: makeWrapper() },
    );
    expect(result.current.value).toEqual(['a', 'b']);
  });

  it('returns default when stored JSON is malformed', () => {
    localStorage.setItem(
      profileKey(DEFAULT_PROFILE_ID, 'test_key'),
      'this is not json{',
    );
    const { result } = renderHook(
      () => useStorageAndLang<string[]>('test_key', ['fallback']),
      { wrapper: makeWrapper() },
    );
    expect(result.current.value).toEqual(['fallback']);
  });

  it('persists writes to the prefixed key', () => {
    const { result } = renderHook(
      () => useStorageAndLang<string[]>('test_key', []),
      { wrapper: makeWrapper() },
    );
    act(() => result.current.setValue(['written']));
    expect(result.current.value).toEqual(['written']);
    const stored = localStorage.getItem(profileKey(DEFAULT_PROFILE_ID, 'test_key'));
    expect(JSON.parse(stored!)).toEqual(['written']);
  });

  it('setValue accepts an updater function (matches useState semantics)', () => {
    const { result } = renderHook(
      () => useStorageAndLang<number[]>('test_key', [1, 2]),
      { wrapper: makeWrapper() },
    );
    act(() => result.current.setValue(prev => [...prev, 3]));
    expect(result.current.value).toEqual([1, 2, 3]);
  });
});

describe('useProfileStorage — cross-profile isolation', () => {
  it('switching profile re-hydrates from the new key', () => {
    // Seed two profiles with different data.
    localStorage.setItem(
      profileKey(DEFAULT_PROFILE_ID, 'fruit'),
      JSON.stringify(['apple']),
    );
    localStorage.setItem(
      profileKey('profile-b', 'fruit'),
      JSON.stringify(['banana']),
    );
    // Seed the profiles list manually so both ids are valid.
    localStorage.setItem('outputfirst_profiles', JSON.stringify({
      profiles: [
        { id: DEFAULT_PROFILE_ID, primary: 'en', target: 'fr', createdAt: '2026-05-27T00:00:00.000Z' },
        { id: 'profile-b', primary: 'en', target: 'es', createdAt: '2026-05-27T00:00:00.000Z' },
      ],
      activeProfileId: DEFAULT_PROFILE_ID,
    }));

    const { result } = renderHook(
      () => useStorageAndLang<string[]>('fruit', []),
      { wrapper: makeWrapper() },
    );

    expect(result.current.value).toEqual(['apple']);
    act(() => result.current.lang.switchProfile('profile-b'));
    expect(result.current.value).toEqual(['banana']);
  });

  it('writes in profile A do not leak into profile B', () => {
    // Two profiles, both empty.
    localStorage.setItem('outputfirst_profiles', JSON.stringify({
      profiles: [
        { id: DEFAULT_PROFILE_ID, primary: 'en', target: 'fr', createdAt: '2026-05-27T00:00:00.000Z' },
        { id: 'profile-b', primary: 'en', target: 'es', createdAt: '2026-05-27T00:00:00.000Z' },
      ],
      activeProfileId: DEFAULT_PROFILE_ID,
    }));

    const { result } = renderHook(
      () => useStorageAndLang<string[]>('basket', []),
      { wrapper: makeWrapper() },
    );

    // Write under default profile.
    act(() => result.current.setValue(['apple', 'pear']));
    expect(result.current.value).toEqual(['apple', 'pear']);

    // Switch — profile B should still be empty.
    act(() => result.current.lang.switchProfile('profile-b'));
    expect(result.current.value).toEqual([]);

    // Write something different under B.
    act(() => result.current.setValue(['banana']));
    expect(result.current.value).toEqual(['banana']);

    // Switch back — A's data is still intact.
    act(() => result.current.lang.switchProfile(DEFAULT_PROFILE_ID));
    expect(result.current.value).toEqual(['apple', 'pear']);

    // And each lives at its own key.
    expect(
      JSON.parse(localStorage.getItem(profileKey(DEFAULT_PROFILE_ID, 'basket'))!),
    ).toEqual(['apple', 'pear']);
    expect(
      JSON.parse(localStorage.getItem(profileKey('profile-b', 'basket'))!),
    ).toEqual(['banana']);
  });

  it('creating a new profile and switching gives an empty value', () => {
    const { result } = renderHook(
      () => useStorageAndLang<string[]>('basket', []),
      { wrapper: makeWrapper() },
    );

    // Write something under the default profile.
    act(() => result.current.setValue(['initial']));
    expect(result.current.value).toEqual(['initial']);

    // Create a new profile (createProfile switches to it automatically).
    let newProfileId = '';
    act(() => {
      const created = result.current.lang.createProfile({ primary: 'en', target: 'es' });
      newProfileId = created.id;
    });
    expect(newProfileId).not.toBe('');

    // New profile starts empty.
    expect(result.current.value).toEqual([]);
  });
});

describe('useProfileStorage — legacy data migration', () => {
  it('copies legacy unprefixed data to the default profile key on first mount', () => {
    localStorage.setItem('outputfirst_legacy_thing', JSON.stringify(['migrated-item']));

    const useTest = () => {
      const [value, setValue] = useProfileStorage<string[]>('legacy_thing', [], {
        legacyKey: 'outputfirst_legacy_thing',
      });
      const lang = useLanguage();
      return { value, setValue, lang };
    };

    const { result } = renderHook(useTest, { wrapper: makeWrapper() });

    // The initializer ran the migration and re-read the prefixed key.
    expect(result.current.value).toEqual(['migrated-item']);
    // Legacy key was deleted after migration.
    expect(localStorage.getItem('outputfirst_legacy_thing')).toBeNull();
    // Migration flag is set so subsequent mounts skip.
    expect(localStorage.getItem('outputfirst_profile_migrated_legacy_thing')).toBe('true');
    // Data lives at the prefixed key.
    expect(
      JSON.parse(localStorage.getItem(profileKey(DEFAULT_PROFILE_ID, 'legacy_thing'))!),
    ).toEqual(['migrated-item']);
  });

  it('marks the migration flag so it does not re-run', () => {
    // Custom test wrapper to pass legacyKey through.
    const useTest = () => {
      const [value, setValue] = useProfileStorage<string[]>('legacy2', [], {
        legacyKey: 'outputfirst_legacy2_old',
      });
      const lang = useLanguage();
      return { value, setValue, lang };
    };
    localStorage.setItem('outputfirst_legacy2_old', JSON.stringify(['x']));

    const { result, unmount } = renderHook(() => useTest(), { wrapper: makeWrapper() });

    expect(result.current.value).toEqual(['x']);
    // Legacy key is removed after migration.
    expect(localStorage.getItem('outputfirst_legacy2_old')).toBeNull();
    // Migration flag is set.
    expect(localStorage.getItem('outputfirst_profile_migrated_legacy2')).toBe('true');
    unmount();

    // Simulate a fresh write to the legacy key after migration — it should
    // NOT be picked up the next mount because the flag is set.
    localStorage.setItem('outputfirst_legacy2_old', JSON.stringify(['should-not-migrate']));
    const { result: r2 } = renderHook(() => useTest(), { wrapper: makeWrapper() });

    // Active profile's prefixed key still has the original migrated data.
    expect(r2.current.value).toEqual(['x']);
    // Legacy key was left alone this time (since migration is one-shot).
    expect(localStorage.getItem('outputfirst_legacy2_old')).toBe(JSON.stringify(['should-not-migrate']));
  });

  it('does not migrate when active profile is not the default profile', () => {
    // Seed profile state with a non-default active profile.
    localStorage.setItem('outputfirst_profiles', JSON.stringify({
      profiles: [
        { id: 'profile-z', primary: 'en', target: 'fr', createdAt: '2026-05-27T00:00:00.000Z' },
      ],
      activeProfileId: 'profile-z',
    }));
    localStorage.setItem('outputfirst_legacy_skip', JSON.stringify(['legacy-data']));

    const useTest = () =>
      useProfileStorage<string[]>('legacy_skip', [], { legacyKey: 'outputfirst_legacy_skip' });

    const { result } = renderHook(() => useTest(), { wrapper: makeWrapper() });

    // The non-default profile started empty and we did NOT migrate.
    expect(result.current[0]).toEqual([]);
    // Legacy data is preserved (so a future user on the default profile can still get it).
    expect(localStorage.getItem('outputfirst_legacy_skip')).toBe(JSON.stringify(['legacy-data']));
  });

  it('does not clobber existing prefixed data when migrating', () => {
    // Both legacy and the default profile's prefixed key exist.
    localStorage.setItem('outputfirst_legacy_overlap', JSON.stringify(['legacy']));
    localStorage.setItem(
      profileKey(DEFAULT_PROFILE_ID, 'overlap'),
      JSON.stringify(['existing-prefixed']),
    );

    const useTest = () =>
      useProfileStorage<string[]>('overlap', [], { legacyKey: 'outputfirst_legacy_overlap' });

    const { result } = renderHook(() => useTest(), { wrapper: makeWrapper() });

    // Existing prefixed data wins.
    expect(result.current[0]).toEqual(['existing-prefixed']);
    // Legacy key still gets cleaned up.
    expect(localStorage.getItem('outputfirst_legacy_overlap')).toBeNull();
  });
});

describe('profileKey helper', () => {
  it('namespaces id and suffix predictably', () => {
    expect(profileKey('abc', 'entries')).toBe('outputfirst_profile_abc_entries');
  });
});
