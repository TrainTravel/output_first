import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { PhilosopherQuoteDialog } from './PhilosopherQuoteDialog';
import { LanguageProvider } from '@/contexts/LanguageContext';
import {
  QUOTES_ENABLED_KEY,
  QUOTES_LAST_SHOWN_KEY,
} from '@/hooks/useQuotesEnabled';

const Wrap = ({ children }: { children: ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

const ue = () => userEvent.setup({ pointerEventsCheck: 0 });

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

beforeEach(() => {
  localStorage.clear();
});

describe('PhilosopherQuoteDialog', () => {
  it('opens automatically on first mount when active + enabled + not shown today', async () => {
    render(<Wrap><PhilosopherQuoteDialog active /></Wrap>);
    await waitFor(() => {
      expect(screen.getByTestId('philosopher-quote-dialog')).toBeInTheDocument();
    });
    // The last-shown date is now today.
    expect(localStorage.getItem(QUOTES_LAST_SHOWN_KEY)).toBe(todayStr());
  });

  it('stays closed when active=false (e.g. wrong screen)', () => {
    render(<Wrap><PhilosopherQuoteDialog active={false} /></Wrap>);
    expect(screen.queryByTestId('philosopher-quote-dialog')).toBeNull();
    expect(localStorage.getItem(QUOTES_LAST_SHOWN_KEY)).toBeNull();
  });

  it('stays closed when already shown today', () => {
    localStorage.setItem(QUOTES_LAST_SHOWN_KEY, todayStr());
    render(<Wrap><PhilosopherQuoteDialog active /></Wrap>);
    expect(screen.queryByTestId('philosopher-quote-dialog')).toBeNull();
  });

  it('stays closed when the feature is disabled', () => {
    localStorage.setItem(QUOTES_ENABLED_KEY, 'false');
    render(<Wrap><PhilosopherQuoteDialog active /></Wrap>);
    expect(screen.queryByTestId('philosopher-quote-dialog')).toBeNull();
    // We do NOT mark "shown today" when we never showed it — tomorrow the
    // user might re-enable and should get today's quote then.
    expect(localStorage.getItem(QUOTES_LAST_SHOWN_KEY)).toBeNull();
  });

  it("'Don't show again' link persists enabled=false and closes the dialog", async () => {
    render(<Wrap><PhilosopherQuoteDialog active /></Wrap>);
    const dialog = await screen.findByTestId('philosopher-quote-dialog');
    const link = await screen.findByRole('button', { name: /Don't show again|Ne plus afficher|No mostrar de nuevo/i });
    await ue().click(link);
    await waitFor(() => {
      expect(localStorage.getItem(QUOTES_ENABLED_KEY)).toBe('false');
    });
    expect(dialog).not.toBeInTheDocument();
  });

  it("'Thanks' closes the dialog without disabling the feature", async () => {
    render(<Wrap><PhilosopherQuoteDialog active /></Wrap>);
    const dialog = await screen.findByTestId('philosopher-quote-dialog');
    const thanks = await screen.findByRole('button', { name: /Thanks|Merci|Gracias|ありがとう|谢谢|謝謝/i });
    await ue().click(thanks);
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    expect(localStorage.getItem(QUOTES_ENABLED_KEY)).toBeNull();
  });

  it('renders the original quote text and an attribution line', async () => {
    render(<Wrap><PhilosopherQuoteDialog active /></Wrap>);
    const dialog = await screen.findByTestId('philosopher-quote-dialog');
    // Default target=fr → today's pick is a French quote. Match attribution shape: "Author · Work · Year".
    expect(dialog.textContent).toMatch(/—\s/); // attribution prefix
  });
});
