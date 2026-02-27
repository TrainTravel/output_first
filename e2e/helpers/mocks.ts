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

/** Set French language preference in localStorage before page load. */
export async function setFrenchLanguage(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('outputfirst_language', 'fr');
  });
}

/** Set Spanish language preference in localStorage before page load. */
export async function setSpanishLanguage(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('outputfirst_language', 'es');
  });
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

/** Apply all mocks needed for the full journal flow. */
export async function setupJournalMocks(page: Page) {
  await mockFeedback(page);
  await mockReflection(page);
}
