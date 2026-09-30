import { describe, expect, it } from 'vite-plus/test';

import { capitalizeFirstLetter, stringIsNotEmptyOrWhitespace } from './string';

describe('string utilities', () => {
  it.each([undefined, null, '', '   '])('treats %s as empty', (value) => {
    expect(stringIsNotEmptyOrWhitespace(value)).toBe(false);
  });

  it('accepts and narrows non-empty strings', () => {
    expect(stringIsNotEmptyOrWhitespace(' Kijk ')).toBe(true);
  });

  it('capitalizes the first letter and normalizes the remaining value', () => {
    expect(capitalizeFirstLetter('eLECTRICITY')).toBe('Electricity');
  });
});
