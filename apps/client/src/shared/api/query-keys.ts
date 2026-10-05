import type { ImportPreviewParams } from '@/shared/api/imports/types';
import type { TransactionFilters } from '@/shared/api/transactions/types';

const users = {
  me: ['users', 'me'] as const,
};

const households = {
  all: ['households'] as const,
  members: (householdId: string) => [...households.all, 'members', householdId] as const,
  roles: () => [...households.all, 'roles'] as const,
};

const resources = {
  all: ['resources'] as const,
  detail: (id: string) => [...resources.all, 'detail', id] as const,
  list: () => [...resources.all, 'list'] as const,
};

const consumptions = {
  all: ['consumptions'] as const,
  byAll: () => [...consumptions.all, 'usage', 'getBy'] as const,
  by: (year?: string, month?: string) => [...consumptions.all, 'usage', 'getBy', year, month] as const,
  detail: (id: string) => [...consumptions.all, 'detail', id] as const,
  stats: (year?: string, month?: string) => [...consumptions.all, 'stats', year, month] as const,
  statsAll: () => [...consumptions.all, 'stats'] as const,
  years: () => [...consumptions.all, 'years'] as const,
};

const consumptionLimits = {
  all: ['consumption-limits'] as const,
  list: () => [...consumptionLimits.all, 'list'] as const,
};

const categories = {
  all: ['categories'] as const,
  list: () => [...categories.all, 'list'] as const,
};

const accounts = {
  all: ['accounts'] as const,
  list: () => [...accounts.all, 'list'] as const,
};

const budgets = {
  all: ['budgets'] as const,
  list: () => [...budgets.all, 'list'] as const,
  overview: (year: number, month: number) => [...budgets.all, 'overview', year, month] as const,
  statistics: (year: number, month: number, months: number) =>
    [...budgets.all, 'statistics', year, month, months] as const,
};

const transactions = {
  all: ['transactions'] as const,
  list: (filters: TransactionFilters) => [...transactions.all, 'list', filters] as const,
};

const imports = {
  all: ['imports'] as const,
  candidates: (id: string) => [...imports.all, 'candidates', id] as const,
  detail: (id: string) => [...imports.all, 'detail', id] as const,
  aiPreview: (id: string) => [...imports.all, 'ai-preview', id] as const,
  list: () => [...imports.all, 'list'] as const,
  preview: (id: string, params: ImportPreviewParams) => [...imports.all, 'preview', id, params] as const,
  settings: () => [...imports.all, 'settings'] as const,
};

const categoryRules = {
  all: ['category-rules'] as const,
  list: () => [...categoryRules.all, 'list'] as const,
};

const units = {
  all: ['units'] as const,
  list: (includeArchived = false) => [...units.all, 'list', includeArchived] as const,
  page: (
    scope: 'household' | 'personal',
    householdId: string | undefined,
    page: number,
    pageSize: number,
    search: string,
  ) => [...units.all, 'page', scope, householdId, page, pageSize, search] as const,
  system: () => [...units.all, 'system'] as const,
};

/** Query keys for the API queries and mutations. */
export const queryKeys = {
  accounts,
  budgets,
  categories,
  categoryRules,
  consumptionLimits,
  consumptions,
  households,
  imports,
  resources,
  transactions,
  units,
  users,
} as const;
