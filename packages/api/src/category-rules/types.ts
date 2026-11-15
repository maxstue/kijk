import type * as Api from '@kijk/api/generated/types';

/** A remembered category correction. */
export type CategoryRule = Api.CategoryRuleResponse;
/** What a category rule matches on. */
export type CategoryRuleScope = Api.CategoryRuleScope;
/** A rule suggested from repeated manual corrections. */
export type CategoryRuleSuggestion = Api.CategoryRuleSuggestionResponse;

/** Remembered category corrections; one page of them when the query names a page. */
export type CategoryRulePage = Api.PageResponseOfCategoryRuleResponse;
/** The columns the category rule list can be sorted by. */
export type CategoryRuleSort = Api.CategoryRuleSort;
