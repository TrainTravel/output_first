import { Page } from '@playwright/test';

// ----- Mock response shapes -----

export const FEEDBACK_MOCK = {
  acknowledgment: {
    fr: 'Ce que vous avez partagé est précieux.',
    en: 'What you shared is precious.',
  },
  emotionalGranularity: { detected: 'fatigué', alternatives: [] },
  languageNote: null,
  encouragement: {
    fr: 'Continuez.',
    en: 'Keep going.',
  },
};

export const REFLECTION_MOCK = {
  reflection: 'It sounds like you are carrying a lot right now.',
  question: 'What is one small thing that felt manageable today?',
};

export const THOUGHT_MOCK = (content: string) => ([
  {
    id: 'thought-1',
    content,
    user_anonymous_id: 'test-user-id',
    created_at: new Date().toISOString(),
    ai_theme: null,
    archived: false,
    composted: false,
  },
]);

// ----- Route mock helpers -----

/** Block auth token refresh so the fake session is not invalidated. */
export async function mockAuthRoutes(page: Page) {
  await page.route('**/auth/v1/token*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          role: 'authenticated',
        },
      }),
    })
  );
}

/** Mock french-feedback edge function. */
export async function mockFeedback(page: Page) {
  await page.route('**/functions/v1/french-feedback', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FEEDBACK_MOCK),
    })
  );
}

/** Mock reflection edge function. */
export async function mockReflection(page: Page) {
  await page.route('**/functions/v1/reflection', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(REFLECTION_MOCK),
    })
  );
}

/** Mock Supabase thoughts REST endpoint (GET returns empty, POST returns created thought). */
export async function mockThoughts(page: Page, getResponse: unknown[] = []) {
  await page.route('**/rest/v1/thoughts*', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(getResponse),
      });
    }
    // POST — postDataJSON() is synchronous in Playwright
    try {
      const body = route.request().postDataJSON() as { content?: string };
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(THOUGHT_MOCK(body?.content ?? 'test thought')),
      });
    } catch {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(THOUGHT_MOCK('test thought')),
      });
    }
  });
}

/** Mock generate-embedding (fire-and-forget). */
export async function mockGenerateEmbedding(page: Page) {
  await page.route('**/functions/v1/generate-embedding', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ theme: 'Daily Reflections' }),
    })
  );
}

/**
 * Seed the language pair before page load.
 * Default behavior: primary=en, target=fr (matches the app's first-run default).
 */
export async function setLanguagePair(
  page: Page,
  pair: { primary: 'en' | 'fr' | 'es'; target: 'fr' | 'es' | 'zh-Hans' | 'zh-Hant' },
) {
  await page.addInitScript((p) => {
    localStorage.setItem('outputfirst_lang_pair', JSON.stringify(p));
  }, pair);
}

/** Seed target=French, primary=English (the app default). */
export async function setFrenchLanguage(page: Page) {
  await setLanguagePair(page, { primary: 'en', target: 'fr' });
}

/** Seed target=Spanish, primary=English. */
export async function setSpanishLanguage(page: Page) {
  await setLanguagePair(page, { primary: 'en', target: 'es' });
}

/** Inject a mock authenticated Supabase session. */
export async function injectMockSession(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'sb-bdeotnzldfnqwbdymscp-auth-token',
      JSON.stringify({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          role: 'authenticated',
        },
      })
    );
  });
}

/** Mock todo-triage edge function. Returns priority B by default. */
export async function mockTodoTriage(page: Page, priority: 'A' | 'B' | 'C' = 'B') {
  await page.route('**/functions/v1/todo-triage', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ priority, reason: 'Mock AI reason.' }),
    })
  );
}

/** Mock todo-from-image edge function. Returns tasks by default, or a question. */
export async function mockTodoFromImage(page: Page, response: { tasks?: string[]; question?: string } = { tasks: ['Task from image'] }) {
  await page.route('**/functions/v1/todo-from-image', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    })
  );
}

/** Apply all mocks needed for the full journal flow. */
export async function setupJournalMocks(page: Page) {
  await mockFeedback(page);
  await mockReflection(page);
}
