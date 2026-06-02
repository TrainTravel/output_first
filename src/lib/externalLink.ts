import { Browser } from '@capacitor/browser';
import { isNative } from './native';

/**
 * Open an external HTTP(S) URL.
 *
 * Native (iOS via Capacitor): opens in an in-app SFSafariViewController
 * overlay so the user stays inside OutputFirst with swipe-to-dismiss.
 *
 * Web: opens a new tab with `noopener,noreferrer` to prevent reverse
 * tabnabbing.
 *
 * Fail-open on plugin error so a misbehaving native shell never breaks
 * the tap interaction.
 */
export async function openExternal(url: string): Promise<void> {
  if (!url) return;
  if (isNative()) {
    try { await Browser.open({ url }); return; }
    catch { /* fall through to web fallback */ }
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Trigger a mailto: link. iOS/Capacitor and every browser hands mailto:
 * to the OS, which opens the default mail client. Using `location.href`
 * (not `window.open`) avoids a stray blank tab on web.
 */
export function openMailto(email: string, subject?: string): void {
  if (!email) return;
  const qs = subject ? `?subject=${encodeURIComponent(subject)}` : '';
  window.location.href = `mailto:${email}${qs}`;
}
