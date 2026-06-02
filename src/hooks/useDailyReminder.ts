import { useState } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { isNative } from '@/lib/native';

const ENABLED_KEY = 'outputfirst_reminder_enabled';
const TIME_KEY = 'outputfirst_reminder_time'; // "HH:mm" 24h
const NOTIFICATION_ID = 1; // single recurring slot — we cancel + re-schedule on every change

/** Default reminder time per CLAUDE.md ADHD-friendly evening anchor. */
const DEFAULT_TIME = '20:00';

interface DailyReminderState {
  /** True when a daily notification is scheduled. */
  enabled: boolean;
  /** "HH:mm" 24-hour. */
  time: string;
  /** Toggle on/off. Requests permission on first enable. Returns false if denied. */
  setEnabled: (next: boolean) => Promise<boolean>;
  /** Change the daily fire time. Re-schedules if currently enabled. */
  setTime: (next: string) => Promise<void>;
}

function readEnabled(): boolean {
  return localStorage.getItem(ENABLED_KEY) === 'true';
}

function readTime(): string {
  const raw = localStorage.getItem(TIME_KEY);
  return raw && /^\d{2}:\d{2}$/.test(raw) ? raw : DEFAULT_TIME;
}

async function scheduleAt(time: string): Promise<void> {
  if (!isNative()) return;
  const [hh, mm] = time.split(':').map(Number);
  try {
    await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });
  } catch { /* ignore — nothing to cancel */ }
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: NOTIFICATION_ID,
          // Intentionally generic — per CLAUDE.md, no streak-loss anxiety,
          // no "you missed yesterday". Just an invitation.
          title: 'OutputFirst',
          body: 'Take 2 minutes for yourself.',
          schedule: {
            on: { hour: hh, minute: mm },
            allowWhileIdle: true,
            repeats: true,
          },
        },
      ],
    });
  } catch (e) {
    // Permission denied or other plugin error — surface to console for
    // debugging but don't throw; caller already gets `false` from setEnabled.
    // eslint-disable-next-line no-console
    console.warn('[notifications] schedule failed', e);
  }
}

async function cancel(): Promise<void> {
  if (!isNative()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });
  } catch { /* ignore */ }
}

/**
 * Daily reminder toggle + scheduler. On native:
 *   - First enable prompts for notification permission.
 *   - Subsequent toggles cancel/reschedule the same NOTIFICATION_ID.
 * On web, all native calls no-op so the toggle still persists for UI tests.
 */
export function useDailyReminder(): DailyReminderState {
  const [enabled, setEnabledState] = useState<boolean>(readEnabled);
  const [time, setTimeState] = useState<string>(readTime);

  const setEnabled = async (next: boolean): Promise<boolean> => {
    if (next) {
      if (isNative()) {
        try {
          const status = await LocalNotifications.requestPermissions();
          if (status.display !== 'granted') {
            // Roll the UI back to OFF — user denied at the OS prompt.
            setEnabledState(false);
            try { localStorage.setItem(ENABLED_KEY, 'false'); } catch { /* quota */ }
            return false;
          }
        } catch { /* permission API itself failed; treat as denied */
          setEnabledState(false);
          try { localStorage.setItem(ENABLED_KEY, 'false'); } catch { /* quota */ }
          return false;
        }
      }
      await scheduleAt(time);
    } else {
      await cancel();
    }
    setEnabledState(next);
    try { localStorage.setItem(ENABLED_KEY, String(next)); } catch { /* quota */ }
    return true;
  };

  const setTime = async (next: string): Promise<void> => {
    if (!/^\d{2}:\d{2}$/.test(next)) return;
    setTimeState(next);
    try { localStorage.setItem(TIME_KEY, next); } catch { /* quota */ }
    if (enabled) await scheduleAt(next);
  };

  return { enabled, time, setEnabled, setTime };
}
