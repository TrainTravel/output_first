import { describe, it, expect } from 'vitest';
import { LANGUAGE_NAMES, languageNameFor } from './languageNames';

const LANGUAGE_CODES = ['fr', 'es', 'ja', 'zh-Hans', 'zh-Hant', 'en'] as const;
const TRANSLATION_KEYS = ['fr', 'en', 'es', 'ja', 'zh-Hans', 'zh-Hant'] as const;

describe('LANGUAGE_NAMES', () => {
  it('has an entry for every Language code', () => {
    for (const code of LANGUAGE_CODES) {
      expect(LANGUAGE_NAMES[code]).toBeDefined();
    }
  });

  it('every entry has all six translation keys populated (no fallback warnings)', () => {
    for (const code of LANGUAGE_CODES) {
      const row = LANGUAGE_NAMES[code];
      for (const key of TRANSLATION_KEYS) {
        expect(row[key]).toBeTruthy();
        expect(typeof row[key]).toBe('string');
      }
    }
  });

  it('languageNameFor("ja") returns 日本語 in Japanese', () => {
    expect(languageNameFor('ja').ja).toBe('日本語');
  });

  it('languageNameFor("fr") returns French in English and Français in French', () => {
    expect(languageNameFor('fr').en).toBe('French');
    expect(languageNameFor('fr').fr).toBe('Français');
  });

  it('Simplified vs Traditional Chinese names are visually distinct where they should be', () => {
    // 简体中文 (Simplified glyphs) vs 簡體中文 (Traditional glyphs)
    expect(LANGUAGE_NAMES['zh-Hans']['zh-Hans']).toBe('简体中文');
    expect(LANGUAGE_NAMES['zh-Hans']['zh-Hant']).toBe('簡體中文');
    expect(LANGUAGE_NAMES['zh-Hant']['zh-Hans']).toBe('繁体中文');
    expect(LANGUAGE_NAMES['zh-Hant']['zh-Hant']).toBe('繁體中文');
  });
});
