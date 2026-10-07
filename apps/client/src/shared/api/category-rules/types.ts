import type { components } from '@/shared/api/generated/kijk';

/** A remembered category correction. */
export type CategoryRule = components['schemas']['CategoryRuleResponse'];
/** What a category rule matches on. */
export type CategoryRuleScope = components['schemas']['CategoryRuleScope'];
/** A rule suggested from repeated manual corrections. */
export type CategoryRuleSuggestion = components['schemas']['CategoryRuleSuggestionResponse'];
