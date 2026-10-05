import { describe, expect, test } from 'vite-plus/test';

import { getCreateDefaultValues, toFormValues, toRequest } from './helpers';
import { noneValue } from './schemas';

describe('toRequest', () => {
  test('sends expenses as negative and income as positive amounts', () => {
    const values = { ...getCreateDefaultValues(), amount: 12.5 };

    expect(toRequest({ ...values, direction: 'expense' }).amount).toBe(-12.5);
    expect(toRequest({ ...values, direction: 'income' }).amount).toBe(12.5);
  });

  test('maps the none selection and blank text to null', () => {
    const request = toRequest({ ...getCreateDefaultValues(), amount: 1 });

    expect(request.accountId).toBeNull();
    expect(request.categoryId).toBeNull();
    expect(request.counterparty).toBeNull();
    expect(request.status).toBe('Booked');
  });
});

describe('toFormValues', () => {
  test('splits the signed amount into direction and absolute amount', () => {
    const values = toFormValues({
      accountId: null,
      accountName: null,
      amount: -42.5,
      bookingDate: '2026-10-05',
      categoryId: null,
      categoryName: null,
      categorySource: null,
      counterparty: 'Supermarket',
      currency: 'EUR',
      id: '1',
      isTransfer: false,
      purpose: null,
      rememberKeywords: [],
      rememberScope: null,
      status: 'Pending',
    });

    expect(values).toMatchObject({ amount: 42.5, categoryId: noneValue, direction: 'expense', pending: true });
  });
});
