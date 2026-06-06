import { test, expect } from '@playwright/test';
import { setFrenchLanguage, mockFeedback, injectMockSession, mockAuthRoutes, expandMoreTools, suppressPhilosopherQuoteDialog, chooseBreatheOnCenterChoice } from './helpers/mocks';

async function setupAndOpenPromptChoice(page: Parameters<typeof mockFeedback>[0]) {
  await setFrenchLanguage(page);
  await injectMockSession(page);
  await mockAuthRoutes(page);
  await mockFeedback(page);
  await page.route('**/functions/v1/reflection', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ reflection: 'Good.', question: 'How do you feel?' }),
    })
  );
  await page.clock.install({ now: Date.now() });
  await page.goto('/');

  await page.getByRole('button', { name: "Écrire aujourd'hui" }).click({ force: true });
  await chooseBreatheOnCenterChoice(page);
  await expect(page.getByText('Inspirez...')).toBeVisible({ timeout: 5_000 });
  await page.clock.fastForward(10_000);
  await page.getByRole('button', { name: 'Je suis prêt(e)' }).click();
  await expect(page.getByText("Je sais ce que j'écris")).toBeVisible({ timeout: 5_000 });
}

test.describe('PromptChoiceScreen', () => {
  test('shows two choice buttons after breathe', async ({ page }) => {
    await setupAndOpenPromptChoice(page);
    await expect(page.getByText("Je sais ce que j'écris")).toBeVisible();
    await expect(page.getByText("J'ai besoin d'inspiration")).toBeVisible();
  });

  test('direct write goes to WriteScreen with empty textarea', async ({ page }) => {
    await setupAndOpenPromptChoice(page);
    await page.getByText("Je sais ce que j'écris").click();

    await expect(page.getByPlaceholder('Écrivez ici...')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByPlaceholder('Écrivez ici...')).toHaveValue('');
  });

  test('inspiration path opens prompt library with category headings', async ({ page }) => {
    await setupAndOpenPromptChoice(page);
    await page.getByText("J'ai besoin d'inspiration").click();

    // Library shows FR category labels
    await expect(page.getByText('Émotions')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Quotidien')).toBeVisible();
    await expect(page.getByText('Défis')).toBeVisible();
  });

  test('picking a template pre-fills WriteScreen textarea', async ({ page }) => {
    await setupAndOpenPromptChoice(page);
    await page.getByText("J'ai besoin d'inspiration").click();

    await expect(page.getByText('Émotions')).toBeVisible({ timeout: 5_000 });

    // Click the first template card (contains ___ blanks)
    const firstCard = page.locator('button').filter({ hasText: /___/ }).first();
    await firstCard.click();

    const textarea = page.getByPlaceholder('Écrivez ici...');
    await expect(textarea).toBeVisible({ timeout: 5_000 });
    // Template should have been pre-filled (not empty)
    const value = await textarea.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });
});

test.describe('Free write flow', () => {
  test.beforeEach(async ({ page }) => {
    await setFrenchLanguage(page);
    await injectMockSession(page);
    await mockAuthRoutes(page);
    // The "submit → complete screen" test lands on ProgressScreen + the
    // PhilosopherQuoteDialog modal, whose aria-hidden overlay masks the
    // underlying buttons from a11y queries. Suppress for the day.
    await suppressPhilosopherQuoteDialog(page);
    await page.goto('/');
    // Free Write lives under the collapsed "More tools" expander on HomeScreen.
    await expandMoreTools(page);
  });

  test('free write button visible on home screen', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Écrire librement/ })).toBeVisible();
  });

  // The "Écrire librement" home button now opens a FreeWriteChoiceScreen
  // (Plain "Écriture libre" vs guided "Écriture expressive") before the
  // FreeWriteScreen itself.
  async function openPlainFreeWrite(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
    await page.getByRole('button', { name: /Écrire librement/ }).click();
    await page.getByRole('button', { name: /Écriture libre/ }).click();
  }

  test('free write goes directly to FreeWriteScreen without breathe', async ({ page }) => {
    await openPlainFreeWrite(page);

    await expect(page.getByPlaceholder('Écrivez ce qui vous vient...')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Inspirez...')).not.toBeVisible();
  });

  test('word counter updates as user types', async ({ page }) => {
    await openPlainFreeWrite(page);

    const textarea = page.getByPlaceholder('Écrivez ce qui vous vient...');
    await expect(textarea).toBeVisible({ timeout: 5_000 });

    await textarea.fill('un deux trois quatre cinq');
    // Word counter shows count + "mots"
    await expect(page.getByText(/5\s*mots/)).toBeVisible();
  });

  test('free write submit skips emotions/reflection/gratitude and reaches complete screen', async ({ page }) => {
    await openPlainFreeWrite(page);

    const textarea = page.getByPlaceholder('Écrivez ce qui vous vient...');
    await expect(textarea).toBeVisible({ timeout: 5_000 });
    await textarea.fill('Une pensée libre du jour.');

    await page.getByRole('button', { name: 'Terminer' }).click();

    // Lands on ProgressScreen (complete step) — "Retour à l'accueil" is always present
    await expect(page.getByRole('button', { name: /Retour à l'accueil|Return home/ })).toBeVisible({ timeout: 5_000 });
    // Did NOT pass through emotions screen
    await expect(page.getByText('Un mot pour ce que vous ressentez')).not.toBeVisible();
  });
});
