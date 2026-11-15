import { rowPaginationFeature, rowSortingFeature, tableFeatures } from '@tanstack/react-table';

/** Features of the shared `DataTable`: sorting and pagination state; the API searches, sorts and pages the rows. */
export const dataTableFeatures = tableFeatures({
  rowPaginationFeature,
  rowSortingFeature,
});

/** Feature set type of {@link dataTableFeatures}; use it for column definitions of `DataTable`. */
export type DataTableFeatures = typeof dataTableFeatures;
