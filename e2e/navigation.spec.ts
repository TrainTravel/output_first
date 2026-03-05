import { test, expect } from '@playwright/test';
import {
  setFrenchLanguage,
  injectMockSession,
  mockAuthRoutes,
  mockThoughts,
} from './helpers/mocks';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setFrenchLanguage(page);
    await injectMockSession(page);
    await mockAuthRoutes(page);
    await mockThoughts(page);
    await page.goto('/');
  });

  test('Home → Brain Dump → back to Home', async ({ page }) => {
    await page.getByRole('button', { name: 'Vide-tête / Brain Dump' }).click();
    await expect(
      page.getByText(/Vide-tête.*Brain Dump|Brain Dump.*Vide-tête/i)
    ).toBeVisible({ timeout: 5_000 });

    await page.getByRole('button', { name: /Retour|Back/i }).click();
    await expect(
      page.getByRole('button', { name: "Écrire aujourd'hui" })
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Home → Thought Garden → back to Home', async ({ page }) => {
    await page.getByRole('button', { name: 'Jardin de pensées / Thought Garden' }).click();
    await expect(
      page.getByText(/Jardin de pensées|Thought Garden/i)
    ).toBeVisible({ timeout: 5_000 });

    await page.getByRole('button', { name: /Retour|Back/i }).click();
    await expect(
      page.getByRole('button', { name: "Écrire aujourd'hui" })
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Home → Progress (via progress card) → back to Home', async ({ page }) => {
    // The progress card is a <button> containing streak/days stats — click it
    await page.getByText(/Série|Streak|Racha/i).click();
    // ProgressScreen shows streak stat
    await expect(page.getByText(/jours de suite/i)).toBeVisible({ timeout: 5_000 });

    await page.getByRole('button', { name: /Retour à l'accueil|Return home|Volver al inicio/i }).click();
    await expect(
      page.getByRole('button', { name: "Écrire aujourd'hui" })
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Home → Write (start journal) → back button returns to Home', async ({ page }) => {
    await page.route('**/functions/v1/french-feedback', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    );
    // force bypasses animate-breathe CSS instability
    await page.getByRole('button', { name: "Écrire aujourd'hui" }).click({ force: true });
    // Breathe screen or write screen should appear
    const onBreathe = await page.getByText('Inspirez...').isVisible().catch(() => false);
    const onWrite = await page.getByPlaceholder('Écrivez ici...').isVisible().catch(() => false);
    expect(onBreathe || onWrite).toBeTruthy();

    await page.getByRole('button', { name: /Retour|Back/i }).click();
    await expect(
      page.getByRole('button', { name: "Écrire aujourd'hui" })
    ).toBeVisible({ timeout: 5_000 });
  });
});
