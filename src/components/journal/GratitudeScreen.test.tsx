import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { GratitudeScreen } from './GratitudeScreen';
import { LanguageProvider } from '@/contexts/LanguageContext';

const Wrap = ({ children }: { children: ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

const prompt = {
  en: "What's one small thing you appreciated today?",
  fr: 'Quelle petite chose avez-vous appréciée aujourd\'hui ?',
};

function renderScreen(overrides: Partial<Parameters<typeof GratitudeScreen>[0]> = {}) {
  const onSave = vi.fn();
  const onSkip = vi.fn();
  const onBack = vi.fn();
  render(
    <Wrap>
      <GratitudeScreen
        prompt={prompt}
        onSave={onSave}
        onSkip={onSkip}
        onBack={onBack}
        {...overrides}
      />
    </Wrap>
  );
  return { onSave, onSkip, onBack };
}

beforeEach(() => localStorage.clear());

describe('GratitudeScreen — progressive disclosure', () => {
  it('starts with exactly one input and no "+ Add another" button', () => {
    renderScreen();
    expect(screen.getByTestId('gratitude-field-1')).toBeInTheDocument();
    expect(screen.queryByTestId('gratitude-field-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('gratitude-add-another')).not.toBeInTheDocument();
  });

  it('reveals the "+ Add another" button only once the first field has content', () => {
    renderScreen();
    const f1 = screen.getByTestId('gratitude-field-1');
    fireEvent.change(f1, { target: { value: 'Sunshine through the window' } });
    expect(screen.getByTestId('gratitude-add-another')).toBeInTheDocument();
  });

  it('hides "+ Add another" again if the most recent field is cleared', () => {
    renderScreen();
    const f1 = screen.getByTestId('gratitude-field-1');
    fireEvent.change(f1, { target: { value: 'A' } });
    expect(screen.getByTestId('gratitude-add-another')).toBeInTheDocument();
    fireEvent.change(f1, { target: { value: '' } });
    expect(screen.queryByTestId('gratitude-add-another')).not.toBeInTheDocument();
  });

  it('clicking "+ Add another" reveals the second field; same for third; caps at 3', () => {
    renderScreen();
    const f1 = screen.getByTestId('gratitude-field-1');
    fireEvent.change(f1, { target: { value: 'A' } });
    fireEvent.click(screen.getByTestId('gratitude-add-another'));
    expect(screen.getByTestId('gratitude-field-2')).toBeInTheDocument();

    const f2 = screen.getByTestId('gratitude-field-2');
    fireEvent.change(f2, { target: { value: 'B' } });
    fireEvent.click(screen.getByTestId('gratitude-add-another'));
    expect(screen.getByTestId('gratitude-field-3')).toBeInTheDocument();

    const f3 = screen.getByTestId('gratitude-field-3');
    fireEvent.change(f3, { target: { value: 'C' } });
    // Cap reached — no "Add another" should remain
    expect(screen.queryByTestId('gratitude-add-another')).not.toBeInTheDocument();
  });

  it('Save concatenates non-empty entries with \\n\\n', () => {
    const { onSave } = renderScreen();
    fireEvent.change(screen.getByTestId('gratitude-field-1'), { target: { value: 'A' } });
    fireEvent.click(screen.getByTestId('gratitude-add-another'));
    fireEvent.change(screen.getByTestId('gratitude-field-2'), { target: { value: 'B' } });
    fireEvent.click(screen.getByTestId('gratitude-add-another'));
    fireEvent.change(screen.getByTestId('gratitude-field-3'), { target: { value: 'C' } });

    fireEvent.click(screen.getByRole('button', { name: /Terminer le journal|Complete journal/i }));
    expect(onSave).toHaveBeenCalledWith('A\n\nB\n\nC');
  });

  it('Save filters empty fields out of the joined string', () => {
    const { onSave } = renderScreen();
    fireEvent.change(screen.getByTestId('gratitude-field-1'), { target: { value: 'A' } });
    fireEvent.click(screen.getByTestId('gratitude-add-another'));
    fireEvent.change(screen.getByTestId('gratitude-field-2'), { target: { value: '   ' } });
    // The user opened a second field but left it blank — should not show up in the saved string.

    fireEvent.click(screen.getByRole('button', { name: /Terminer le journal|Complete journal/i }));
    expect(onSave).toHaveBeenCalledWith('A');
  });

  it('Save sends undefined when every field is empty', () => {
    const { onSave } = renderScreen();
    fireEvent.click(screen.getByRole('button', { name: /Terminer le journal|Complete journal/i }));
    expect(onSave).toHaveBeenCalledWith(undefined);
  });

  it('Skip calls onSkip regardless of field contents', () => {
    const { onSkip, onSave } = renderScreen();
    fireEvent.change(screen.getByTestId('gratitude-field-1'), { target: { value: 'A' } });
    fireEvent.click(screen.getByRole('button', { name: /Passer et terminer|Skip and finish/i }));
    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });
});
