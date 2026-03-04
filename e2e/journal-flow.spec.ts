import { test, expect } from '@playwright/test';
import { setFrenchLanguage, setupJournalMocks } from './helpers/mocks';

test.describe('Journal flow - happy path', () => {
  test.beforeEach(async ({ page }) => {
    await setFrenchLanguage(page);
    await setupJournalMocks(page);
    await page.goto('/');
  });

  test('completes journal from home to complete screen', async ({ page }) => {
    // 1. Start journal (force bypasses animate-breathe CSS instability)
    await page.getByRole('button', { name: "Écrire aujourd'hui" }).click({ force: true });

    // 2. BreatheScreen — wait for the "ready" button to become active
    await expect(page.getByText('Inspirez...')).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole('button', { name: 'Je suis prêt(e)' })
    ).toBeVisible({ timeout: 12_000 });
    await page.getByRole('button', { name: 'Je suis prêt(e)' }).click({ timeout: 12_000 });

    // 3. WriteScreen — type and continue
    const textarea = page.getByPlaceholder('Écrivez ici...');
    await expect(textarea).toBeVisible();
    await textarea.fill("Aujourd'hui j'ai passé une bonne journée.");
    await page.getByRole('button', { name: 'Continuer' }).click();

    // 4. FeedbackScreen — always shows "Continuer"
    await expect(page.getByText('Un moment de clarté')).toBeVisible({ timeout: 8_000 });
    await page.getByRole('button', { name: 'Continuer' }).click();

    // 5. EmotionsScreen
    await expect(
      page.getByText('Un mot pour ce que vous ressentez')
    ).toBeVisible({ timeout: 5_000 });
    // Click first available emotion pill (words rotate daily — avoid hardcoding specific words)
    await page.locator('button').filter({ hasText: /\(.+\)/ }).first().click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // 6. ReflectionScreen — loading then question appears
    await expect(
      page.getByText(
        'What is one small thing that felt manageable today?'
      )
    ).toBeVisible({ timeout: 8_000 });
    // Choose "Non, gratitude" to skip to gratitude step
    await page.getByRole('button', { name: /Non, gratitude/ }).click();

    // 7. GratitudeScreen
    const gratitudeTextarea = page.getByPlaceholder('Quelque chose de petit suffit...');
    await expect(gratitudeTextarea).toBeVisible({ timeout: 5_000 });
    await gratitudeTextarea.fill('Je suis reconnaissant(e) pour le soleil.');
    await page.getByRole('button', { name: 'Terminer le journal' }).click();

    // 8. CompleteScreen
    await expect(
      page.getByText("Vous êtes venu(e) aujourd'hui")
    ).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: "Retour à l'accueil" }).click();

    // Back on home — after journaling the CTA becomes "Écrire encore"
    await expect(page.getByRole('button', { name: "Écrire encore" })).toBeVisible();
  });

  test('can skip gratitude and still reach complete screen', async ({ page }) => {
    await page.getByRole('button', { name: "Écrire aujourd'hui" }).click({ force: true });

    // Wait for breathe button (up to 12s)
    await page.getByRole('button', { name: 'Je suis prêt(e)' }).click({ timeout: 12_000 });

    const textarea = page.getByPlaceholder('Écrivez ici...');
    await textarea.fill('Un texte quelconque.');
    await page.getByRole('button', { name: 'Continuer' }).click();

    await expect(page.getByText('Un moment de clarté')).toBeVisible({ timeout: 8_000 });
    await page.getByRole('button', { name: 'Continuer' }).click();

    await page.locator('button').filter({ hasText: /\(.+\)/ }).first().click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    await expect(
      page.getByText('What is one small thing that felt manageable today?')
    ).toBeVisible({ timeout: 8_000 });
    await page.getByRole('button', { name: /Non, gratitude/ }).click();

    await expect(page.getByPlaceholder('Quelque chose de petit suffit...')).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: 'Passer et terminer' }).click();

    await expect(
      page.getByText("Vous êtes venu(e) aujourd'hui")
    ).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('BreatheScreen - clock control', () => {
  test('button becomes clickable after time elapses', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('outputfirst_language', 'fr');
    });

    // Install fake clock BEFORE navigating
    await page.clock.install({ now: Date.now() });
    await page.goto('/');
    // Mock AI calls after navigation (routes persist)
    await page.route('**/functions/v1/french-feedback', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    );

    await page.getByRole('button', { name: "Écrire aujourd'hui" }).click({ force: true });
    await expect(page.getByText('Inspirez...')).toBeVisible({ timeout: 5_000 });

    // Fast-forward 10 seconds so the breathing cycle completes
    await page.clock.fastForward(10_000);

    const readyBtn = page.getByRole('button', { name: 'Je suis prêt(e)' });
    await expect(readyBtn).toBeVisible();
    await expect(readyBtn).toBeEnabled();
    await readyBtn.click();

    // Should advance to WriteScreen
    await expect(page.getByPlaceholder('Écrivez ici...')).toBeVisible({ timeout: 5_000 });
  });
});
