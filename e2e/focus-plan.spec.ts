import { test, expect } from '@playwright/test';
import { setFrenchLanguage } from './helpers/mocks';

// Helper: navigate from home to FocusPlan screen
async function goToFocusPlan(page: Parameters<typeof setFrenchLanguage>[0]) {
  await page.getByRole('button', { name: /Un truc à la fois/ }).click();
  await expect(page.getByText('Sur quoi est-ce que tu butines ?')).toBeVisible({ timeout: 5_000 });
}

test.describe('FocusPlanScreen — no clock', () => {
  test.beforeEach(async ({ page }) => {
    await setFrenchLanguage(page);
    await page.goto('/');
  });

  test('Home → FocusPlan → back to Home', async ({ page }) => {
    await goToFocusPlan(page);
    await page.getByRole('button', { name: 'Retour' }).click();
    await expect(page.getByRole('button', { name: "Écrire aujourd'hui" })).toBeVisible();
  });

  test('Just Start → running phase with no label', async ({ page }) => {
    await goToFocusPlan(page);
    await page.getByRole('button', { name: 'Juste commencer' }).click();

    // Running phase shows "+5 min" and "Laisser tomber"
    await expect(page.getByRole('button', { name: '+5 min' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Laisser tomber' })).toBeVisible();

    // No task label visible (empty label)
    await expect(page.getByText('Sur quoi est-ce que tu butines ?')).not.toBeVisible();
  });

  test('Keep This → typed label visible in running phase', async ({ page }) => {
    await goToFocusPlan(page);
    await page.locator('textarea').fill('Ouvrir mon ordinateur');
    await page.getByRole('button', { name: 'Garder ça' }).click();

    // Label should appear in running phase
    await expect(page.getByText('Ouvrir mon ordinateur')).toBeVisible();
    await expect(page.getByRole('button', { name: '+5 min' })).toBeVisible();
  });

  test('Enter key triggers Keep This', async ({ page }) => {
    await goToFocusPlan(page);
    await page.locator('textarea').fill('Mettre mes chaussures');
    await page.locator('textarea').press('Enter');

    // Should now be in running phase
    await expect(page.getByRole('button', { name: '+5 min' })).toBeVisible();
    await expect(page.getByText('Mettre mes chaussures')).toBeVisible();
  });

  test('"Garder ça" absent when empty, appears when non-empty', async ({ page }) => {
    await goToFocusPlan(page);

    // Initially absent
    await expect(page.getByRole('button', { name: 'Garder ça' })).not.toBeVisible();

    // Type something — button should appear
    await page.locator('textarea').fill('test');
    await expect(page.getByRole('button', { name: 'Garder ça' })).toBeVisible();

    // Clear — button should disappear
    await page.locator('textarea').fill('');
    await expect(page.getByRole('button', { name: 'Garder ça' })).not.toBeVisible();
  });

  test('"Laisser tomber" → entry phase with textarea and "Juste commencer"', async ({ page }) => {
    await goToFocusPlan(page);
    await page.getByRole('button', { name: 'Juste commencer' }).click();
    await expect(page.getByRole('button', { name: 'Laisser tomber' })).toBeVisible();

    await page.getByRole('button', { name: 'Laisser tomber' }).click();

    // Back to entry phase
    await expect(page.locator('textarea')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Juste commencer' })).toBeVisible();
  });
});

test.describe('FocusPlanScreen — clock control', () => {
  async function setupWithClock(page: Parameters<typeof setFrenchLanguage>[0]) {
    await page.addInitScript(() => {
      localStorage.setItem('outputfirst_language', 'fr');
    });
    await page.clock.install({ now: Date.now() });
    await page.goto('/');
  }

  test('timer completes → done phase shows "C\'est fait."', async ({ page }) => {
    await setupWithClock(page);
    await goToFocusPlan(page);
    await page.getByRole('button', { name: 'Juste commencer' }).click();
    await expect(page.getByRole('button', { name: '+5 min' })).toBeVisible();

    await page.clock.fastForward(5 * 60 * 1000 + 1000);

    await expect(page.getByText("C'est fait.")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: 'Encore 5 min' })).toBeVisible();
  });

  test('"Encore 5 min" from done → running phase', async ({ page }) => {
    await setupWithClock(page);
    await goToFocusPlan(page);
    await page.getByRole('button', { name: 'Juste commencer' }).click();
    await page.clock.fastForward(5 * 60 * 1000 + 1000);
    await expect(page.getByText("C'est fait.")).toBeVisible({ timeout: 5_000 });

    await page.getByRole('button', { name: 'Encore 5 min' }).click();

    // Back to running phase
    await expect(page.getByRole('button', { name: '+5 min' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Laisser tomber' })).toBeVisible();
  });

  test('"Retour" from done → Home', async ({ page }) => {
    await setupWithClock(page);
    await goToFocusPlan(page);
    await page.getByRole('button', { name: 'Juste commencer' }).click();
    await page.clock.fastForward(5 * 60 * 1000 + 1000);
    await expect(page.getByText("C'est fait.")).toBeVisible({ timeout: 5_000 });

    // Click the "Retour" button in the done phase (the full-width one)
    await page.getByRole('button', { name: 'Retour' }).last().click();

    // Should be back on home
    await expect(page.getByRole('button', { name: "Écrire aujourd'hui" })).toBeVisible();
  });
});
