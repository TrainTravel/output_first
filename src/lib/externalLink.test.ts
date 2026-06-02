import { describe, it, expect, beforeEach, vi } from 'vitest';

const { browserOpen, isNativeMock } = vi.hoisted(() => ({
  browserOpen: vi.fn(async () => undefined),
  isNativeMock: vi.fn(() => false),
}));

vi.mock('@capacitor/browser', () => ({ Browser: { open: browserOpen } }));
vi.mock('./native', () => ({ isNative: () => isNativeMock() }));

import { openExternal, openMailto } from './externalLink';

beforeEach(() => {
  browserOpen.mockClear();
  isNativeMock.mockReset();
  isNativeMock.mockReturnValue(false);
});

describe('openExternal', () => {
  it('opens a new tab via window.open on web', async () => {
    const winOpen = vi.spyOn(window, 'open').mockReturnValue(null);
    await openExternal('https://example.com');
    expect(winOpen).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
    expect(browserOpen).not.toHaveBeenCalled();
    winOpen.mockRestore();
  });

  it('uses Capacitor Browser.open on native', async () => {
    isNativeMock.mockReturnValue(true);
    const winOpen = vi.spyOn(window, 'open').mockReturnValue(null);
    await openExternal('https://example.com');
    expect(browserOpen).toHaveBeenCalledWith({ url: 'https://example.com' });
    expect(winOpen).not.toHaveBeenCalled();
    winOpen.mockRestore();
  });

  it('falls back to window.open if the native plugin throws', async () => {
    isNativeMock.mockReturnValue(true);
    browserOpen.mockRejectedValueOnce(new Error('plugin unavailable'));
    const winOpen = vi.spyOn(window, 'open').mockReturnValue(null);
    await openExternal('https://example.com');
    expect(winOpen).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
    winOpen.mockRestore();
  });

  it('is a no-op for an empty URL', async () => {
    const winOpen = vi.spyOn(window, 'open').mockReturnValue(null);
    await openExternal('');
    expect(winOpen).not.toHaveBeenCalled();
    expect(browserOpen).not.toHaveBeenCalled();
    winOpen.mockRestore();
  });
});

describe('openMailto', () => {
  it('navigates to a mailto: URL with encoded subject', () => {
    const originalHref = window.location.href;
    // jsdom allows direct assignment to location.href
    openMailto('hi@example.com', 'OutputFirst feedback');
    expect(window.location.href).toBe('mailto:hi@example.com?subject=OutputFirst%20feedback');
    window.location.href = originalHref;
  });

  it('omits the query string when no subject is given', () => {
    const originalHref = window.location.href;
    openMailto('hi@example.com');
    expect(window.location.href).toBe('mailto:hi@example.com');
    window.location.href = originalHref;
  });

  it('is a no-op for an empty email', () => {
    const originalHref = window.location.href;
    openMailto('');
    expect(window.location.href).toBe(originalHref);
  });
});
