import type { ReadyCurrentUser } from '@kijk/api/users/types';
import { beforeEach, expect, test, vi } from 'vite-plus/test';

import { getStartSpace, rememberLastSpace } from './spaces';

const storage = vi.hoisted(() => ({
  getItem: vi.fn<(key: string) => string | undefined>(),
  setItem: vi.fn<(key: string, value: string) => void>(),
}));
vi.mock('@kijk/core/lib/browser-storage', () => ({ browserStorage: storage }));
const personal = { id: 'personal', isPersonal: true, isDefault: false };
const shared = { id: 'shared', isPersonal: false, isDefault: false };
const user = (spaces = [shared, personal]) => ({ id: 'user', spaces }) as unknown as ReadyCurrentUser;

beforeEach(() => vi.resetAllMocks());

test('an explicit default wins over the last visited space', () => {
  vi.mocked(storage.getItem).mockReturnValue('personal');
  expect(getStartSpace(user([{ ...shared, isDefault: true }, personal]))?.id).toBe('shared');
});
test('without a default the last visited membership wins', () => {
  vi.mocked(storage.getItem).mockReturnValue('shared');
  expect(getStartSpace(user())?.id).toBe('shared');
});
test('a removed membership falls back to the personal space', () => {
  vi.mocked(storage.getItem).mockReturnValue('removed');
  expect(getStartSpace(user())?.id).toBe('personal');
});
test('last visited spaces are stored per user on this device', () => {
  rememberLastSpace('user', 'shared');
  expect(storage.setItem).toHaveBeenCalledWith('last-space:user', 'shared');
  getStartSpace(user());
  expect(storage.getItem).toHaveBeenCalledWith('last-space:user');
});
test('unavailable or corrupt storage does not prevent opening a space', () => {
  vi.mocked(storage.getItem).mockImplementation(() => {
    throw new Error('Storage unavailable');
  });
  vi.mocked(storage.setItem).mockImplementation(() => {
    throw new Error('Storage unavailable');
  });
  expect(getStartSpace(user())?.id).toBe('personal');
  expect(() => rememberLastSpace('user', 'shared')).not.toThrow();
});
