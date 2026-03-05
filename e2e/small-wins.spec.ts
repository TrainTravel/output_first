import { test, expect } from '@playwright/test';
import { setFrenchLanguage, injectMockSession, mockAuthRoutes } from './helpers/mocks';

test.describe('Small Wins', () => {
  test.beforeEach(async ({ page }) => {
    await setFrenchLanguage(page);
    await injectMockSession(page);
    await mockAuthRoutes(page);
    await page.goto('/');
  });

  test('HomeScreen has a Small Wins button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'Petites Victoires / Small Wins' })
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Home → Small Wins → back to Home', async ({ page }) => {
    await page.getByRole('button', { name: 'Petites Victoires / Small Wins' }).click();
    await expect(
      page.getByText(/Petites Victoires.*Small Wins|Small Wins.*Petites Victoires/i)
    ).toBeVisible({ timeout: 5_000 });

    await page.getByRole('button', { name: /Retour|Back/i }).click();
    await expect(
      page.getByRole('button', { name: "Écrire aujourd'hui" })
    ).toBeVisible({ timeout: 5_000 });
  });

  test('can add a win via Enter key', async ({ page }) => {
    await page.getByRole('button', { name: 'Petites Victoires / Small Wins' }).click();
    await expect(page.getByRole('heading', { name: /Petites Victoires/i })).toBeVisible({ timeout: 5_000 });

    const textarea = page.locator('textarea');
    await textarea.fill('Replied to all emails');
    await textarea.press('Enter');

    await expect(page.getByText('Replied to all emails')).toBeVisible({ timeout: 3_000 });
  });

  test('header counter increments after adding a win', async ({ page }) => {
    await page.getByRole('button', { name: 'Petites Victoires / Small Wins' }).click();

    const textarea = page.locator('textarea');
    await textarea.fill('Finished a task');
    await textarea.press('Enter');

    await expect(page.getByText(/1.*victoire|1.*win/i)).toBeVisible({ timeout: 3_000 });
  });

  test('wins persist when navigating away and back', async ({ page }) => {
    await page.getByRole('button', { name: 'Petites Victoires / Small Wins' }).click();

    const textarea = page.locator('textarea');
    await textarea.fill('Got out of bed today');
    await textarea.press('Enter');
    await expect(page.getByText('Got out of bed today')).toBeVisible({ timeout: 3_000 });

    // Navigate back to home then re-open
    await page.getByRole('button', { name: /Retour|Back/i }).click();
    await page.getByRole('button', { name: 'Petites Victoires / Small Wins' }).click();

    // Counter should still show 1
    await expect(page.getByText(/1.*victoire|1.*win/i)).toBeVisible({ timeout: 3_000 });
  });
});
