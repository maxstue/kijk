import { expect, test } from 'vite-plus/test';

import { safeRedirect } from './safe-redirect';

test.each([undefined, 'https://other.example', '//other.example', '/\\other.example', '/\r\nother'])(
  'rejects external redirects: %s',
  (target) => {
    expect(safeRedirect(target)).toBe('/');
  },
);

test('preserves internal paths, filters and fragments', () => {
  expect(safeRedirect('/space/consumptions?year=2026#list')).toBe('/space/consumptions?year=2026#list');
});
