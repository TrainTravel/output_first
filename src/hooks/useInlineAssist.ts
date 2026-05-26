import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

export interface InlineSuggestion {
  type: 'l1' | 'vague';
  original: string;
  suggestions: Array<{ fr?: string; zh?: string; pinyin?: string; nuance: string }>;
}

const DEBOUNCE_MS = 1500;
const MIN_WORDS = 3;

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return String(hash);
}

export function useInlineAssist(text: string) {
  const [suggestions, setSuggestions] = useState<InlineSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<Map<string, InlineSuggestion[]>>(new Map());
  const abortRef = useRef<AbortController | null>(null);
  const { targetLang, primaryLang } = useLanguage();
  const isZh = targetLang === 'zh-Hans' || targetLang === 'zh-Hant';
  const zhVariant: 'Hans' | 'Hant' | null =
    targetLang === 'zh-Hans' ? 'Hans' : targetLang === 'zh-Hant' ? 'Hant' : null;

  useEffect(() => {
    const wordCount = text.trim().split(/\s+/).length;
    if (!text.trim() || wordCount < MIN_WORDS) {
      setSuggestions([]);
      return;
    }

    const hash = simpleHash(text.trim());
    const cached = cacheRef.current.get(hash);
    if (cached) {
      setSuggestions(cached);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const body: Record<string, unknown> = {
          text: text.trim(),
          type: 'inline-assist',
          targetLang,
          lang: targetLang, // legacy field, kept for forward-compat with older deployments
          primaryLang,
        };
        if (isZh) body.variant = zhVariant;

        const { data, error } = await supabase.functions.invoke('language-feedback', { body });

        if (controller.signal.aborted) return;

        if (error) {
          console.error('Inline assist error:', error);
          setSuggestions([]);
          return;
        }

        const result: InlineSuggestion[] = [];

        if (data?.l1Words) {
          for (const item of data.l1Words) {
            result.push({
              type: 'l1',
              original: item.original,
              suggestions: item.suggestions || [],
            });
          }
        }

        if (data?.vagueWords) {
          for (const item of data.vagueWords) {
            result.push({
              type: 'vague',
              original: item.original,
              suggestions: item.upgrades || [],
            });
          }
        }

        cacheRef.current.set(hash, result);
        setSuggestions(result);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          console.error('Inline assist fetch error:', err);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [text, targetLang, primaryLang, isZh, zhVariant]);

  return { suggestions, loading };
}
