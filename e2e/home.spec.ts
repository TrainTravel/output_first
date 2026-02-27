import { test, expect } from '@playwright/test';
import { setFrenchLanguage } from './helpers/mocks';

test.describe('Home screen', () => {
  test.beforeEach(async ({ page }) => {
    await setFrenchLanguage(page);
    await page.goto('/');
  });

  test('shows app title', async ({ page }) => {
    await expect(page.getByText('OutputFirst')).toBeVisible();
  });

  test('shows "Écrire aujourd\'hui" button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: "Écrire aujourd'hui" })
    ).toBeVisible();
  });

  test('shows "Pas encore" status badge', async ({ page }) => {
    await expect(page.getByText('Pas encore')).toBeVisible();
  });

  test('shows all 4 section navigation buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Vide-tête / Brain Dump' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Jardin de pensées / Thought Garden' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Mes Clusters/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Voir vos progrès' })).toBeVisible();
  });

  test('shows language toggle with "FR"', async ({ page }) => {
    const toggle = page.getByRole('button', { name: 'Toggle language' });
    await expect(toggle).toBeVisible();
    await expect(toggle).toContainText('FR');
  });

  test('shows subtitle with "Journaling en français"', async ({ page }) => {
    await expect(page.getByText(/Journaling en français/i)).toBeVisible();
  });
});
