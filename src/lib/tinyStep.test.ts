import { describe, it, expect } from 'vitest';
import {
  initTinyStep,
  rate,
  shrinkTo,
  acceptAsIs,
  isFinalRound,
  CONFIDENCE_THRESHOLD,
  MAX_SHRINK_ROUNDS,
} from './tinyStep';

describe('tiny-step confidence machine', () => {
  it('saves straight away at the threshold', () => {
    const s = rate(initTinyStep('Email the landlord'), CONFIDENCE_THRESHOLD);
    expect(s.phase).toBe('saved');
    expect(s.originalConfidence).toBe(8);
    expect(s.finalStepUnchanged ?? s.currentStep).toBe('Email the landlord');
  });

  it('loops into shrink below the threshold', () => {
    const s = rate(initTinyStep('Email the landlord'), 4);
    expect(s.phase).toBe('shrink');
    expect(s.rounds).toBe(0);
  });

  it('keeps the original wording and first rating across shrinks', () => {
    let s = initTinyStep('Clean the whole flat');
    s = rate(s, 3);
    s = shrinkTo(s, 'Clear one shelf');
    s = rate(s, 9);
    expect(s.phase).toBe('saved');
    expect(s.originalStep).toBe('Clean the whole flat');
    expect(s.originalConfidence).toBe(3);
    expect(s.currentStep).toBe('Clear one shelf');
    expect(s.currentConfidence).toBe(9);
  });

  it('lands softly after the final shrink round instead of looping forever', () => {
    let s = initTinyStep('Write the report');
    for (let i = 0; i < MAX_SHRINK_ROUNDS; i++) {
      s = rate(s, 2);
      expect(s.phase).toBe('shrink');
      s = shrinkTo(s, `smaller ${i}`);
    }
    expect(isFinalRound(s)).toBe(true);
    s = rate(s, 2);
    expect(s.phase).toBe('stuck');
  });

  it('lets the user accept a step as small enough', () => {
    let s = rate(initTinyStep('Call the clinic'), 5);
    s = acceptAsIs(s);
    expect(s.phase).toBe('saved');
    expect(s.currentConfidence).toBe(5);
  });
});
