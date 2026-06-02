import { useState } from 'react';

/**
 * Global engagement counter. Bumped from save-event paths (journal
 * completion, brain-dump add, small-win add). Used by the Support &
 * feedback section in LanguageSettingsScreen to gate visibility behind
 * actual user engagement — no asking for tips or feedback before the
 * user has experienced value.
 *
 * NOT profile-scoped — the dev is being thanked, not the profile. One
 * counter spans every profile on the device.
 *
 * Monotonic. Counts only go up. Read once at mount; the settings
 * screen views on-demand so reactive subscription isn't needed.
 */

const STORAGE_KEY = 'outputfirst_engagement_count';
const FEEDBACK_ELIGIBLE_KEY = 'feedback-eligible';

/** Delay between first-ever engagement and the feedback prompt unlocking. */
export const FEEDBACK_PROMPT_DELAY_MS = 10_000;

/**
 * Window event name. FeedbackWidget subscribes to refresh its visibility
 * reactively once the delayed timer fires — without polling localStorage.
 */
export const FEEDBACK_ELIGIBLE_EVENT = 'outputfirst:feedback-eligible';

export const ENGAGEMENT_FEEDBACK_THRESHOLD = 2;
export const ENGAGEMENT_TIP_JAR_THRESHOLD = 5;

export function readEngagementCount(): number {
  const raw = localStorage.getItem(STORAGE_KEY);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * Increment the engagement counter, and — on the FIRST-EVER tick — schedule
 * the feedback prompt to unlock `FEEDBACK_PROMPT_DELAY_MS` later. The delay
 * gives the user breathing room before being asked anything; an instant
 * prompt would compete with whatever screen they just landed on.
 *
 * Idempotent against repeat scheduling: if `feedback-eligible` is already
 * true (legacy users who hit the widget under prior code), no new timer
 * fires. Monotonic counter always increments.
 */
export function tickEngagement(): void {
  try {
    const prior = readEngagementCount();
    localStorage.setItem(STORAGE_KEY, String(prior + 1));

    const alreadyEligible = localStorage.getItem(FEEDBACK_ELIGIBLE_KEY) === 'true';
    if (prior === 0 && !alreadyEligible) {
      window.setTimeout(() => {
        try {
          localStorage.setItem(FEEDBACK_ELIGIBLE_KEY, 'true');
          window.dispatchEvent(new Event(FEEDBACK_ELIGIBLE_EVENT));
        } catch { /* localStorage unavailable — fail open */ }
      }, FEEDBACK_PROMPT_DELAY_MS);
    }
  } catch { /* localStorage unavailable (private mode / quota) — fail open */ }
}

export function useEngagement(): { count: number } {
  const [count] = useState(readEngagementCount);
  return { count };
}
