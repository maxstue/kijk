import { useThemeStore } from '@kijk/core/stores/theme-store';
import { act } from 'react';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { ThemeModeSwitcher } from './theme-mode-switcher';

const originalMode = useThemeStore.getState().mode;
const originalClassName = document.documentElement.className;

afterEach(() => {
  vi.unstubAllGlobals();
  useThemeStore.setState({ mode: originalMode });
  document.documentElement.className = originalClassName;
});

test('tracks the system theme only while selected and removes its listener on mode change and unmount', async () => {
  const listeners = new Set<() => void>();
  const media = {
    matches: false,
    addEventListener: vi.fn<(name: string, listener: () => void) => void>((_name, listener) => listeners.add(listener)),
    removeEventListener: vi.fn<(name: string, listener: () => void) => void>((_name, listener) =>
      listeners.delete(listener),
    ),
  };
  vi.stubGlobal('matchMedia', () => media);
  useThemeStore.setState({ mode: 'system' });
  const screen = await render(<ThemeModeSwitcher />);
  try {
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(listeners.size).toBe(1);
    media.matches = true;
    await act(async () => {
      for (const listener of listeners) {
        listener();
      }
    });
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    await act(async () => useThemeStore.setState({ mode: 'light' }));
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(listeners.size).toBe(0);
    expect(media.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    await act(async () => useThemeStore.setState({ mode: 'system' }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(listeners.size).toBe(1);
  } finally {
    await screen.unmount();
  }
  expect(listeners.size).toBe(0);
});

test.each(['light', 'dark'] as const)('a fixed %s theme does not subscribe to system theme changes', async (mode) => {
  const matchMedia = vi.fn<(query: string) => MediaQueryList>();
  vi.stubGlobal('matchMedia', matchMedia);
  useThemeStore.setState({ mode });
  const screen = await render(<ThemeModeSwitcher />);
  try {
    expect(document.documentElement.classList.contains(mode)).toBe(true);
    expect(matchMedia).not.toHaveBeenCalled();
  } finally {
    await screen.unmount();
  }
});
