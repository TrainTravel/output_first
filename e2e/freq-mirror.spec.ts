import { test, expect } from '@playwright/test';
import { setFrenchLanguage } from './helpers/mocks';

const VOCAB_KEY = 'outputfirst_emotion_vocab';
const DISMISS_KEY = 'outputfirst_freq_mirror_dismissed';

function isoToday(): string {
  return new Date().toISOString().split('T')[0];
}

/** Seed the emotion vocab + clear any prior dismissals before page load. */
async function seedOverUsedTired(page: import('@playwright/test').Page, count = 6) {
  await page.addInitScript(
    ({ key, dismissKey, today, count }) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          encountered: ['tired'],
          used: { tired: count },
          lastSeen: { tired: today },
        }),
      );
      localStorage.removeItem(dismissKey);
    },
    { key: VOCAB_KEY, dismissKey: DISMISS_KEY, today: isoToday(), count },
  );
}

test.describe('HomeScreen — EmotionFrequencyNudge', () => {
  test.beforeEach(async ({ page }) => {
    await setFrenchLanguage(page);
  });

  test('nudge is visible when a vague word is over-used recently', async ({ page }) => {
    await seedOverUsedTired(page, 6);
    await page.goto('/');
    const card = page.locator('[data-testid="freq-mirror-nudge"]');
    await expect(card).toBeVisible();
    await expect(card).toContainText('tired');
    await expect(card).toContainText('6');
  });

  test('clicking dismiss hides the card', async ({ page }) => {
    await seedOverUsedTired(page, 6);
    await page.goto('/');
    await expect(page.locator('[data-testid="freq-mirror-nudge"]')).toBeVisible();
    await page.locator('[data-testid="freq-mirror-dismiss"]').click();
    await expect(page.locator('[data-testid="freq-mirror-nudge"]')).toBeHidden();
  });

  test('dismissed state persists across reload (14-day suppression)', async ({ page }) => {
    await seedOverUsedTired(page, 6);
    await page.goto('/');
    await page.locator('[data-testid="freq-mirror-dismiss"]').click();
    await expect(page.locator('[data-testid="freq-mirror-nudge"]')).toBeHidden();

    await page.reload();
    await expect(page.locator('[data-testid="freq-mirror-nudge"]')).toBeHidden();
  });

  test('nudge does not render when no vocab is seeded', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="freq-mirror-nudge"]')).toBeHidden();
  });
});
