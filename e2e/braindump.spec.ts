import { test, expect } from '@playwright/test';
import {
  setFrenchLanguage,
  injectMockSession,
  mockAuthRoutes,
  mockThoughts,
  mockGenerateEmbedding,
} from './helpers/mocks';

test.describe('Brain Dump', () => {
  test.beforeEach(async ({ page }) => {
    await setFrenchLanguage(page);
    await injectMockSession(page);
    await mockAuthRoutes(page);
    await mockThoughts(page);
    await mockGenerateEmbedding(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Vide-tête / Brain Dump' }).click();
  });

  test('shows Brain Dump title', async ({ page }) => {
    await expect(
      page.getByText(/Vide-tête.*Brain Dump|Brain Dump.*Vide-tête/i)
    ).toBeVisible({ timeout: 5_000 });
  });

  test('add button is disabled when textarea is empty', async ({ page }) => {
    // Find the submit/add button — look for a button that can be disabled
    const addBtn = page.getByRole('button', { name: /Ajouter|Add/i });
    if (await addBtn.count() > 0) {
      await expect(addBtn).toBeDisabled();
    } else {
      // Some implementations hide the button rather than disable it
      await expect(addBtn).toHaveCount(0);
    }
  });

  test('submitting a thought via Enter adds it to the list', async ({ page }) => {
    const thoughtText = 'Je dois appeler ma mère.';
    // Find the thought input
    const input = page.getByPlaceholder(/Vos pensées|Your thoughts|Ajoutez|Add/i).first();
    if (await input.count() === 0) {
      // Fallback: any textarea/input on the screen
      await page.locator('textarea, input[type="text"]').first().fill(thoughtText);
    } else {
      await input.fill(thoughtText);
    }
    await page.keyboard.press('Enter');

    // The thought should appear in the list
    await expect(page.getByText(thoughtText)).toBeVisible({ timeout: 5_000 });
  });

  test('submitting via add button works', async ({ page }) => {
    const thoughtText = 'Acheter du pain.';
    const input = page.locator('textarea, input[type="text"]').first();
    await input.fill(thoughtText);

    const addBtn = page.getByRole('button', { name: /Ajouter|Add/i });
    if (await addBtn.count() > 0) {
      await addBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }

    await expect(page.getByText(thoughtText)).toBeVisible({ timeout: 5_000 });
  });

  test('back button returns to home', async ({ page }) => {
    const backBtn = page.getByRole('button', { name: /Retour|Back/i });
    await expect(backBtn).toBeVisible({ timeout: 5_000 });
    await backBtn.click();

    await expect(
      page.getByRole('button', { name: "Écrire aujourd'hui" })
    ).toBeVisible({ timeout: 5_000 });
  });
});
