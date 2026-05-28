import { test, expect } from '@playwright/test';
import { seedProfiles, getProfilesState } from './helpers/mocks';

const LEGACY_KEY = 'outputfirst_lang_pair';
const PROFILES_KEY = 'outputfirst_profiles';

const profileChip = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: /Active profile|Profil actif|Perfil activo|アクティブなプロファイル|当前档案|當前檔案/ });

test.describe('Profiles — defaults & hydration', () => {
  test('first-run user gets a single default profile (target=fr, primary=en)', async ({ page }) => {
    await page.goto('/');
    const state = await getProfilesState(page);
    expect(state).not.toBeNull();
    expect(state.primaryLang).toBe('en');
    expect(state.profiles).toHaveLength(1);
    expect(state.profiles[0].target).toBe('fr');
    expect(state.activeProfileId).toBe(state.profiles[0].id);
  });

  test('ProfileChip shows FR by default', async ({ page }) => {
    await page.goto('/');
    await expect(profileChip(page)).toContainText('FR');
  });

  test('legacy outputfirst_lang_pair migrates to profiles shape and is deleted', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('outputfirst_lang_pair', JSON.stringify({ primary: 'es', target: 'ja' }));
    });
    await page.goto('/');
    const state = await getProfilesState(page);
    expect(state.primaryLang).toBe('es');
    expect(state.profiles).toHaveLength(1);
    expect(state.profiles[0].target).toBe('ja');
    const legacy = await page.evaluate((k) => localStorage.getItem(k), LEGACY_KEY);
    expect(legacy).toBeNull();
  });

  test('legacy malformed JSON falls back to default profile', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('outputfirst_lang_pair', '{ not json');
    });
    await page.goto('/');
    const state = await getProfilesState(page);
    expect(state.primaryLang).toBe('en');
    expect(state.profiles[0].target).toBe('fr');
  });

  test('Phase 0 shape (per-profile `primary`) lifts primary to global', async ({ page }) => {
    // Legacy shape: profile object carried its own `primary` field.
    await page.addInitScript((key) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          profiles: [
            { id: 'p1', target: 'es', primary: 'fr', createdAt: '2026-01-01T00:00:00Z' },
          ],
          activeProfileId: 'p1',
          // no top-level primaryLang
        }),
      );
    }, PROFILES_KEY);
    await page.goto('/');
    const state = await getProfilesState(page);
    expect(state.primaryLang).toBe('fr');
    expect(state.profiles[0].target).toBe('es');
    // The Profile entity no longer carries `primary`.
    expect(state.profiles[0].primary).toBeUndefined();
  });

  test('invariant violation (primary === target) is corrected on hydrate', async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          profiles: [{ id: 'p1', target: 'fr', createdAt: '2026-01-01T00:00:00Z' }],
          activeProfileId: 'p1',
          primaryLang: 'fr',
        }),
      );
    }, PROFILES_KEY);
    await page.goto('/');
    const state = await getProfilesState(page);
    expect(state.profiles[0].target).toBe('fr');
    expect(state.primaryLang).not.toBe('fr');
  });
});

test.describe('ProfileChip — switch and create', () => {
  test('dropdown opens and lists the active profile', async ({ page }) => {
    await page.goto('/');
    await profileChip(page).click();
    // Default profile is French — label shows the localized language name.
    await expect(page.getByRole('menuitem', { name: /French|Français|Francés/ })).toBeVisible();
  });

  test('creating a new profile (Japanese) switches active and updates the chip', async ({ page }) => {
    await page.goto('/');
    await profileChip(page).click();
    await page.getByRole('menuitem', { name: /Add profile|Ajouter un profil|Añadir perfil/ }).click();

    // Pick Japanese from the Select inside the dialog.
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: /日 ·|日 ·/ }).click();
    await page.getByRole('button', { name: /^(Create|Créer|Crear|作成|创建|建立)$/ }).click();

    // Chip now shows 日 (Japanese label).
    await expect(profileChip(page)).toContainText('日');

    // Storage reflects two profiles, Japanese active.
    const state = await getProfilesState(page);
    expect(state.profiles).toHaveLength(2);
    const active = state.profiles.find((p: { id: string }) => p.id === state.activeProfileId);
    expect(active.target).toBe('ja');
  });

  test('switching profiles does NOT mutate the chrome (primary) language', async ({ page }) => {
    await seedProfiles(page, {
      profiles: [
        { id: 'fr', target: 'fr' },
        { id: 'ja', target: 'ja' },
      ],
      activeProfileId: 'fr',
      primaryLang: 'es',
    });
    await page.goto('/');
    await profileChip(page).click();
    await page.getByRole('menuitem', { name: /Japanese|Japonais|Japonés|日本語|日语|日語/ }).click();

    const state = await getProfilesState(page);
    expect(state.activeProfileId).toBe('ja');
    expect(state.primaryLang).toBe('es'); // unchanged
  });

  test('switching to a profile whose target equals current primary auto-adjusts primary', async ({ page }) => {
    await seedProfiles(page, {
      profiles: [
        { id: 'ja', target: 'ja' },
        { id: 'fr', target: 'fr' },
      ],
      activeProfileId: 'ja',
      primaryLang: 'fr', // OK while target=ja
    });
    await page.goto('/');
    await profileChip(page).click();
    // Chip is in Japanese (target=ja) before the switch, so French shows as フランス語.
    await page.getByRole('menuitem', { name: /French|Français|Francés|フランス語|法语|法語/ }).click();

    const state = await getProfilesState(page);
    expect(state.activeProfileId).toBe('fr');
    // primary was fr and would now equal target — must change
    expect(state.primaryLang).not.toBe('fr');
  });
});

test.describe('LanguageSettingsScreen — profile management', () => {
  test('opens via the Settings entry on the ProfileChip', async ({ page }) => {
    await page.goto('/');
    await profileChip(page).click();
    await page.getByRole('menuitem', { name: /Language settings|Réglages de langue|Ajustes de idioma/ }).click();
    await expect(
      page.getByRole('heading', { name: /Réglages de langue|Language settings|Ajustes de idioma/ }),
    ).toBeVisible();
  });

  test('profiles-section lists each live profile', async ({ page }) => {
    await seedProfiles(page, {
      profiles: [
        { id: 'fr', target: 'fr' },
        { id: 'ja', target: 'ja' },
      ],
      activeProfileId: 'fr',
      primaryLang: 'en',
    });
    await page.goto('/');
    await profileChip(page).click();
    await page.getByRole('menuitem', { name: /Language settings|Réglages de langue/ }).click();

    const section = page.getByTestId('profiles-section');
    await expect(section.getByTestId('profile-row-fr')).toBeVisible();
    await expect(section.getByTestId('profile-row-ja')).toBeVisible();
  });

  test('rename a profile inline; the chip reflects the new name', async ({ page }) => {
    await seedProfiles(page, {
      profiles: [
        { id: 'fr', target: 'fr' },
        { id: 'ja', target: 'ja' },
      ],
      activeProfileId: 'fr',
      primaryLang: 'en',
    });
    await page.goto('/');
    await profileChip(page).click();
    await page.getByRole('menuitem', { name: /Language settings|Réglages de langue/ }).click();

    const frRow = page.getByTestId('profile-row-fr');
    await frRow.getByRole('button', { name: /Rename profile|Renommer le profil/ }).click();

    const input = frRow.getByRole('textbox');
    await input.fill('Travel French');
    await input.press('Enter');

    const state = await getProfilesState(page);
    const fr = state.profiles.find((p: { id: string }) => p.id === 'fr');
    expect(fr.name).toBe('Travel French');

    // Reflected in the chip's aria-label after returning home.
    await page.getByRole('button', { name: /Back|Retour/ }).click();
    await expect(profileChip(page)).toHaveAttribute('aria-label', /Travel French/);
  });

  test('archive a profile (with multiple) — row disappears and active switches if needed', async ({ page }) => {
    await seedProfiles(page, {
      profiles: [
        { id: 'fr', target: 'fr' },
        { id: 'ja', target: 'ja' },
      ],
      activeProfileId: 'fr',
      primaryLang: 'en',
    });
    await page.goto('/');
    await profileChip(page).click();
    await page.getByRole('menuitem', { name: /Language settings|Réglages de langue/ }).click();

    const frRow = page.getByTestId('profile-row-fr');
    await frRow.getByRole('button', { name: /Archive profile|Archiver le profil/ }).click();

    // Confirm step
    await frRow.getByRole('button', { name: /^(Archive|Archiver|Archivar)$/ }).click();

    // Row gone from the live list
    await expect(page.getByTestId('profile-row-fr')).toHaveCount(0);
    // Japanese is now active
    const state = await getProfilesState(page);
    expect(state.activeProfileId).toBe('ja');
    expect(state.profiles.find((p: { id: string }) => p.id === 'fr').archivedAt).toBeTruthy();
  });

  test('archive button is disabled when only one live profile remains', async ({ page }) => {
    await page.goto('/');
    await profileChip(page).click();
    await page.getByRole('menuitem', { name: /Language settings|Réglages de langue/ }).click();

    const onlyRow = page.getByTestId('profiles-section').locator('[data-testid^="profile-row-"]');
    await expect(onlyRow).toHaveCount(1);
    await expect(
      onlyRow.getByRole('button', { name: /Archive profile|Archiver le profil/ }),
    ).toBeDisabled();
  });

  test('picking a different "I already speak" language updates primary immediately (no Save button)', async ({ page }) => {
    await page.goto('/');
    await profileChip(page).click();
    await page.getByRole('menuitem', { name: /Language settings|Réglages de langue/ }).click();

    const speak = page.getByTestId('speak-section');
    await speak.getByRole('button', { name: /Español/ }).click();

    const state = await getProfilesState(page);
    expect(state.primaryLang).toBe('es');
    // No Save button anywhere on the page
    await expect(page.getByRole('button', { name: /^Save$/i })).toHaveCount(0);
  });

  test('the language currently being learned is filtered out of "I already speak"', async ({ page }) => {
    // target=fr → primary cannot be fr
    await page.goto('/');
    await profileChip(page).click();
    await page.getByRole('menuitem', { name: /Language settings|Réglages de langue/ }).click();

    const speak = page.getByTestId('speak-section');
    await expect(speak.getByRole('button', { name: /Français/ })).toHaveCount(0);
    await expect(speak.getByRole('button', { name: /English/ })).toBeVisible();
  });

  test('back arrow returns to home', async ({ page }) => {
    await page.goto('/');
    await profileChip(page).click();
    await page.getByRole('menuitem', { name: /Language settings|Réglages de langue/ }).click();
    await page.getByRole('button', { name: /Back|Retour/ }).click();
    await expect(
      page.getByRole('button', { name: /Write today|Écrire aujourd'hui|Escribir hoy/ }),
    ).toBeVisible();
  });
});

test.describe('Japanese — target-only', () => {
  test('chip shows 日 when active target is Japanese', async ({ page }) => {
    await seedProfiles(page, {
      profiles: [{ id: 'p1', target: 'ja' }],
      activeProfileId: 'p1',
      primaryLang: 'en',
    });
    await page.goto('/');
    await expect(profileChip(page)).toContainText('日');
  });

  test('Japanese is not offered as a primary option', async ({ page }) => {
    await seedProfiles(page, {
      profiles: [{ id: 'p1', target: 'ja' }],
      activeProfileId: 'p1',
      primaryLang: 'en',
    });
    await page.goto('/');
    await profileChip(page).click();
    // Chrome renders in Japanese when target=ja, so Settings is "言語設定".
    await page.getByRole('menuitem', { name: /Language settings|Réglages de langue|言語設定/ }).click();

    const speak = page.getByTestId('speak-section');
    await expect(speak.getByRole('button', { name: /日本語/ })).toHaveCount(0);
  });
});
