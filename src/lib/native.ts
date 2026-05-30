import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';

/** True when running inside the Capacitor native shell (iOS/Android). */
export const isNative = (): boolean => Capacitor.isNativePlatform();

/**
 * One-shot native bootstrap. Called from main.tsx before React mounts so
 * that the splash-screen hide-out coincides with the React render.
 *
 * - Tags the <html> element with `capacitor-native` so platform-conditional
 *   CSS rules can hide browser-only behavior (long-press select menu, etc.)
 * - Sets the status bar style to match the sage palette.
 * - Configures keyboard to resize the WebView (so textareas aren't covered).
 * - Hides the splash screen as soon as we're ready.
 *
 * All calls fail open: every Capacitor plugin no-ops on web, so this
 * function is safe to call unconditionally from main.tsx.
 */
export async function initNative(): Promise<void> {
  if (!isNative()) return;

  document.documentElement.classList.add('capacitor-native');

  try {
    await StatusBar.setStyle({ style: Style.Dark });
  } catch { /* ignore — best-effort */ }

  try {
    await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
  } catch { /* ignore */ }

  try {
    // Brief delay so the React tree paints before we drop the splash.
    setTimeout(() => SplashScreen.hide().catch(() => undefined), 200);
  } catch { /* ignore */ }
}
