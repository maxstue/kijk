import { describe, expect, it } from 'vitest';

import { groupBy } from './array';

describe('groupBy', () => {
  const values = [
    { category: 'energy', id: 'electricity' },
    { category: 'water', id: 'cold-water' },
    { category: 'energy', id: 'gas' },
  ];

  it('groups values using the selected key', () => {
    const result = groupBy(values, (value) => value.category);

    expect(result).toEqual({
      energy: [values[0], values[2]],
      water: [values[1]],
    });
  });

  it('removes duplicate values when a unique key is provided', () => {
    const result = groupBy(
      [...values, values[0]],
      (value) => value.category,
      (value) => value.id,
    );

    expect(result.energy).toEqual([values[0], values[2]]);
  });

  it('returns an empty object for missing input', () => {
    expect(groupBy(undefined, (value: { category: string }) => value.category)).toEqual({});
  });
});
