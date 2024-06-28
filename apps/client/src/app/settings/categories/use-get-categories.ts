import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getCategories } from '@/shared/api/categories';

const getCategoriesQuery = queryOptions({
  queryKey: ['categories'],
  queryFn: ({ signal }) => getCategories(signal),
});

export const useGetCategories = () => useSuspenseQuery(getCategoriesQuery);
