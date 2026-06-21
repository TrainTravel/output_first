import { test, expect, type Page } from '@playwright/test';
import { injectMockSession, mockAuthRoutes, setFrenchLanguage } from './helpers/mocks';

// Inline mocks so the circulation hooks don't crash against an unmocked
// Supabase URL on mount. Returning empty arrays / null is enough for the
// nav smoke test — we just need the screens to render.
async function mockCirculationData(page: Page) {
  await page.route('**/rest/v1/circulation_settings*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  );
  await page.route('**/rest/v1/love_letters*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  );
}

test.describe('Circulation of Love — navigation', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockSession(page);
    await mockAuthRoutes(page);
    await setFrenchLanguage(page);
    await mockCirculationData(page);
    await page.goto('/');
  });

  test('home tile is visible and labelled bilingually', async ({ page }) => {
    const tile = page.getByTestId('home-circulation-tile');
    await expect(tile).toBeVisible();
    await expect(tile).toContainText("Circulation d'amour");
  });

  test('clicking the tile lands on the circulation feed', async ({ page }) => {
    await page.getByTestId('home-circulation-tile').click();
    await expect(page.getByTestId('circulation-feed-screen')).toBeVisible();
  });

  test('non-opted-in user sees the "Join the current" CTA, not letters', async ({ page }) => {
    await page.getByTestId('home-circulation-tile').click();
    await expect(page.getByTestId('circulation-join-cta')).toBeVisible();
    await expect(page.getByTestId('circulation-open-share')).toHaveCount(0);
  });

  test('settings link from the feed opens the settings screen', async ({ page }) => {
    await page.getByTestId('home-circulation-tile').click();
    await page.getByTestId('circulation-feed-settings').click();
    await expect(page.getByTestId('circulation-settings-screen')).toBeVisible();
    await expect(page.getByTestId('circulation-receive-toggle')).toBeVisible();
    await expect(page.getByTestId('circulation-share-toggle')).toBeVisible();
  });

  test('TTL chooser exposes all three durations', async ({ page }) => {
    await page.getByTestId('home-circulation-tile').click();
    await page.getByTestId('circulation-feed-settings').click();
    await expect(page.getByTestId('circulation-ttl-7')).toBeVisible();
    await expect(page.getByTestId('circulation-ttl-14')).toBeVisible();
    await expect(page.getByTestId('circulation-ttl-30')).toBeVisible();
  });
});
