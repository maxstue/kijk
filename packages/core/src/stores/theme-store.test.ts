import { afterEach, expect, test, vi } from 'vite-plus/test';

import { hydrateTheme, useThemeStore } from './theme-store';

afterEach(() => {
  vi.unstubAllGlobals();
  useThemeStore.setState({ mode: 'system' });
});

test('restores the device preference only when the client hydrates', () => {
  const getItem = vi.fn<Storage['getItem']>().mockReturnValue(JSON.stringify({ mode: 'dark' }));
  vi.stubGlobal('localStorage', { getItem });
  expect(useThemeStore.getState().mode).toBe('system');
  expect(getItem).not.toHaveBeenCalled();
  hydrateTheme();
  expect(getItem).toHaveBeenCalledWith('kijk-theme');
  expect(useThemeStore.getState().mode).toBe('dark');
});

test.each([null, '{invalid-json'])('an absent or invalid device preference keeps the app usable: %s', (value) => {
  vi.stubGlobal('localStorage', { getItem: () => value });
  hydrateTheme();
  expect(useThemeStore.getState().mode).toBe('system');
});

test('blocked browser storage does not prevent startup', () => {
  vi.stubGlobal('localStorage', {
    getItem: () => {
      throw new Error('Storage unavailable');
    },
  });
  expect(hydrateTheme).not.toThrow();
  expect(useThemeStore.getState().mode).toBe('system');
});

test('changing the theme persists the device preference', () => {
  const setItem = vi.fn<Storage['setItem']>();
  vi.stubGlobal('localStorage', { setItem });
  useThemeStore.getState().actions.setMode('light');
  expect(useThemeStore.getState().mode).toBe('light');
  expect(setItem).toHaveBeenCalledWith('kijk-theme', JSON.stringify({ mode: 'light' }));
});
