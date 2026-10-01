import {
  columnFilteringFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_arrIncludes,
  filterFn_equals,
  filterFn_inDateRange,
  filterFn_includesString,
  filterFn_inNumberRange,
  filterFn_weakEquals,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
} from '@tanstack/react-table';

/**
 * Filter functions TanStack Table picks automatically from a column's value type. Registered explicitly because React
 * Table v9 no longer bundles them.
 */
export const autoFilterFns = {
  arrIncludes: filterFn_arrIncludes,
  equals: filterFn_equals,
  inDateRange: filterFn_inDateRange,
  inNumberRange: filterFn_inNumberRange,
  includesString: filterFn_includesString,
  weakEquals: filterFn_weakEquals,
};

/**
 * Sort functions TanStack Table picks automatically from a column's value type. Registered explicitly because React
 * Table v9 no longer bundles them.
 */
export const autoSortFns = {
  alphanumeric: sortFn_alphanumeric,
  basic: sortFn_basic,
  datetime: sortFn_datetime,
  text: sortFn_text,
};

/** Features of the shared `DataTable`: filtering, sorting and pagination. */
export const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: autoFilterFns,
  sortFns: autoSortFns,
});

export type DataTableFeatures = typeof dataTableFeatures;
