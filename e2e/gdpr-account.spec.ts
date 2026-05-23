import { test, expect, Page } from '@playwright/test';
import {
  setFrenchLanguage,
  injectMockSession,
  mockAuthRoutes,
} from './helpers/mocks';

/** Mock the profiles row fetch so we can drive the AccountScreen status. */
async function mockProfilesGet(page: Page, scheduledDeletionAt: string | null = null) {
  await page.route('**/rest/v1/profiles*', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          scheduledDeletionAt === undefined
            ? []
            : [{ id: 'test-user-id', scheduled_deletion_at: scheduledDeletionAt, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }],
        ),
      });
    }
    return route.continue();
  });
}

async function mockScheduleDeletion(page: Page) {
  await page.route('**/functions/v1/schedule-account-deletion', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        scheduled_deletion_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    }),
  );
}

async function mockCancelDeletion(page: Page) {
  await page.route('**/functions/v1/cancel-account-deletion', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ cancelled: true }),
    }),
  );
}

async function mockExportUserData(page: Page) {
  await page.route('**/functions/v1/export-user-data', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        exported_at: new Date().toISOString(),
        user_id: 'test-user-id',
        schema_version: 1,
        data: {
          journal_entries: [{ id: 'je-1', content: 'sample' }],
          thoughts: [],
          clusters: [],
          cluster_thoughts: [],
          proposals: [],
          experiments: [],
          experiment_checkins: [],
        },
      }),
    }),
  );
}

test.describe('GDPR — account deletion', () => {
  test.beforeEach(async ({ page }) => {
    await setFrenchLanguage(page);
    await injectMockSession(page);
    await mockAuthRoutes(page);
  });

  test('footer link opens AccountScreen', async ({ page }) => {
    await mockProfilesGet(page, null);
    await page.goto('/');
    await page.getByRole('button', { name: /Compte et données|Account & data/i }).click();
    await expect(page.getByText(/Télécharger mes données|Download my data/i)).toBeVisible();
  });

  test('delete trigger opens confirmation modal then schedules deletion', async ({ page }) => {
    await mockProfilesGet(page, null);
    await mockScheduleDeletion(page);
    await page.goto('/');
    await page.getByRole('button', { name: /Compte et données|Account & data/i }).click();

    await page.getByTestId('delete-trigger').click();
    await expect(page.getByTestId('delete-confirm')).toBeVisible();

    // Watch for the schedule-account-deletion call.
    const callPromise = page.waitForRequest('**/functions/v1/schedule-account-deletion');
    await page.getByTestId('delete-confirm').click();
    const req = await callPromise;
    expect(req.method()).toBe('POST');
  });

  test('download button triggers a .json file download', async ({ page }) => {
    await mockProfilesGet(page, null);
    await mockExportUserData(page);
    await page.goto('/');
    await page.getByRole('button', { name: /Compte et données|Account & data/i }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('export-button').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^outputfirst-export-\d{4}-\d{2}-\d{2}\.json$/);
  });

  test('shows banner and cancel button when deletion is already scheduled', async ({ page }) => {
    const future = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString();
    await mockProfilesGet(page, future);
    await mockCancelDeletion(page);
    await page.goto('/');
    await page.getByRole('button', { name: /Compte et données|Account & data/i }).click();

    await expect(page.getByTestId('deletion-banner')).toBeVisible();
    // Delete trigger should NOT be shown while a deletion is pending.
    await expect(page.getByTestId('delete-trigger')).toHaveCount(0);

    const callPromise = page.waitForRequest('**/functions/v1/cancel-account-deletion');
    await page.getByTestId('cancel-deletion').click();
    const req = await callPromise;
    expect(req.method()).toBe('POST');
  });
});
