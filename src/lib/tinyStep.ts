/**
 * Pure logic for the Tiny-Step Contract confidence loop.
 * Kept free of React so it can be unit-tested directly.
 */

export const CONFIDENCE_THRESHOLD = 8;
/** After this many shrink rounds we stop offering more and let the user land softly. */
export const MAX_SHRINK_ROUNDS = 3;

export type TinyStepPhase = 'name' | 'rate' | 'shrink' | 'saved' | 'stuck';

export interface TinyStepState {
  originalStep: string;
  originalConfidence: number | null;
  currentStep: string;
  currentConfidence: number | null;
  rounds: number;
  phase: TinyStepPhase;
}

export function initTinyStep(step: string): TinyStepState {
  return {
    originalStep: step,
    originalConfidence: null,
    currentStep: step,
    currentConfidence: null,
    rounds: 0,
    phase: 'rate',
  };
}

/** Apply a confidence rating. Clears at 8+, otherwise loops into shrink (or stuck). */
export function rate(state: TinyStepState, confidence: number): TinyStepState {
  const next: TinyStepState = {
    ...state,
    currentConfidence: confidence,
    originalConfidence: state.originalConfidence ?? confidence,
  };
  if (confidence >= CONFIDENCE_THRESHOLD) {
    return { ...next, phase: 'saved' };
  }
  if (state.rounds >= MAX_SHRINK_ROUNDS) {
    return { ...next, phase: 'stuck' };
  }
  return { ...next, phase: 'shrink' };
}

/** The user picked (or wrote) a smaller version — back to rating. */
export function shrinkTo(state: TinyStepState, smallerStep: string): TinyStepState {
  return {
    ...state,
    currentStep: smallerStep,
    currentConfidence: null,
    rounds: state.rounds + 1,
    phase: 'rate',
  };
}

/** "This is small enough" — keep it as-is, no judgment. */
export function acceptAsIs(state: TinyStepState): TinyStepState {
  return { ...state, phase: 'saved' };
}

export function isFinalRound(state: TinyStepState): boolean {
  return state.rounds >= MAX_SHRINK_ROUNDS;
}
