import { useState, useEffect, useRef } from 'react';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';

interface DictDefinition {
  definition: string;
  example?: string;
}

interface DictMeaning {
  partOfSpeech: string;
  definitions: DictDefinition[];
}

interface DictEntry {
  word: string;
  meanings: DictMeaning[];
}

const cache = new Map<string, string[]>();

export function extractExamples(data: unknown): string[] {
  return pipe(
    O.fromNullable(data),
    O.filter(Array.isArray),
    O.map(arr =>
      (arr as DictEntry[])
        .flatMap(e => e.meanings ?? [])
        .flatMap(m => m.definitions ?? [])
        .map(d => d.example)
        .filter((ex): ex is string => typeof ex === 'string' && ex.length > 0)
        .slice(0, 3)
    ),
    O.getOrElse((): string[] => []),
  );
}

export function useDictionaryExamples(word: string | null): {
  examples: string[];
  loading: boolean;
} {
  const [examples, setExamples] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();

    if (word === null) {
      setLoading(false);
      setExamples([]);
      return;
    }

    if (cache.has(word)) {
      setLoading(false);
      setExamples(cache.get(word)!);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setExamples([]);

    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
      signal: controller.signal,
    })
      .then(res => {
        if (!res.ok) return [] as unknown[];
        return res.json();
      })
      .then(data => {
        const extracted = extractExamples(data);
        cache.set(word, extracted);
        setExamples(extracted);
        setLoading(false);
      })
      .catch(err => {
        if (err instanceof Error && err.name === 'AbortError') return;
        cache.set(word, []);
        setExamples([]);
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [word]);

  return { examples, loading };
}
