import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDictionaryExamples, extractExamples } from './useDictionaryExamples';

const VALID_API_RESPONSE = [
  {
    word: 'content',
    meanings: [
      {
        partOfSpeech: 'adjective',
        definitions: [
          { definition: 'Satisfied', example: 'She felt content with her progress.' },
          { definition: 'Peaceful', example: 'A content smile spread across his face.' },
          { definition: 'Willing', example: 'He was content to wait.' },
          { definition: 'Untroubled', example: 'Content people rarely complain.' }, // 4th — excluded
        ],
      },
    ],
  },
];

describe('extractExamples (pure function)', () => {
  it('returns up to 3 examples from a valid DictEntry array', () => {
    const result = extractExamples(VALID_API_RESPONSE);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('She felt content with her progress.');
    expect(result[1]).toBe('A content smile spread across his face.');
    expect(result[2]).toBe('He was content to wait.');
  });

  it('returns [] for an empty array', () => {
    expect(extractExamples([])).toEqual([]);
  });

  it('returns [] for null', () => {
    expect(extractExamples(null)).toEqual([]);
  });

  it('returns [] for non-array input', () => {
    expect(extractExamples({ word: 'test' })).toEqual([]);
  });

  it('skips definitions without an example field', () => {
    const data = [{ word: 'x', meanings: [{ partOfSpeech: 'noun', definitions: [{ definition: 'no example' }] }] }];
    expect(extractExamples(data)).toEqual([]);
  });
});

describe('useDictionaryExamples (hook)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns {examples: [], loading: false} immediately for null word without fetching', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { result } = renderHook(() => useDictionaryExamples(null));

    expect(result.current.examples).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('extracts up to 3 examples from a valid API response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(VALID_API_RESPONSE),
    } as unknown as Response);

    const { result } = renderHook(() => useDictionaryExamples('peaceful'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.examples).toHaveLength(3);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain('peaceful');
  });

  it('returns [] on 404 response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
    } as unknown as Response);

    const { result } = renderHook(() => useDictionaryExamples('on-edge'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.examples).toEqual([]);
  });

  it('returns [] on malformed JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => { throw new SyntaxError('Unexpected token'); },
    } as unknown as Response);

    const { result } = renderHook(() => useDictionaryExamples('brokenword'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.examples).toEqual([]);
  });
});
