import type { ImportCandidatesQuery, ImportPreviewParams } from '@kijk/api/imports/types';
import type { TransactionPageQuery } from '@kijk/api/transactions/types';
import type { UnitListQuery } from '@kijk/api/units/types';

/** First key part of every query that belongs to one space. */
export const spaceKeyRoot = 'space';

/** Root of all queries of a space; removing it drops every cached piece of data of the space. */
const space = (spaceId: string) => [spaceKeyRoot, spaceId] as const;

const users = {
  me: ['users', 'me'] as const,
};

const spaces = {
  all: ['spaces'] as const,
  members: (spaceId: string) => [...space(spaceId), 'members'] as const,
  roles: () => [...spaces.all, 'roles'] as const,
};

const resources = {
  all: (spaceId: string) => [...space(spaceId), 'resources'] as const,
  detail: (spaceId: string, id: string) => [...resources.all(spaceId), 'detail', id] as const,
  list: (spaceId: string) => [...resources.all(spaceId), 'list'] as const,
};

const consumptions = {
  all: (spaceId: string) => [...space(spaceId), 'consumptions'] as const,
  byAll: (spaceId: string) => [...consumptions.all(spaceId), 'usage', 'getBy'] as const,
  by: (spaceId: string, year?: string, month?: string) => [...consumptions.byAll(spaceId), year, month] as const,
  detail: (spaceId: string, id: string) => [...consumptions.all(spaceId), 'detail', id] as const,
  stats: (spaceId: string, year?: string, month?: string) => [...consumptions.statsAll(spaceId), year, month] as const,
  statsAll: (spaceId: string) => [...consumptions.all(spaceId), 'stats'] as const,
  years: (spaceId: string) => [...consumptions.all(spaceId), 'years'] as const,
};

const limits = {
  all: (spaceId: string) => [...space(spaceId), 'limits'] as const,
  list: (spaceId: string) => [...limits.all(spaceId), 'list'] as const,
};

const categories = {
  all: (spaceId: string) => [...space(spaceId), 'categories'] as const,
  list: (spaceId: string) => [...categories.all(spaceId), 'list'] as const,
};

const accounts = {
  all: (spaceId: string) => [...space(spaceId), 'accounts'] as const,
  list: (spaceId: string) => [...accounts.all(spaceId), 'list'] as const,
};

const budgets = {
  all: (spaceId: string) => [...space(spaceId), 'budgets'] as const,
  list: (spaceId: string) => [...budgets.all(spaceId), 'list'] as const,
  overview: (spaceId: string, year: number, month: number) =>
    [...budgets.all(spaceId), 'overview', year, month] as const,
  statistics: (spaceId: string, year: number, month: number, months: number) =>
    [...budgets.all(spaceId), 'statistics', year, month, months] as const,
};

const transactions = {
  all: (spaceId: string) => [...space(spaceId), 'transactions'] as const,
  list: (spaceId: string, query: TransactionPageQuery) => [...transactions.all(spaceId), 'list', query] as const,
};

const imports = {
  all: (spaceId: string) => [...space(spaceId), 'imports'] as const,
  candidates: (spaceId: string, id: string) => [...imports.all(spaceId), 'candidates', id] as const,
  candidatesPage: (spaceId: string, id: string, query: ImportCandidatesQuery) =>
    [...imports.candidates(spaceId, id), query] as const,
  detail: (spaceId: string, id: string) => [...imports.all(spaceId), 'detail', id] as const,
  aiPreview: (spaceId: string, id: string) => [...imports.all(spaceId), 'ai-preview', id] as const,
  list: (spaceId: string) => [...imports.all(spaceId), 'list'] as const,
  preview: (spaceId: string, id: string, params: ImportPreviewParams) =>
    [...imports.all(spaceId), 'preview', id, params] as const,
  settings: (spaceId: string) => [...imports.all(spaceId), 'settings'] as const,
};

const categoryRules = {
  all: (spaceId: string) => [...space(spaceId), 'category-rules'] as const,
  list: (spaceId: string) => [...categoryRules.all(spaceId), 'list'] as const,
  suggestions: (spaceId: string) => [...categoryRules.all(spaceId), 'suggestions'] as const,
};

// Units belong to users and are shared with spaces, so their lists name the space in the query.
const units = {
  all: ['units'] as const,
  list: (query: UnitListQuery) => [...units.all, 'list', query] as const,
};

/** Query keys for the API queries and mutations. */
export const queryKeys = {
  accounts,
  budgets,
  categories,
  categoryRules,
  limits,
  consumptions,
  space,
  spaces,
  imports,
  resources,
  transactions,
  units,
  users,
} as const;
