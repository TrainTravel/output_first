import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LanguageProvider } from '@/contexts/LanguageContext';

// --- Mocks --------------------------------------------------------------

const mockSignOut = vi.fn(async () => undefined);
const mockMaybeSingle = vi.fn();
const mockInvoke = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', is_anonymous: false },
    session: null,
    loading: false,
    isAuthenticated: true,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: mockSignOut,
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => mockMaybeSingle(),
        }),
      }),
    }),
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// --- Imports under test --------------------------------------------------

import { AccountScreen } from './AccountScreen';

function renderScreen(onBack = vi.fn()) {
  return render(
    <LanguageProvider>
      <AccountScreen onBack={onBack} />
    </LanguageProvider>,
  );
}

describe('AccountScreen — surface', () => {
  beforeEach(() => {
    mockSignOut.mockClear();
    mockMaybeSingle.mockReset();
    mockInvoke.mockReset();
    localStorage.clear();
    // Default: profile row with no pending deletion
    mockMaybeSingle.mockResolvedValue({ data: { scheduled_deletion_at: null }, error: null });
  });

  it('renders the screen header', async () => {
    renderScreen();
    expect(await screen.findByRole('heading', { name: /Compte|Account|Cuenta/i })).toBeInTheDocument();
  });

  it('renders the download button', async () => {
    renderScreen();
    expect(await screen.findByTestId('export-button')).toBeInTheDocument();
  });

  it('renders the destructive delete button when no deletion is scheduled', async () => {
    renderScreen();
    expect(await screen.findByTestId('delete-trigger')).toBeInTheDocument();
  });

  it('back button calls onBack', async () => {
    const onBack = vi.fn();
    renderScreen(onBack);
    await waitFor(() => expect(mockMaybeSingle).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: /Back|Retour|Volver/i }));
    expect(onBack).toHaveBeenCalled();
  });
});

describe('AccountScreen — delete confirmation', () => {
  beforeEach(() => {
    mockSignOut.mockClear();
    mockMaybeSingle.mockReset();
    mockInvoke.mockReset();
    mockMaybeSingle.mockResolvedValue({ data: { scheduled_deletion_at: null }, error: null });
  });

  it('opens confirmation modal on delete click', async () => {
    renderScreen();
    const trigger = await screen.findByTestId('delete-trigger');
    fireEvent.click(trigger);
    // The dialog action button only exists once the dialog is open.
    expect(await screen.findByTestId('delete-confirm')).toBeInTheDocument();
  });

  it('confirming the modal invokes schedule-account-deletion and signs the user out', async () => {
    mockInvoke.mockResolvedValue({ data: { scheduled_deletion_at: 'x' }, error: null });
    renderScreen();
    const trigger = await screen.findByTestId('delete-trigger');
    fireEvent.click(trigger);
    const confirm = await screen.findByTestId('delete-confirm');
    fireEvent.click(confirm);
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('schedule-account-deletion');
    });
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });
});

describe('AccountScreen — data export', () => {
  beforeEach(() => {
    mockSignOut.mockClear();
    mockMaybeSingle.mockReset();
    mockInvoke.mockReset();
    mockMaybeSingle.mockResolvedValue({ data: { scheduled_deletion_at: null }, error: null });
  });

  it('clicking the download button invokes export-user-data', async () => {
    const payload = {
      exported_at: '2026-05-23T00:00:00Z',
      user_id: 'test-user-id',
      schema_version: 1,
      data: { journal_entries: [], thoughts: [], clusters: [], cluster_thoughts: [], proposals: [] },
    };
    mockInvoke.mockResolvedValue({ data: payload, error: null });

    // Stub URL.createObjectURL / revokeObjectURL since happy-dom does not.
    const createObjectURL = vi.fn(() => 'blob:mock');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true });

    renderScreen();
    const btn = await screen.findByTestId('export-button');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('export-user-data');
    });
    await waitFor(() => {
      expect(createObjectURL).toHaveBeenCalled();
    });
  });

  it('export button is disabled while in flight (Loader2 swap renders)', async () => {
    // Hold the promise open so the button stays in submitting state.
    let resolveFn: (v: unknown) => void;
    const inFlight = new Promise((res) => { resolveFn = res; });
    mockInvoke.mockReturnValue(inFlight);

    renderScreen();
    const btn = await screen.findByTestId('export-button');
    fireEvent.click(btn);

    await waitFor(() => {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });

    resolveFn!({ data: null, error: { message: 'mock' } });
  });
});

describe('AccountScreen — scheduled-deletion banner', () => {
  beforeEach(() => {
    mockSignOut.mockClear();
    mockMaybeSingle.mockReset();
    mockInvoke.mockReset();
  });

  it('renders the yellow banner when a future deletion is scheduled', async () => {
    const future = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString();
    mockMaybeSingle.mockResolvedValue({ data: { scheduled_deletion_at: future }, error: null });
    renderScreen();
    expect(await screen.findByTestId('deletion-banner')).toBeInTheDocument();
    // Delete trigger is hidden while a deletion is already pending.
    expect(screen.queryByTestId('delete-trigger')).toBeNull();
  });

  it('cancel button calls cancel-account-deletion edge function', async () => {
    const future = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString();
    mockMaybeSingle.mockResolvedValue({ data: { scheduled_deletion_at: future }, error: null });
    mockInvoke.mockResolvedValue({ data: { cancelled: true }, error: null });
    renderScreen();
    const cancel = await screen.findByTestId('cancel-deletion');
    fireEvent.click(cancel);
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('cancel-account-deletion');
    });
  });

  it('lazy-purges when scheduled_deletion_at is in the past', async () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    mockMaybeSingle.mockResolvedValue({ data: { scheduled_deletion_at: past }, error: null });
    mockInvoke.mockResolvedValue({ data: { deleted: true }, error: null });
    renderScreen();
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('hard-delete-account');
    });
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });
});
