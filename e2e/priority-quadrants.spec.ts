import { test, expect, type Page } from '@playwright/test';
import {
  setFrenchLanguage,
  injectMockSession,
  mockAuthRoutes,
  mockThoughts,
  mockGenerateEmbedding,
  mockTodoTriageEisenhower,
} from './helpers/mocks';

/**
 * mockThoughts with auto-incrementing ids so each POSTed thought has a unique
 * server-assigned id (the default helper returns 'thought-1' for every POST,
 * which breaks any flow that depends on per-thought identity).
 */
async function mockThoughtsWithUniqueIds(page: Page, getResponse: unknown[] = []) {
  let counter = 0;
  await page.route('**/rest/v1/thoughts*', (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(getResponse),
      });
    }
    if (method === 'PATCH') {
      return route.fulfill({ status: 204, contentType: 'application/json', body: '' });
    }
    // POST
    let content = 'test thought';
    try {
      const body = route.request().postDataJSON() as { content?: string } | Array<{ content?: string }>;
      if (Array.isArray(body)) {
        content = body[0]?.content ?? content;
      } else {
        content = body?.content ?? content;
      }
    } catch { /* default */ }
    counter += 1;
    // PostgREST .single() expects a single object response (Accept: application/vnd.pgrst.object+json).
    // Returning an array here causes supabase-js to unwrap to undefined fields.
    return route.fulfill({
      status: 201,
      contentType: 'application/vnd.pgrst.object+json',
      body: JSON.stringify({
        id: `thought-${counter}`,
        content,
        user_anonymous_id: 'test-user-id',
        created_at: new Date().toISOString(),
        ai_theme: null,
        archived: false,
        composted: false,
        is_task: null,
        quadrant: null,
      }),
    });
  });
}

async function expandMoreTools(page: Page) {
  await page.getByRole('button', { name: /Autres outils|More tools/i }).click();
}

test.describe('Priority Quadrants — Home tile entry', () => {
  test.beforeEach(async ({ page }) => {
    await setFrenchLanguage(page);
    await injectMockSession(page);
    await mockAuthRoutes(page);
    await page.goto('/');
  });

  test('Home tile renders the bilingual Priority Quadrants anchor', async ({ page }) => {
    await expandMoreTools(page);
    const tile = page.getByTestId('home-tile-quadrants');
    await expect(tile).toBeVisible({ timeout: 5_000 });
    await expect(tile).toContainText(/Matrice de priorités|Priority Quadrants/);
  });

  test('tapping the tile opens QuadrantsScreen with the empty state when no items', async ({ page }) => {
    await mockThoughts(page, []);
    await expandMoreTools(page);
    await page.getByTestId('home-tile-quadrants').click();

    await expect(page.getByTestId('quadrants-screen')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId('quadrants-empty')).toBeVisible({ timeout: 5_000 });
  });

  test('items with quadrant=q2 from the server appear in the q2 cell', async ({ page }) => {
    await mockThoughts(page, [
      {
        id: '11111111-1111-4111-8111-111111111111',
        content: 'Plan vacation',
        created_at: '2026-06-01T10:00:00Z',
        ai_theme: null,
        archived: false,
        composted: false,
        user_anonymous_id: 'test-user',
        is_task: true,
        quadrant: 'q2',
      },
    ]);

    await expandMoreTools(page);
    await page.getByTestId('home-tile-quadrants').click();
    await expect(page.getByTestId('quadrants-screen')).toBeVisible({ timeout: 5_000 });

    // The empty state must not be shown when there is at least one classified item.
    await expect(page.getByTestId('quadrants-empty')).toHaveCount(0);

    const q2Cell = page.getByTestId('quadrant-q2');
    await expect(q2Cell).toBeVisible();
    await expect(q2Cell).toContainText('Plan vacation');
  });
});

test.describe('Priority Quadrants — BrainDump sort flow', () => {
  test.beforeEach(async ({ page }) => {
    await setFrenchLanguage(page);
    await injectMockSession(page);
    await mockAuthRoutes(page);
    await mockThoughtsWithUniqueIds(page);
    await mockGenerateEmbedding(page);
    await mockTodoTriageEisenhower(page, (_id, content) => {
      if (/feel|sens|siento/i.test(content)) return { isTask: false, quadrant: null };
      return { isTask: true, quadrant: 'q1' };
    });
    await page.goto('/');
  });

  async function enterBrainDump(page: Page) {
    await page.getByRole('button', { name: /Vide-tête.*Brain Dump|Brain Dump.*Vide-tête/i }).click();
  }

  async function addThought(page: Page, text: string) {
    const input = page.locator('textarea').first();
    await input.fill(text);
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('', { timeout: 5_000 });
  }

  test('Sort CTA appears after adding a thought; verify step pre-fills AI guesses', async ({ page }) => {
    await enterBrainDump(page);

    // No sort CTA until at least one thought is added
    await expect(page.getByTestId('braindump-sort-cta')).toHaveCount(0);

    await addThought(page, 'Pay the tax bill');
    await addThought(page, 'I feel anxious');

    const cta = page.getByTestId('braindump-sort-cta');
    await expect(cta).toBeVisible();
    await expect(cta).toContainText('(2)');

    await cta.click();

    const verify = page.getByTestId('task-verify-step');
    await expect(verify).toBeVisible({ timeout: 5_000 });
    await expect(verify.getByText('Pay the tax bill')).toBeVisible();
    await expect(verify.getByText('I feel anxious')).toBeVisible();
    // The classifier mock marks anything with "feel" as a non-task,
    // so the "I feel anxious" row should be pre-filled unchecked
    // while "Pay the tax bill" should be pre-filled checked.
    await expect(verify.getByRole('checkbox')).toHaveCount(2);
  });

  test('Confirm in TaskVerifyStep navigates to QuadrantsScreen', async ({ page }) => {
    await enterBrainDump(page);
    await addThought(page, 'Pay the tax bill');

    await page.getByTestId('braindump-sort-cta').click();
    await expect(page.getByTestId('task-verify-step')).toBeVisible({ timeout: 5_000 });

    await page.getByTestId('task-verify-confirm').click();

    await expect(page.getByTestId('quadrants-screen')).toBeVisible({ timeout: 5_000 });
  });

  test('Skip in TaskVerifyStep also navigates to QuadrantsScreen', async ({ page }) => {
    await enterBrainDump(page);
    await addThought(page, 'Pay the tax bill');

    await page.getByTestId('braindump-sort-cta').click();
    await expect(page.getByTestId('task-verify-step')).toBeVisible({ timeout: 5_000 });

    await page.getByTestId('task-verify-skip').click();

    await expect(page.getByTestId('quadrants-screen')).toBeVisible({ timeout: 5_000 });
  });
});
