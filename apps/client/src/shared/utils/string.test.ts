import { describe, expect, test } from 'vite-plus/test';

import { capitalizeFirstLetter, stringIsNotEmptyOrWhitespace } from './string';

describe('string utilities', () => {
  test.each([undefined, null, '', '   '])('treats %s as empty', (value) => {
    expect(stringIsNotEmptyOrWhitespace(value)).toBe(false);
  });

  test('accepts and narrows non-empty strings', () => {
    expect(stringIsNotEmptyOrWhitespace(' Kijk ')).toBe(true);
  });

  test('capitalizes the first letter and normalizes the remaining value', () => {
    expect(capitalizeFirstLetter('eLECTRICITY')).toBe('Electricity');
  });
});
