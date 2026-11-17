/** Wraps rows in the response of a list endpoint without a page, as selects and fixtures read it. */
export function listPage<TItem>(items: TItem[]) {
  return { items, page: 1, pageSize: items.length, totalCount: items.length };
}
