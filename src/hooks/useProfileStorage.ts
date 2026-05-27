import { useState, useEffect, useCallback, useRef } from 'react';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { useLanguage, DEFAULT_PROFILE_ID } from '@/contexts/LanguageContext';

/**
 * Build the localStorage key for a (profileId, suffix) pair.
 *
 * All per-profile data lives under `outputfirst_profile_<id>_<suffix>` so
 * that switching the active profile is just a key prefix change — every
 * hook stays unmodified after migrating to `useProfileStorage`.
 */
export function profileKey(profileId: string, suffix: string): string {
  return `outputfirst_profile_${profileId}_${suffix}`;
}

/** Per-key flag indicating the one-shot legacy→profile migration already ran. */
function migrationFlag(suffix: string): string {
  return `outputfirst_profile_migrated_${suffix}`;
}

/**
 * Resolve a default value when given either a raw value or a lazy initializer.
 * Used to defer expensive default construction the same way useState does.
 */
function resolveDefault<T>(value: T | (() => T)): T {
  return typeof value === 'function' ? (value as () => T)() : value;
}

/**
 * Read a value of type `T` from localStorage at the given key, falling back
 * to the supplied default when:
 *   - the key is absent
 *   - the stored payload is not valid JSON
 *
 * Always returns a value — never throws, never returns `null`. Matches the
 * fp-ts/Option-based hydration pattern used elsewhere in the codebase.
 */
function readFromStorage<T>(key: string, fallback: T): T {
  return pipe(
    O.fromNullable(localStorage.getItem(key)),
    O.flatMap(raw => {
      try {
        return O.some(JSON.parse(raw) as T);
      } catch {
        return O.none;
      }
    }),
    O.getOrElse(() => fallback),
  );
}

/**
 * One-shot migration: if the active profile is the default profile AND
 * legacy data still lives at the unprefixed key, copy it to the prefixed
 * key and clear the legacy entry.
 *
 * Idempotent — a per-suffix flag (`outputfirst_profile_migrated_<suffix>`)
 * ensures this runs at most once per suffix per browser.
 */
function maybeMigrateLegacyKey(
  legacyKey: string,
  prefixedKey: string,
  suffix: string,
  activeProfileId: string,
): void {
  if (activeProfileId !== DEFAULT_PROFILE_ID) return;
  const flag = migrationFlag(suffix);
  if (localStorage.getItem(flag) !== null) return;

  const legacyRaw = localStorage.getItem(legacyKey);
  if (legacyRaw !== null) {
    // If the prefixed key is empty, copy the legacy data into it.
    // If the prefixed key already has data (e.g. user wrote during this
    // session before the migration flag was set), don't clobber it.
    if (localStorage.getItem(prefixedKey) === null) {
      try {
        localStorage.setItem(prefixedKey, legacyRaw);
      } catch {
        /* quota / private mode — best effort */
      }
    }
    try {
      localStorage.removeItem(legacyKey);
    } catch {
      /* ignore */
    }
  }

  try {
    localStorage.setItem(flag, 'true');
  } catch {
    /* ignore */
  }
}

export interface UseProfileStorageOptions {
  /**
   * If provided, the helper will attempt a one-shot migration of data from
   * this legacy unprefixed key into the default profile's namespaced key.
   * Runs exactly once per suffix (guarded by `outputfirst_profile_migrated_<suffix>`).
   */
  legacyKey?: string;
}

/**
 * Profile-scoped localStorage hook.
 *
 * Reads and writes are namespaced under the **currently active profile**:
 *   `outputfirst_profile_<activeProfileId>_<suffix>`
 *
 * When the active profile changes (via `switchProfile`), the hook
 * re-reads from the new key — without remounting and without a stale
 * closure. Per-profile data isolation is the whole point: writes from
 * one profile must never appear under another.
 *
 * Contract:
 *   - `[value, setValue]` works like `useState` + write-through to LS
 *   - `setValue` accepts a value OR an updater function (same as useState)
 *   - `defaultValue` may be a thunk for expensive defaults
 *   - hydration uses fp-ts/Option (malformed JSON → default)
 *   - optional `legacyKey` triggers one-shot migration on the default profile
 */
export function useProfileStorage<T>(
  suffix: string,
  defaultValue: T | (() => T),
  options: UseProfileStorageOptions = {},
): [T, (next: T | ((prev: T) => T)) => void] {
  const { activeProfileId } = useLanguage();
  const { legacyKey } = options;

  // Stable ref to the default so the hydration effect doesn't refire when
  // the caller passes a fresh literal each render.
  const defaultRef = useRef(defaultValue);
  defaultRef.current = defaultValue;

  // Initial state: read synchronously from the active profile's key so
  // consumers don't observe a one-render "empty" flash.
  const [value, setValue] = useState<T>(() => {
    const key = profileKey(activeProfileId, suffix);
    if (legacyKey !== undefined) {
      maybeMigrateLegacyKey(legacyKey, key, suffix, activeProfileId);
    }
    return readFromStorage<T>(key, resolveDefault(defaultRef.current));
  });

  // When the active profile changes, re-hydrate from the new key.
  // The `activeProfileId` dependency is exactly what makes per-profile
  // isolation work — without it, the closure would freeze on the first
  // profile id and writes would leak across profiles.
  //
  // We use a ref to track the profile we last hydrated for, so the first
  // mount (where `activeProfileId` already matches the useState initializer)
  // doesn't re-trigger the hydration unnecessarily.
  const lastHydratedFor = useRef(activeProfileId);
  useEffect(() => {
    if (lastHydratedFor.current === activeProfileId) return;
    lastHydratedFor.current = activeProfileId;
    const key = profileKey(activeProfileId, suffix);
    if (legacyKey !== undefined) {
      maybeMigrateLegacyKey(legacyKey, key, suffix, activeProfileId);
    }
    setValue(readFromStorage<T>(key, resolveDefault(defaultRef.current)));
  }, [activeProfileId, suffix, legacyKey]);

  // Persist on every value change for the active profile.
  useEffect(() => {
    const key = profileKey(activeProfileId, suffix);
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota / private mode — best effort */
    }
  }, [value, activeProfileId, suffix]);

  // Stable setter that also supports the updater-function form like useState.
  const setStored = useCallback((next: T | ((prev: T) => T)) => {
    setValue(prev => (typeof next === 'function' ? (next as (p: T) => T)(prev) : next));
  }, []);

  return [value, setStored];
}
