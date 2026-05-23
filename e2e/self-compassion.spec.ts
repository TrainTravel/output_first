import { test, expect } from '@playwright/test';
import {
  setFrenchLanguage,
  injectMockSession,
  mockAuthRoutes,
  setupJournalMocks,
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

// ---- ProgressScreen: SelfCompassionPractice ----

test.describe('ProgressScreen — SelfCompassionPractice', () => {
  test.beforeEach(async ({ page }) => {
    await setFrenchLanguage(page);
    await page.goto('/');
  });

  test('practice trigger is visible on ProgressScreen, content collapsed by default', async ({ page }) => {
    // Navigate to ProgressScreen by clicking the compact progress card
    await page.locator('button').filter({ hasText: /mots/ }).first().click();

    await expect(page.locator('[data-testid="compassion-practice"]')).toBeVisible();
    await expect(page.locator('[data-testid="compassion-practice-content"]')).toBeHidden();
  });

  test('clicking trigger expands the practice card', async ({ page }) => {
    await page.locator('button').filter({ hasText: /mots/ }).first().click();

    // Open the collapsible
    await page.locator('[data-testid="compassion-practice"]').click();

    await expect(page.locator('[data-testid="compassion-practice-content"]')).toBeVisible();
    // A phrase should be shown
    await expect(page.locator('[data-testid="compassion-practice-content"]')).not.toBeEmpty();
  });
});

// ---- ReflectionScreen: SelfCompassionPractice ----

test.describe('ReflectionScreen — SelfCompassionPractice', () => {
  test('compassion card state on ReflectionScreen matches selected emotion', async ({ page }) => {
    await setFrenchLanguage(page);
    await injectMockSession(page);
    await mockAuthRoutes(page);
    await setupJournalMocks(page);
    await page.goto('/');

    // Navigate through journal flow
    await page.getByRole('button', { name: "Écrire aujourd'hui" }).click({ force: true });
    await page.getByRole('button', { name: 'Je suis prêt(e)' }).click({ timeout: 12_000 });
    await page.getByRole('button', { name: /Je sais ce que j'écris/ }).click();
    await page.getByPlaceholder('Écrivez ici...').fill("Je me sens vraiment épuisé aujourd'hui.");
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Feedback screen
    await expect(page.getByText('Un moment de clarté')).toBeVisible({ timeout: 8_000 });
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Emotions screen — find a struggling emotion if available, else fall back
    await expect(page.getByText('Un mot pour ce que vous ressentez')).toBeVisible({ timeout: 5_000 });

    const hardEmotionWords = ['tired', 'weary', 'drained', 'overwhelmed', 'nervous', 'scattered', 'stuck', 'irritated', 'restless', 'low'];
    let selectedHardEmotion = false;

    for (const en of hardEmotionWords) {
      const btn = page.locator('button').filter({ hasText: `(${en})` });
      if (await btn.count() > 0) {
        await btn.click();
        selectedHardEmotion = true;
        break;
      }
    }

    if (!selectedHardEmotion) {
      // Fall back to first available emotion (will be peaceful — test the negative case)
      await page.locator('button').filter({ hasText: /\([\w-]+\)/ }).first().click();
    }

    await page.getByRole('button', { name: 'Continuer' }).click();

    // ReflectionScreen: wait for reflection to load
    await expect(page.getByText('It sounds like you are carrying a lot right now.')).toBeVisible({ timeout: 8_000 });

    if (selectedHardEmotion) {
      // After 2.5s delay, compassion card should be open by default
      await expect(page.locator('[data-testid="compassion-practice-content"]')).toBeVisible({ timeout: 10_000 });
    } else {
      // No struggling emotion → compassion card not rendered (showQuestion section has no card)
      // Wait for showQuestion to appear (question text becomes visible)
      await expect(page.getByText('What is one small thing that felt manageable today?')).toBeVisible({ timeout: 10_000 });
      await expect(page.locator('[data-testid="compassion-practice-content"]')).toBeHidden();
    }
  });
});
