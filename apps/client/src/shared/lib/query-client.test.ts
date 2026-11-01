import { expect, test } from 'vite-plus/test';

import { createQueryClient } from './query-client';

test('request-local query clients cannot see another user cache', () => {
  const alice = createQueryClient();
  const bob = createQueryClient();
  alice.setQueryData(['user'], { id: 'alice' });
  expect(bob.getQueryData(['user'])).toBeUndefined();
});
