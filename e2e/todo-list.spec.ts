import { test, expect } from '@playwright/test';
import { setFrenchLanguage, mockTodoTriage, expandMoreTools } from './helpers/mocks';

test.describe('ABC Todo List', () => {
  test.beforeEach(async ({ page }) => {
    await setFrenchLanguage(page);
    await mockTodoTriage(page, 'A');
    await page.goto('/');
    // ABC List lives under the collapsed "More tools" expander on HomeScreen.
    await expandMoreTools(page);
  });

  test('Home → Todo List → back to Home (navigation smoke)', async ({ page }) => {
    await page.getByRole('button', { name: /Liste A\/B\/C|ABC List/i }).click();
    await expect(page.getByRole('heading', { name: /Liste A\/B\/C|ABC List/i })).toBeVisible({ timeout: 5_000 });

    await page.getByRole('button', { name: /Retour|Back/i }).click();
    await expect(page.getByRole('button', { name: "Écrire aujourd'hui" })).toBeVisible({ timeout: 5_000 });
  });

  test('can add a task — text appears in list', async ({ page }) => {
    await page.getByRole('button', { name: /Liste A\/B\/C|ABC List/i }).click();

    const input = page.getByPlaceholder(/Nouvelle tâche|New task|Nueva tarea/i);
    await input.fill('Pay the rent');
    await input.press('Enter');

    await expect(page.getByText('Pay the rent')).toBeVisible({ timeout: 3_000 });
  });

  test('AI triage mock → task shows priority badge', async ({ page }) => {
    await page.getByRole('button', { name: /Liste A\/B\/C|ABC List/i }).click();

    const input = page.getByPlaceholder(/Nouvelle tâche|New task|Nueva tarea/i);
    await input.fill('Call the doctor');
    await input.press('Enter');

    // Wait for AI to resolve — badge should show 'A' (mocked)
    await expect(page.getByText('A').first()).toBeVisible({ timeout: 5_000 });
  });

  test('tapping priority badge cycles A → B', async ({ page }) => {
    await page.getByRole('button', { name: /Liste A\/B\/C|ABC List/i }).click();
    // Focus mode hides B/C — flip to All so we can observe the badge cycling
    // from A into the B section without the item being filtered out.
    await page.getByTestId('abc-mode-all').click();

    const input = page.getByPlaceholder(/Nouvelle tâche|New task|Nueva tarea/i);
    await input.fill('Do the laundry');
    await input.press('Enter');

    const badge = page.locator('button[title]').filter({ hasText: 'A' }).first();
    await expect(badge).toBeVisible({ timeout: 5_000 });

    await badge.click();
    await expect(page.locator('button[title]').filter({ hasText: 'B' }).first()).toBeVisible({ timeout: 2_000 });
  });

  test('section headers A, B, C visible in All mode', async ({ page }) => {
    await page.getByRole('button', { name: /Liste A\/B\/C|ABC List/i }).click();
    // Focus mode (the default) only renders the A section. The "all three
    // headers visible" contract belongs to All mode.
    await page.getByTestId('abc-mode-all').click();

    await expect(page.getByText(/A.*Urgent/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/B.*Important/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/C.*reste|C.*else|C.*demás/i)).toBeVisible({ timeout: 5_000 });
  });

  test('can complete a task — strikethrough appears', async ({ page }) => {
    await page.getByRole('button', { name: /Liste A\/B\/C|ABC List/i }).click();

    const input = page.getByPlaceholder(/Nouvelle tâche|New task|Nueva tarea/i);
    await input.fill('Send the report');
    await input.press('Enter');

    await expect(page.getByText('Send the report')).toBeVisible({ timeout: 3_000 });

    // Click the checkbox (round button before the text)
    const taskRow = page.locator('li').filter({ hasText: 'Send the report' });
    await taskRow.locator('button').first().click();

    // Text should now have line-through class
    await expect(taskRow.locator('span.line-through')).toBeVisible({ timeout: 2_000 });
  });

  test('tasks persist after page reload', async ({ page }) => {
    await page.getByRole('button', { name: /Liste A\/B\/C|ABC List/i }).click();

    const input = page.getByPlaceholder(/Nouvelle tâche|New task|Nueva tarea/i);
    await input.fill('Buy groceries');
    await input.press('Enter');

    await expect(page.getByText('Buy groceries')).toBeVisible({ timeout: 3_000 });

    // Reload
    await page.reload();
    // Language is set via addInitScript so it persists across reload.
    // "More tools" state resets on remount, so re-expand before clicking.
    await expandMoreTools(page);
    await page.getByRole('button', { name: /Liste A\/B\/C|ABC List/i }).click();

    await expect(page.getByText('Buy groceries')).toBeVisible({ timeout: 3_000 });
  });

  test('empty state message shown when no tasks', async ({ page }) => {
    await page.getByRole('button', { name: /Liste A\/B\/C|ABC List/i }).click();

    // Focus mode is the default — flip to All so the master-list empty
    // message is the one rendered (Focus shows a different message).
    await page.getByTestId('abc-mode-all').click();

    await expect(
      page.getByText(/Aucune tâche|No tasks|Sin tareas/i)
    ).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('ABC Todo List — Focus mode (Bailey Step 3)', () => {
  test.beforeEach(async ({ page }) => {
    await setFrenchLanguage(page);
    await page.goto('/');
    await expandMoreTools(page);
  });

  test('Focus is the default mode on entry', async ({ page }) => {
    await mockTodoTriage(page, 'A');
    await page.getByRole('button', { name: /Liste A\/B\/C|ABC List/i }).click();

    const focusPill = page.getByTestId('abc-mode-focus');
    await expect(focusPill).toBeVisible({ timeout: 5_000 });
    await expect(focusPill).toHaveAttribute('aria-pressed', 'true');

    // With no items, the protective empty Focus message renders — not the
    // "no tasks" message (that one is reserved for All mode).
    await expect(page.getByTestId('abc-focus-empty')).toBeVisible({ timeout: 5_000 });
  });

  test('Focus mode hides B and C section headers', async ({ page }) => {
    await mockTodoTriage(page, 'B');
    await page.getByRole('button', { name: /Liste A\/B\/C|ABC List/i }).click();

    const input = page.getByPlaceholder(/Nouvelle tâche|New task|Nueva tarea/i);
    await input.fill('Plan birthday party');
    await input.press('Enter');

    // Triage resolves to B — Focus view still empty.
    await expect(page.getByTestId('abc-focus-empty')).toBeVisible({ timeout: 5_000 });

    // B section header label is not visible in Focus mode.
    await expect(page.getByText(/B — Important/)).not.toBeVisible();
  });

  test('switching to All reveals B and C sections', async ({ page }) => {
    await mockTodoTriage(page, 'B');
    await page.getByRole('button', { name: /Liste A\/B\/C|ABC List/i }).click();

    const input = page.getByPlaceholder(/Nouvelle tâche|New task|Nueva tarea/i);
    await input.fill('Plan birthday party');
    await input.press('Enter');

    await expect(page.getByTestId('abc-focus-empty')).toBeVisible({ timeout: 5_000 });

    await page.getByTestId('abc-mode-all').click();

    await expect(page.getByText(/B — Important/)).toBeVisible({ timeout: 3_000 });
    await expect(page.getByText('Plan birthday party')).toBeVisible();
    await expect(page.getByTestId('abc-focus-empty')).not.toBeVisible();
  });

  test('Focus mode shows A items and hides B/C headers', async ({ page }) => {
    await mockTodoTriage(page, 'A');
    await page.getByRole('button', { name: /Liste A\/B\/C|ABC List/i }).click();

    const input = page.getByPlaceholder(/Nouvelle tâche|New task|Nueva tarea/i);
    await input.fill('Pay rent today');
    await input.press('Enter');

    await expect(page.getByText('Pay rent today')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/A — Urgent/)).toBeVisible();
    await expect(page.getByText(/B — Important/)).not.toBeVisible();
    await expect(page.getByText(/C — Le reste/)).not.toBeVisible();
  });
});
