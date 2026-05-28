import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { ProfileChip } from './ProfileChip';
import { LanguageProvider, type Profile } from '@/contexts/LanguageContext';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const PROFILES_KEY = 'outputfirst_profiles';

function seed(state: {
  profiles: Array<Partial<Profile> & { id: string; target: Profile['target'] }>;
  activeProfileId: string;
  primaryLang: 'en' | 'fr' | 'es' | 'zh-Hans' | 'zh-Hant';
}) {
  const now = new Date().toISOString();
  localStorage.setItem(
    PROFILES_KEY,
    JSON.stringify({
      profiles: state.profiles.map(p => ({ createdAt: now, ...p })),
      activeProfileId: state.activeProfileId,
      primaryLang: state.primaryLang,
    }),
  );
}

function read() {
  const raw = localStorage.getItem(PROFILES_KEY);
  return raw ? JSON.parse(raw) : null;
}

const Wrap = ({ children }: { children: ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

// aria-label on the chip is rendered in the active target's language, so we
// match by the shared shape (any of the localized "active profile" strings).
const CHIP_ARIA = /Active profile|Profil actif|Perfil activo|アクティブなプロファイル|当前档案|當前檔案/i;
const ADD_PROFILE_ARIA = /Add profile|Ajouter un profil|Añadir perfil|プロファイルを追加|添加档案|新增檔案/i;
const SETTINGS_ARIA = /Language settings|Réglages de langue|Ajustes de idioma|言語設定|语言设置|語言設定/i;
// The switch-aria string interpolates the language name in the active locale.
// We match by the language name alone — distinct across the menuitems.
const SWITCH_FRENCH_ARIA = /Français|French|Francés|フランス語|法语|法語/i;
const SWITCH_JAPANESE_ARIA = /Japanese|Japonais|Japonés|日本語|日语|日語/i;

// Radix DropdownMenu needs PointerEvents to open, which JSDOM does not
// dispatch from fireEvent.click — use user-event's pointer-aware click.
const ue = () => userEvent.setup({ pointerEventsCheck: 0 });
const openChip = async () => {
  await ue().click(screen.getByRole('button', { name: CHIP_ARIA }));
};

beforeEach(() => {
  localStorage.clear();
});

describe('ProfileChip', () => {
  it('renders the active profile label (FR by default)', () => {
    render(<Wrap><ProfileChip /></Wrap>);
    const chip = screen.getByRole('button', { name: CHIP_ARIA });
    expect(chip).toHaveTextContent('FR');
  });

  it('renders the Japanese label (日) when active target is ja', () => {
    seed({
      profiles: [{ id: 'p1', target: 'ja' }],
      activeProfileId: 'p1',
      primaryLang: 'en',
    });
    render(<Wrap><ProfileChip /></Wrap>);
    const chip = screen.getByRole('button', { name: CHIP_ARIA });
    expect(chip).toHaveTextContent('日');
  });

  it('opens the dropdown and lists each live profile', async () => {
    seed({
      profiles: [
        { id: 'fr', target: 'fr' },
        { id: 'ja', target: 'ja' },
      ],
      activeProfileId: 'fr',
      primaryLang: 'en',
    });
    render(<Wrap><ProfileChip /></Wrap>);
    await openChip();

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: SWITCH_FRENCH_ARIA })).toBeInTheDocument();
    });
    expect(screen.getByRole('menuitem', { name: SWITCH_JAPANESE_ARIA })).toBeInTheDocument();
  });

  it('clicking a non-active profile switches activeProfileId in storage', async () => {
    seed({
      profiles: [
        { id: 'fr', target: 'fr' },
        { id: 'ja', target: 'ja' },
      ],
      activeProfileId: 'fr',
      primaryLang: 'en',
    });
    render(<Wrap><ProfileChip /></Wrap>);
    await openChip();

    const jaItem = await screen.findByRole('menuitem', { name: SWITCH_JAPANESE_ARIA });
    await ue().click(jaItem);

    await waitFor(() => expect(read().activeProfileId).toBe('ja'));
    // Primary stays the same — switching profiles must NOT mutate chrome.
    expect(read().primaryLang).toBe('en');
  });

  it('archived profiles are not shown in the dropdown', async () => {
    seed({
      profiles: [
        { id: 'fr', target: 'fr' },
        { id: 'ja', target: 'ja', archivedAt: new Date().toISOString() },
      ],
      activeProfileId: 'fr',
      primaryLang: 'en',
    });
    render(<Wrap><ProfileChip /></Wrap>);
    await openChip();

    await screen.findByRole('menuitem', { name: SWITCH_FRENCH_ARIA });
    expect(screen.queryByRole('menuitem', { name: SWITCH_JAPANESE_ARIA })).toBeNull();
  });

  it('Settings entry fires the onOpenLanguageSettings callback when clicked', async () => {
    const onOpen = vi.fn();
    render(<Wrap><ProfileChip onOpenLanguageSettings={onOpen} /></Wrap>);
    await openChip();

    const settingsItem = await screen.findByRole('menuitem', { name: SETTINGS_ARIA });
    await ue().click(settingsItem);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('omits the Settings entry when no onOpenLanguageSettings is provided', async () => {
    render(<Wrap><ProfileChip /></Wrap>);
    await openChip();

    await screen.findByRole('menuitem', { name: ADD_PROFILE_ARIA });
    expect(screen.queryByRole('menuitem', { name: SETTINGS_ARIA })).toBeNull();
  });

  it('opens the create dialog when Add profile is selected', async () => {
    render(<Wrap><ProfileChip /></Wrap>);
    await openChip();
    await ue().click(await screen.findByRole('menuitem', { name: ADD_PROFILE_ARIA }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/New profile|Nouveau profil/i)).toBeInTheDocument();
  });

  it('the create dialog defaults to a non-conflicting target (Create enabled, no warning)', async () => {
    // primary=fr → defaultNewTarget picks the first TARGET_OPTIONS entry that
    // isn't fr (= es). Dialog should open clean, Create enabled.
    seed({
      profiles: [{ id: 'p1', target: 'ja' }],
      activeProfileId: 'p1',
      primaryLang: 'fr',
    });
    render(<Wrap><ProfileChip /></Wrap>);
    await openChip();
    await ue().click(await screen.findByRole('menuitem', { name: ADD_PROFILE_ARIA }));

    const dialog = await screen.findByRole('dialog');
    // Active target=ja, so the Create button renders in Japanese here.
    const createBtn = within(dialog).getByRole('button', { name: /^(Create|Créer|Crear|作成|创建|建立)$/ });
    expect(createBtn).not.toBeDisabled();
    expect(within(dialog).queryByText(/already your chrome language/i)).toBeNull();
  });
});
