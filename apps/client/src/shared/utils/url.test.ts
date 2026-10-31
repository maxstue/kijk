import { expect, test } from 'vite-plus/test';

import { trimTrailingSlashes } from './url';

const origin = 'https://example.test';

test.each([
  [origin, origin],
  [`${origin}///`, origin],
  [`${origin}/a//b///`, `${origin}/a//b`],
  ['', ''],
  ['////', ''],
])('removes trailing slashes from %s without changing the rest', (input, expected) => {
  expect(trimTrailingSlashes(input)).toBe(expected);
});

test('preserves a long internal run of slashes and removes a long trailing run', () => {
  const internal = `${origin}/${'/'.repeat(100_000)}path`;
  expect(trimTrailingSlashes(internal)).toBe(internal);
  expect(trimTrailingSlashes(`${origin}${'/'.repeat(100_000)}`)).toBe(origin);
});
