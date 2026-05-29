import type { Language, Translations } from '@/contexts/LanguageContext';

/**
 * Canonical language-name translations. Use anywhere a UI string needs to
 * NAME a language derived from app state (active profile target, primary
 * language, etc.). NEVER hard-code a language name into a `t()` call:
 * see CLAUDE.md → "Dynamic strings that NAME a language".
 *
 * Every entry includes all six current `Language` values so callers can
 * read fields without optional-chaining. When a new language is added to
 * `Language`, add a full row here and TS will flag every call site that
 * needs updating.
 */
export const LANGUAGE_NAMES: Record<Language, Required<Translations>> = {
  fr: {
    fr: 'Français',
    en: 'French',
    es: 'Francés',
    ja: 'フランス語',
    'zh-Hans': '法语',
    'zh-Hant': '法語',
  },
  es: {
    fr: 'Espagnol',
    en: 'Spanish',
    es: 'Español',
    ja: 'スペイン語',
    'zh-Hans': '西班牙语',
    'zh-Hant': '西班牙語',
  },
  ja: {
    fr: 'Japonais',
    en: 'Japanese',
    es: 'Japonés',
    ja: '日本語',
    'zh-Hans': '日语',
    'zh-Hant': '日語',
  },
  'zh-Hans': {
    fr: 'Chinois simplifié',
    en: 'Simplified Chinese',
    es: 'Chino simplificado',
    ja: '中国語（簡体）',
    'zh-Hans': '简体中文',
    'zh-Hant': '簡體中文',
  },
  'zh-Hant': {
    fr: 'Chinois traditionnel',
    en: 'Traditional Chinese',
    es: 'Chino tradicional',
    ja: '中国語（繁体）',
    'zh-Hans': '繁体中文',
    'zh-Hant': '繁體中文',
  },
  en: {
    fr: 'Anglais',
    en: 'English',
    es: 'Inglés',
    ja: '英語',
    'zh-Hans': '英语',
    'zh-Hant': '英語',
  },
};

/** Returns the full `Translations` row for a language code. */
export function languageNameFor(code: Language): Required<Translations> {
  return LANGUAGE_NAMES[code];
}
