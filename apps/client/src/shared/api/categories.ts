import { apiClient } from '@/shared/lib/api-client';
import type { CategoryFormValues } from '@/app/settings/categories/schemas';
import type { Category, GroupedCategory } from '@/shared/types/app';

const ENDPOINT = 'categories';

export function getCategories(signal?: AbortSignal) {
  return apiClient.get<GroupedCategory>({
    url: ENDPOINT,
    signal,
  });
}

export function createCategory(data: CategoryFormValues, signal?: AbortSignal) {
  return apiClient.post<Category>({
    url: ENDPOINT,
    data,
    signal,
  });
}

export function updateCategory(data: { categoryId: string; category: CategoryFormValues }, signal?: AbortSignal) {
  return apiClient.put({
    url: `${ENDPOINT}/${data.categoryId}`,
    data: data.category,
    signal,
  });
}

export function deleteCategory(categoryId: string, signal?: AbortSignal) {
  return apiClient.delete({
    url: `${ENDPOINT}/${categoryId}`,
    signal,
  });
}
