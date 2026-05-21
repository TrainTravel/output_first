import { test, expect } from '@playwright/test';
import { setLanguagePair } from './helpers/mocks';

const STORAGE_KEY = 'outputfirst_lang_pair';

async function getStoredPair(page: import('@playwright/test').Page) {
  return await page.evaluate(key => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, STORAGE_KEY);
}

test.describe('Language pair — defaults & hydration', () => {
  test('new user gets default pair { primary: "en", target: "fr" }', async ({ page }) => {
    await page.goto('/');
    const pair = await getStoredPair(page);
    expect(pair).toEqual({ primary: 'en', target: 'fr' });
  });

  test('toggle button shows "EN → FR" by default', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Toggle primary language' });
    await expect(toggle).toContainText('EN');
    await expect(toggle).toContainText('FR');
  });

  test('hydrate falls back to default when stored pair has primary === target', async ({ page }) => {
    // Pre-seed an invariant violation
    await page.addInitScript(() => {
      localStorage.setItem('outputfirst_lang_pair', JSON.stringify({ primary: 'fr', target: 'fr' }));
    });
    await page.goto('/');
    const pair = await getStoredPair(page);
    expect(pair).toEqual({ primary: 'en', target: 'fr' });
  });

  test('hydrate falls back to default on malformed JSON', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('outputfirst_lang_pair', '{ not json');
    });
    await page.goto('/');
    const pair = await getStoredPair(page);
    expect(pair).toEqual({ primary: 'en', target: 'fr' });
  });
});

test.describe('LanguageToggle — cheap one-tap primary flip', () => {
  test('toggle cycles primary, target stays the same', async ({ page }) => {
    await setLanguagePair(page, { primary: 'en', target: 'fr' });
    await page.goto('/');

    const toggle = page.getByRole('button', { name: 'Toggle primary language' });

    // en → es (skips fr, which equals target)
    await toggle.click();
    expect(await getStoredPair(page)).toEqual({ primary: 'es', target: 'fr' });
    await expect(toggle).toContainText('ES');
    await expect(toggle).toContainText('FR');

    // es → en (skips fr again)
    await toggle.click();
    expect(await getStoredPair(page)).toEqual({ primary: 'en', target: 'fr' });
  });

  test('invariant preserved across rapid toggling', async ({ page }) => {
    await setLanguagePair(page, { primary: 'en', target: 'fr' });
    await page.goto('/');

    const toggle = page.getByRole('button', { name: 'Toggle primary language' });
    for (let i = 0; i < 6; i++) await toggle.click();

    const pair = await getStoredPair(page);
    expect(pair.primary).not.toBe(pair.target);
  });
});

test.describe('LanguageSettingsScreen — foolproof invariant', () => {
  test('opens via gear icon next to the toggle', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Language settings' }).click();
    await expect(page.getByRole('heading', { name: /Réglages de langue|Language settings/ })).toBeVisible();
  });

  test('conflicting card is filtered out, not just disabled', async ({ page }) => {
    await setLanguagePair(page, { primary: 'en', target: 'fr' });
    await page.goto('/');
    await page.getByRole('button', { name: 'Language settings' }).click();

    // The two sections always appear in order: learn (first), speak (second).
    const speakSection = page.getByTestId('speak-section');

    // target = fr → "I already speak" should NOT contain Français as an option
    await expect(speakSection.getByRole('button', { name: /Français/ })).toHaveCount(0);
    // English and Español are still available
    await expect(speakSection.getByRole('button', { name: /English/ })).toBeVisible();
    await expect(speakSection.getByRole('button', { name: /Español/ })).toBeVisible();
  });

  test('picking a different target updates the pair immediately (no Save button)', async ({ page }) => {
    await setLanguagePair(page, { primary: 'en', target: 'fr' });
    await page.goto('/');
    await page.getByRole('button', { name: 'Language settings' }).click();

    const learnSection = page.getByTestId('learn-section');
    await learnSection.getByRole('button', { name: /Español/ }).click();

    const pair = await getStoredPair(page);
    expect(pair).toEqual({ primary: 'en', target: 'es' });

    // No Save button — the change is committed on tap
    await expect(page.getByRole('button', { name: /^Save$/i })).toHaveCount(0);
  });

  test('invariant holds end-to-end: any sequence of taps keeps primary !== target', async ({ page }) => {
    await setLanguagePair(page, { primary: 'en', target: 'fr' });
    await page.goto('/');
    await page.getByRole('button', { name: 'Language settings' }).click();

    const learnSection = page.getByTestId('learn-section');
    const speakSection = page.getByTestId('speak-section');

    // Switch target to Spanish
    await learnSection.getByRole('button', { name: /Español/ }).click();
    let pair = await getStoredPair(page);
    expect(pair).toEqual({ primary: 'en', target: 'es' });

    // Switch primary to French
    await speakSection.getByRole('button', { name: /Français/ }).click();
    pair = await getStoredPair(page);
    expect(pair).toEqual({ primary: 'fr', target: 'es' });

    // Switch target to Simplified Chinese
    await learnSection.getByRole('button', { name: /简体中文/ }).click();
    pair = await getStoredPair(page);
    expect(pair).toEqual({ primary: 'fr', target: 'zh-Hans' });

    // Invariant held at every step
    expect(pair.primary).not.toBe(pair.target);
  });

  test('back arrow returns to home', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Language settings' }).click();
    await page.getByRole('button', { name: /Back|Retour/ }).click();
    // Home shows the "Write today" CTA
    await expect(page.getByRole('button', { name: /Write today|Écrire aujourd'hui|Escribir hoy/ }))
      .toBeVisible();
  });
});
