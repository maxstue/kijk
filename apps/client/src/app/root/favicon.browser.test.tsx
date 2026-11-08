import { afterEach, expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { Favicon } from './favicon';

afterEach(() => vi.restoreAllMocks());

test('updates the declared favicon without a sizes attribute and stops listening after unmount', async () => {
  const existingIcons = [...document.querySelectorAll<HTMLLinkElement>("link[rel='icon']")];
  existingIcons.forEach((icon) => icon.remove());
  const link = document.createElement('link');
  link.rel = 'icon';
  link.setAttribute('href', '/favicon.svg');
  document.head.append(link);
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  const screen = await render(<Favicon />);
  try {
    hidden.mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(link.getAttribute('href')).toBe('/favicon_inactive.svg');
    hidden.mockReturnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(link.getAttribute('href')).toBe('/favicon.svg');

    await screen.unmount();
    hidden.mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(link.getAttribute('href')).toBe('/favicon.svg');
  } finally {
    await screen.unmount();
    link.remove();
    document.head.append(...existingIcons);
  }
});
