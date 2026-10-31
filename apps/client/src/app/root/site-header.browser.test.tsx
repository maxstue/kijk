import '@kijk/ui/globals.css';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { SiteHeader } from './site-header';

vi.mock('@tanstack/react-router', () => ({
  useMatches: () => 'Import',
}));
vi.mock('@kijk/ui/components/sidebar', () => ({
  SidebarTrigger: () => <button aria-label='Toggle sidebar'>Menu</button>,
}));

test('centers the vertical divider in the app header', async () => {
  const screen = await render(<SiteHeader />);
  const header = screen.getByRole('banner').element();
  const separator = header.querySelector<HTMLElement>('[data-slot="separator"]')!;
  const headerBounds = header.getBoundingClientRect();
  const separatorBounds = separator.getBoundingClientRect();
  expect(separatorBounds.height).toBe(16);
  expect(
    Math.abs(separatorBounds.top + separatorBounds.height / 2 - (headerBounds.top + headerBounds.height / 2)),
  ).toBeLessThanOrEqual(1);
  await screen.unmount();
});
