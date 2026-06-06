import { test, expect } from '@playwright/test';
import {
  setFrenchLanguage,
  injectMockSession,
  mockAuthRoutes,
  setupJournalMocks,
  chooseBreatheOnCenterChoice,
} from './helpers/mocks';

// ---- HomeScreen: SelfCompassionSeed ----

test.describe('HomeScreen — SelfCompassionSeed', () => {
  test.beforeEach(async ({ page }) => {
    await setFrenchLanguage(page);
    await page.goto('/');
  });

  test('seed card is visible on first visit', async ({ page }) => {
    await expect(page.locator('[data-testid="compassion-seed"]')).toBeVisible();
  });

  test('dismiss button hides the seed card', async ({ page }) => {
    await page.locator('[data-testid="compassion-seed"]').getByRole('button', { name: 'Dismiss' }).click();
    await expect(page.locator('[data-testid="compassion-seed"]')).toBeHidden();
  });

  test('dismissed state persists after reload', async ({ page }) => {
    // Dismiss the card
    await page.locator('[data-testid="compassion-seed"]').getByRole('button', { name: 'Dismiss' }).click();
    await expect(page.locator('[data-testid="compassion-seed"]')).toBeHidden();

    // Reload — seed should remain hidden (dismissal stored in localStorage)
    await page.reload();
    await expect(page.locator('[data-testid="compassion-seed"]')).toBeHidden();
  });
});

// ---- SelfCompassionScreen — own step between reflection and gratitude ----
//
// The self-compassion practice used to live inline on ReflectionScreen,
// gated by the active emotion. As of feat/selfcompassion-as-own-step it is
// its own step that always appears after the user chooses "No, gratitude"
// (or after MAX_CYCLES). It can be continued or skipped — both paths route
// to GratitudeScreen.

async function driveToReflection(page: import('@playwright/test').Page) {
  await setFrenchLanguage(page);
  await injectMockSession(page);
  await mockAuthRoutes(page);
  await setupJournalMocks(page);
  await page.goto('/');

  await page.getByRole('button', { name: "Écrire aujourd'hui" }).click({ force: true });
  await chooseBreatheOnCenterChoice(page);
  await page.getByRole('button', { name: 'Je suis prêt(e)' }).click({ timeout: 12_000 });
  await page.getByRole('button', { name: /Je sais ce que j'écris/ }).click();
  await page.getByPlaceholder('Écrivez ici...').fill("Je me sens vraiment épuisé aujourd'hui.");
  await page.getByRole('button', { name: 'Continuer' }).click();

  // Feedback → emotions
  await expect(page.getByText('Un moment de clarté')).toBeVisible({ timeout: 8_000 });
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByText('Un mot pour ce que vous ressentez')).toBeVisible({ timeout: 5_000 });
  await page.locator('button').filter({ hasText: /\(.+\)/ }).first().click();
  await page.getByRole('button', { name: 'Continuer' }).click();

  // Reflection — wait for the question to appear so we know we're past loading
  await expect(page.getByText('What is one small thing that felt manageable today?')).toBeVisible({ timeout: 8_000 });
}

test.describe('SelfCompassionScreen — own step', () => {
  test('appears after "Non, gratitude" regardless of emotion picked', async ({ page }) => {
    await driveToReflection(page);
    await page.getByRole('button', { name: /Non, gratitude/ }).click();

    await expect(page.getByTestId('selfcompassion-screen')).toBeVisible({ timeout: 5_000 });
    // The wrapped practice component is the same one that used to be inline.
    await expect(page.locator('[data-testid="compassion-practice"]')).toBeVisible();
  });

  test('Continue button routes to GratitudeScreen', async ({ page }) => {
    await driveToReflection(page);
    await page.getByRole('button', { name: /Non, gratitude/ }).click();
    await expect(page.getByTestId('selfcompassion-screen')).toBeVisible({ timeout: 5_000 });

    await page.getByTestId('selfcompassion-continue').click();

    // GratitudeScreen rendered — placeholder is its hallmark.
    await expect(page.getByPlaceholder('Quelque chose de petit suffit...')).toBeVisible({ timeout: 5_000 });
  });

  test('Skip button also routes to GratitudeScreen', async ({ page }) => {
    await driveToReflection(page);
    await page.getByRole('button', { name: /Non, gratitude/ }).click();
    await expect(page.getByTestId('selfcompassion-screen')).toBeVisible({ timeout: 5_000 });

    await page.getByTestId('selfcompassion-skip').click();

    await expect(page.getByPlaceholder('Quelque chose de petit suffit...')).toBeVisible({ timeout: 5_000 });
  });
});
