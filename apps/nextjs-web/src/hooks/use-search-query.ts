import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function useSearchQuery() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  const createQueriesString = useCallback(
    (data: { name: string; value: string }[]) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const { name, value } of data) {
        params.set(name, value);
      }
      return params.toString();
    },
    [searchParams]
  );

  const createLinkString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams]
  );

  const pushQueryString = useCallback(
    (query: string) => {
      router.push(pathname + '?' + query);
    },
    [pathname, router]
  );

  const getQueryString = useCallback(
    <T>(name: string, defaultValue?: T) => searchParams.get(name) ?? defaultValue,
    [searchParams]
  );

  const isQuerySet = useCallback((name: string) => searchParams.has(name), [searchParams]);

  return {
    isQuerySet,
    getQueryString,
    pushQueryString,
    createLinkString,
    createQueryString,
    createQueriesString,
  };
}
