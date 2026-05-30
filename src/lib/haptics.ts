import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNative } from './native';

/**
 * Thin wrapper around @capacitor/haptics. No-ops on web. Fail-open on
 * any error so a missing native permission never breaks UX.
 *
 * Per CLAUDE.md ADHD-friendly principles: haptics are REWARDS, never
 * warnings. Use them on completion / save / streak moments, not on
 * errors or losses.
 */

export async function hapticLight(): Promise<void> {
  if (!isNative()) return;
  try { await Haptics.impact({ style: ImpactStyle.Light }); }
  catch { /* ignore */ }
}

export async function hapticMedium(): Promise<void> {
  if (!isNative()) return;
  try { await Haptics.impact({ style: ImpactStyle.Medium }); }
  catch { /* ignore */ }
}

/** Use on big completions (journal entry done, streak milestone). */
export async function hapticSuccess(): Promise<void> {
  if (!isNative()) return;
  try { await Haptics.notification({ type: NotificationType.Success }); }
  catch { /* ignore */ }
}
