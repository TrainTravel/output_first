import { test, expect } from '@playwright/test';
import { setFrenchLanguage, mockTodoTriage } from './helpers/mocks';

test.describe('ABC Todo List', () => {
  test.beforeEach(async ({ page }) => {
    await setFrenchLanguage(page);
    await mockTodoTriage(page, 'A');
    await page.goto('/');
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

    const input = page.getByPlaceholder(/Nouvelle tâche|New task|Nueva tarea/i);
    await input.fill('Do the laundry');
    await input.press('Enter');

    // Wait for AI to resolve to A
    const badge = page.locator('button[title]').filter({ hasText: 'A' }).first();
    await expect(badge).toBeVisible({ timeout: 5_000 });

    // Tap to cycle A → B
    await badge.click();
    await expect(page.locator('button[title]').filter({ hasText: 'B' }).first()).toBeVisible({ timeout: 2_000 });
  });

  test('section headers A, B, C always visible', async ({ page }) => {
    await page.getByRole('button', { name: /Liste A\/B\/C|ABC List/i }).click();

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
    // Language is set via addInitScript so it persists across reload
    await page.getByRole('button', { name: /Liste A\/B\/C|ABC List/i }).click();

    await expect(page.getByText('Buy groceries')).toBeVisible({ timeout: 3_000 });
  });

  test('empty state message shown when no tasks', async ({ page }) => {
    await page.getByRole('button', { name: /Liste A\/B\/C|ABC List/i }).click();

    await expect(
      page.getByText(/Aucune tâche|No tasks|Sin tareas/i)
    ).toBeVisible({ timeout: 5_000 });
  });
});
