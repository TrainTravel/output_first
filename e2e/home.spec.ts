import { test, expect } from '@playwright/test';
import { setFrenchLanguage, expandMoreTools } from './helpers/mocks';

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

  test('shows section navigation buttons', async ({ page }) => {
    // Brain Dump + Thought Garden are always-visible primary actions.
    await expect(page.getByRole('button', { name: 'Vide-tête / Brain Dump' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Jardin de pensées / Thought Garden' })).toBeVisible();
    // Zen Garden was moved under the "More tools" expander in PR a7ca42f.
    await expandMoreTools(page);
    await expect(page.getByRole('button', { name: 'Jardin Zen / Zen Garden' })).toBeVisible();
  });

  test('shows profile chip with target language code', async ({ page }) => {
    // The LanguageToggle button was replaced by a ProfileChip dropdown
    // trigger in the learning-profiles refactor. The chip surfaces the
    // active target-language code (e.g. "FR") and uses an aria-label like
    // "Profil actif : <name>. Ouvrir le menu des profils.".
    const chip = page.getByRole('button', { name: /Profil actif|Active profile|Perfil activo/i });
    await expect(chip).toBeVisible();
    await expect(chip).toContainText('FR');
  });

  test('shows subtitle with "Journaling en français"', async ({ page }) => {
    await expect(page.getByText(/Journaling en français/i)).toBeVisible();
  });
});
