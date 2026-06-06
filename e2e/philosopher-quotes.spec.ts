import { test, expect } from '@playwright/test';
import { setFrenchLanguage, setupJournalMocks, injectMockSession, mockAuthRoutes, chooseBreatheOnCenterChoice } from './helpers/mocks';

const ENABLED_KEY = 'outputfirst_quotes_enabled';
const LAST_SHOWN_KEY = 'outputfirst_quotes_last_shown';

async function read(page: import('@playwright/test').Page, key: string) {
  return await page.evaluate(k => localStorage.getItem(k), key);
}

test.describe('Philosopher quote — settings toggle', () => {
  test('toggle defaults to ON (no key set, no value persisted yet)', async ({ page }) => {
    await page.goto('/');
    // Post-Phase-2: Language settings is reached via the ProfileChip dropdown.
    await page.getByRole('button', { name: /Active profile|Profil actif|Perfil activo/ }).click();
    await page.getByRole('menuitem', { name: /Language settings|Réglages de langue/ }).click();

    const toggle = page.getByRole('switch', { name: /Enable daily thought|Activer la pensée du jour/ });
    await expect(toggle).toHaveAttribute('data-state', 'checked');
  });

  test('flipping the toggle persists enabled=false', async ({ page }) => {
    await page.goto('/');
    // Post-Phase-2: Language settings is reached via the ProfileChip dropdown.
    await page.getByRole('button', { name: /Active profile|Profil actif|Perfil activo/ }).click();
    await page.getByRole('menuitem', { name: /Language settings|Réglages de langue/ }).click();

    const toggle = page.getByRole('switch', { name: /Enable daily thought|Activer la pensée du jour/ });
    await toggle.click();

    await expect.poll(() => read(page, ENABLED_KEY)).toBe('false');
    await expect(toggle).toHaveAttribute('data-state', 'unchecked');
  });

  test('pre-seeded enabled=false renders the toggle as unchecked', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('outputfirst_quotes_enabled', 'false'));
    await page.goto('/');
    // Post-Phase-2: Language settings is reached via the ProfileChip dropdown.
    await page.getByRole('button', { name: /Active profile|Profil actif|Perfil activo/ }).click();
    await page.getByRole('menuitem', { name: /Language settings|Réglages de langue/ }).click();

    const toggle = page.getByRole('switch', { name: /Enable daily thought|Activer la pensée du jour/ });
    await expect(toggle).toHaveAttribute('data-state', 'unchecked');
  });
});

test.describe('Philosopher quote — appears on journal completion', () => {
  test.beforeEach(async ({ page }) => {
    await setFrenchLanguage(page);
    await injectMockSession(page);
    await mockAuthRoutes(page);
    // setupJournalMocks() suppresses the dialog by default; we want it ON here.
    // Apply the network mocks individually instead.
    const { mockFeedback, mockReflection } = await import('./helpers/mocks');
    await mockFeedback(page);
    await mockReflection(page);
    await page.goto('/');
  });

  test('the quote dialog opens when reaching the complete screen and marks "shown today"', async ({ page }) => {
    // Run through the journal flow until 'complete'.
    await page.getByRole('button', { name: "Écrire aujourd'hui" }).click({ force: true });
    await chooseBreatheOnCenterChoice(page);
    await page.getByRole('button', { name: 'Je suis prêt(e)' }).click({ timeout: 12_000 });
    await page.getByRole('button', { name: /Je sais ce que j'écris/ }).click();

    const textarea = page.getByPlaceholder('Écrivez ici...');
    await textarea.fill('Un texte court pour atteindre la fin.');
    await page.getByRole('button', { name: 'Continuer' }).click();

    await expect(page.getByText('Un moment de clarté')).toBeVisible({ timeout: 8_000 });
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Skip emotions (skip-to-reflection path)
    await page.locator('button').filter({ hasText: /\(.+\)/ }).first().click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Reflection → skip to gratitude or completion
    await page.getByRole('button', { name: /Non, gratitude/ }).click();
    await page.getByRole('button', { name: /Passer|Skip/ }).first().click();

    // Quote dialog should appear on the complete screen
    await expect(page.getByTestId('philosopher-quote-dialog')).toBeVisible({ timeout: 5_000 });
    // localStorage records today as last-shown
    await expect.poll(() => read(page, LAST_SHOWN_KEY)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
