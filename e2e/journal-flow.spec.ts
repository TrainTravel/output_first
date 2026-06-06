import { test, expect } from '@playwright/test';
import { setFrenchLanguage, setupJournalMocks, mockFeedback, injectMockSession, mockAuthRoutes, chooseBreatheOnCenterChoice } from './helpers/mocks';

test.describe('Journal flow - happy path', () => {
  test.beforeEach(async ({ page }) => {
    await setFrenchLanguage(page);
    await injectMockSession(page);
    await mockAuthRoutes(page);
    await setupJournalMocks(page);
    await page.goto('/');
  });

  test('completes journal from home to complete screen', async ({ page }) => {
    // 1. Start journal (force bypasses animate-breathe CSS instability)
    await page.getByRole('button', { name: "Écrire aujourd'hui" }).click({ force: true });
    await chooseBreatheOnCenterChoice(page);

    // 2. BreatheScreen — wait for the "ready" button to become active
    await expect(page.getByText('Inspirez...')).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole('button', { name: 'Je suis prêt(e)' })
    ).toBeVisible({ timeout: 12_000 });
    await page.getByRole('button', { name: 'Je suis prêt(e)' }).click({ timeout: 12_000 });

    // 2b. PromptChoiceScreen — choose direct write
    await expect(page.getByText("Je sais ce que j'écris")).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: /Je sais ce que j'écris/ }).click();

    // 3. WriteScreen — type and continue
    const textarea = page.getByPlaceholder('Écrivez ici...');
    await expect(textarea).toBeVisible();
    await textarea.fill("Aujourd'hui j'ai passé une bonne journée.");
    await page.getByRole('button', { name: 'Continuer' }).click();

    // 4. FeedbackScreen — always shows "Continuer"
    await expect(page.getByText('Un moment de clarté')).toBeVisible({ timeout: 8_000 });
    await page.getByRole('button', { name: 'Continuer' }).click();

    // 5. EmotionsScreen
    await expect(
      page.getByText('Un mot pour ce que vous ressentez')
    ).toBeVisible({ timeout: 5_000 });
    // Tap pill to open detail drawer, then select the word
    await page.locator('button').filter({ hasText: /\(.+\)/ }).first().click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // 6. ReflectionScreen — loading then question appears
    await expect(
      page.getByText(
        'What is one small thing that felt manageable today?'
      )
    ).toBeVisible({ timeout: 8_000 });
    // Choose "Non, gratitude" to skip to gratitude step
    await page.getByRole('button', { name: /Non, gratitude/ }).click();

    // 7. GratitudeScreen
    const gratitudeTextarea = page.getByPlaceholder('Quelque chose de petit suffit...');
    await expect(gratitudeTextarea).toBeVisible({ timeout: 5_000 });
    await gratitudeTextarea.fill('Je suis reconnaissant(e) pour le soleil.');
    await page.getByRole('button', { name: 'Terminer le journal' }).click();

    // 8. CompleteScreen
    await expect(
      page.getByText("Vous êtes venu(e) aujourd'hui")
    ).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: "Retour à l'accueil" }).click();

    // Back on home — after journaling the CTA becomes "Écrire encore"
    await expect(page.getByRole('button', { name: "Écrire encore" })).toBeVisible();
  });

  test('can skip gratitude and still reach complete screen', async ({ page }) => {
    await page.getByRole('button', { name: "Écrire aujourd'hui" }).click({ force: true });
    await chooseBreatheOnCenterChoice(page);

    // Wait for breathe button (up to 12s)
    await page.getByRole('button', { name: 'Je suis prêt(e)' }).click({ timeout: 12_000 });
    await page.getByRole('button', { name: /Je sais ce que j'écris/ }).click();

    const textarea = page.getByPlaceholder('Écrivez ici...');
    await textarea.fill('Un texte quelconque.');
    await page.getByRole('button', { name: 'Continuer' }).click();

    await expect(page.getByText('Un moment de clarté')).toBeVisible({ timeout: 8_000 });
    await page.getByRole('button', { name: 'Continuer' }).click();

    await page.locator('button').filter({ hasText: /\(.+\)/ }).first().click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    await expect(
      page.getByText('What is one small thing that felt manageable today?')
    ).toBeVisible({ timeout: 8_000 });
    await page.getByRole('button', { name: /Non, gratitude/ }).click();

    await expect(page.getByPlaceholder('Quelque chose de petit suffit...')).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: 'Passer et terminer' }).click();

    await expect(
      page.getByText("Vous êtes venu(e) aujourd'hui")
    ).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Reflection - multi-round conversation history', () => {
  test('second reflection call includes previousCycles with first round data', async ({ page }) => {
    await setFrenchLanguage(page);
    await injectMockSession(page);
    await mockAuthRoutes(page);
    await mockFeedback(page);

    // Capture each reflection request body in order
    const reflectionBodies: Array<Record<string, unknown>> = [];
    await page.route('**/functions/v1/reflection', (route) => {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      reflectionBodies.push(body);
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reflection: 'It sounds like a lot is on your mind.',
          question: 'What comes up when you sit with that feeling?',
        }),
      });
    });

    await page.goto('/');

    // Start → breathe → write
    await page.getByRole('button', { name: "Écrire aujourd'hui" }).click({ force: true });
    await chooseBreatheOnCenterChoice(page);
    await page.getByRole('button', { name: 'Je suis prêt(e)' }).click({ timeout: 12_000 });
    await page.getByRole('button', { name: /Je sais ce que j'écris/ }).click();
    await page.getByPlaceholder('Écrivez ici...').fill("J'ai du mal à me concentrer.");
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Feedback → emotions
    await expect(page.getByText('Un moment de clarté')).toBeVisible({ timeout: 8_000 });
    await page.getByRole('button', { name: 'Continuer' }).click();
    await page.locator('button').filter({ hasText: /\(.+\)/ }).first().click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Round 1 — question appears, user types a response, clicks "explore more"
    await expect(page.getByText("What comes up when you sit with that feeling?")).toBeVisible({ timeout: 8_000 });
    await page.getByPlaceholder('Prenez votre temps...').fill("Je pense à toutes mes tâches.");
    await page.getByRole('button', { name: /Oui, explorer plus/ }).click();

    // Feedback between rounds, then round 2 reflection loads
    await expect(page.getByText('Un moment de clarté')).toBeVisible({ timeout: 8_000 });
    await page.getByRole('button', { name: 'Continuer' }).click();
    await expect(page.getByText("What comes up when you sit with that feeling?")).toBeVisible({ timeout: 8_000 });

    // Round 1 had no previousCycles
    expect(reflectionBodies[0].previousCycles).toBeUndefined();

    // Round 2 carries round 1's question + user response
    expect(reflectionBodies).toHaveLength(2);
    const cycle = (reflectionBodies[1].previousCycles as Array<Record<string, string>>)[0];
    expect(cycle.reflectionResponse).toBe("Je pense à toutes mes tâches.");
    expect(cycle.aiQuestion).toBe("What comes up when you sit with that feeling?");
  });
});

test.describe('BreatheScreen - clock control', () => {
  test('button becomes clickable after time elapses', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('outputfirst_language', 'fr');
    });

    // Install fake clock BEFORE navigating
    await page.clock.install({ now: Date.now() });
    await page.goto('/');
    // Mock AI calls after navigation (routes persist)
    await page.route('**/functions/v1/language-feedback', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    );

    await page.getByRole('button', { name: "Écrire aujourd'hui" }).click({ force: true });
    await chooseBreatheOnCenterChoice(page);
    await expect(page.getByText('Inspirez...')).toBeVisible({ timeout: 5_000 });

    // Fast-forward 10 seconds so the breathing cycle completes
    await page.clock.fastForward(10_000);

    const readyBtn = page.getByRole('button', { name: 'Je suis prêt(e)' });
    await expect(readyBtn).toBeVisible();
    await expect(readyBtn).toBeEnabled();
    await readyBtn.click();

    // Should advance to PromptChoiceScreen
    await expect(page.getByText("Je sais ce que j'écris")).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: /Je sais ce que j'écris/ }).click();

    // Then WriteScreen
    await expect(page.getByPlaceholder('Écrivez ici...')).toBeVisible({ timeout: 5_000 });
  });
});
