import { test, expect } from '@playwright/test';
import { setFrenchLanguage, setSpanishLanguage } from './helpers/mocks';

test.describe('Language toggle', () => {
  test('defaults to French — shows "Écrire aujourd\'hui" and "FR" toggle', async ({ page }) => {
    await setFrenchLanguage(page);
    await page.goto('/');

    await expect(
      page.getByRole('button', { name: "Écrire aujourd'hui" })
    ).toBeVisible();

    const toggle = page.getByRole('button', { name: 'Toggle language' });
    await expect(toggle).toContainText('FR');
  });

  test('toggle to English shows "Write today" and "EN"', async ({ page }) => {
    await setFrenchLanguage(page);
    await page.goto('/');

    await page.getByRole('button', { name: 'Toggle language' }).click();

    await expect(
      page.getByRole('button', { name: 'Write today' })
    ).toBeVisible({ timeout: 3_000 });

    const toggle = page.getByRole('button', { name: 'Toggle language' });
    await expect(toggle).toContainText('EN');
  });

  test('toggle back to French from English', async ({ page }) => {
    await setFrenchLanguage(page);
    await page.goto('/');

    const toggle = page.getByRole('button', { name: 'Toggle language' });
    await toggle.click(); // → EN
    await toggle.click(); // → ES
    await toggle.click(); // → FR

    await expect(
      page.getByRole('button', { name: "Écrire aujourd'hui" })
    ).toBeVisible({ timeout: 3_000 });
    await expect(toggle).toContainText('FR');
  });

  test('language preference persists after page reload', async ({ page }) => {
    // Do NOT use setFrenchLanguage(addInitScript) here — it runs on every reload
    // and would override the toggled language. App defaults to French on first load.
    await page.goto('/');

    // Switch to English (saves 'en' to localStorage via LanguageContext useEffect)
    await page.getByRole('button', { name: 'Toggle language' }).click();
    await expect(page.getByRole('button', { name: 'Write today' })).toBeVisible({ timeout: 3_000 });

    // Reload — no initScript overrides, so localStorage 'en' should be respected
    await page.reload();

    // Should still be in English
    await expect(
      page.getByRole('button', { name: 'Write today' })
    ).toBeVisible({ timeout: 3_000 });
    await expect(
      page.getByRole('button', { name: 'Toggle language' })
    ).toContainText('EN');
  });

  test('bilingual buttons show FR-first order in French mode', async ({ page }) => {
    await setFrenchLanguage(page);
    await page.goto('/');

    const btn = page.getByRole('button', { name: 'Vide-tête / Brain Dump' });
    await expect(btn).toBeVisible();
    // Text should start with French
    const text = await btn.textContent();
    expect(text).toMatch(/^Vide-tête/);
  });

  test('bilingual buttons show EN-first order in English mode', async ({ page }) => {
    await setFrenchLanguage(page);
    await page.goto('/');

    await page.getByRole('button', { name: 'Toggle language' }).click();

    const btn = page.getByRole('button', { name: 'Brain Dump / Vide-tête' });
    await expect(btn).toBeVisible({ timeout: 3_000 });
    const text = await btn.textContent();
    expect(text).toMatch(/^Brain Dump/);
  });

  test('toggle cycles all three languages FR→EN→ES→FR', async ({ page }) => {
    await setFrenchLanguage(page);
    await page.goto('/');

    const toggle = page.getByRole('button', { name: 'Toggle language' });

    // Start: FR
    await expect(toggle).toContainText('FR');

    // Click → EN
    await toggle.click();
    await expect(toggle).toContainText('EN', { timeout: 3_000 });

    // Click → ES
    await toggle.click();
    await expect(toggle).toContainText('ES', { timeout: 3_000 });

    // Click → back to FR
    await toggle.click();
    await expect(toggle).toContainText('FR', { timeout: 3_000 });
  });

  test('ES mode shows Spanish CTA and ES toggle label', async ({ page }) => {
    await setSpanishLanguage(page);
    await page.goto('/');

    await expect(
      page.getByRole('button', { name: 'Escribir hoy' })
    ).toBeVisible({ timeout: 3_000 });

    const toggle = page.getByRole('button', { name: 'Toggle language' });
    await expect(toggle).toContainText('ES');
  });

  test('bilingual ES-first order in Spanish mode', async ({ page }) => {
    await setSpanishLanguage(page);
    await page.goto('/');

    const btn = page.getByRole('button', { name: 'Volcado mental / Brain Dump' });
    await expect(btn).toBeVisible({ timeout: 3_000 });
    const text = await btn.textContent();
    expect(text).toMatch(/^Volcado mental/);
  });

  test('ES preference persists after page reload', async ({ page }) => {
    // Switch to Spanish via two toggles (FR→EN→ES), without using addInitScript
    await page.goto('/');

    const toggle = page.getByRole('button', { name: 'Toggle language' });
    await toggle.click(); // → EN
    await toggle.click(); // → ES
    await expect(page.getByRole('button', { name: 'Escribir hoy' })).toBeVisible({ timeout: 3_000 });

    // Reload — localStorage 'es' should be respected
    await page.reload();

    await expect(
      page.getByRole('button', { name: 'Escribir hoy' })
    ).toBeVisible({ timeout: 3_000 });
    await expect(
      page.getByRole('button', { name: 'Toggle language' })
    ).toContainText('ES');
  });
});
