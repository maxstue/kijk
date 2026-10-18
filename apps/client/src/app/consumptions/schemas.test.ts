import { expect, test } from 'vite-plus/test';

import { consumptionCreateSchema, consumptionUpdateSchema } from './schemas';

const reading = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Meter reading',
  resourceId: '11111111-1111-4111-8111-111111111112',
  valueType: 'Absolute',
  date: new Date('2026-01-01'),
};

test.each([0, 0.5])('meter readings can be zero or fractional: %s', (value) => {
  expect(consumptionCreateSchema.safeParse({ ...reading, value }).success).toBe(true);
  expect(consumptionUpdateSchema.safeParse({ ...reading, value }).success).toBe(true);
});

test('negative readings and blank names are rejected', () => {
  for (const schema of [consumptionCreateSchema, consumptionUpdateSchema]) {
    expect(schema.safeParse({ ...reading, value: -1 }).success).toBe(false);
    expect(schema.safeParse({ ...reading, name: '  ', value: 1 }).success).toBe(false);
  }
});
