import { describe, expect, test } from 'vite-plus/test';

import { capitalizeFirstLetter } from './string';

describe('string utilities', () => {
  test('capitalizes the first letter and normalizes the remaining value', () => {
    expect(capitalizeFirstLetter('eLECTRICITY')).toBe('Electricity');
  });
});
