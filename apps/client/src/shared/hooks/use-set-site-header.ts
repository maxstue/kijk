import { useSiteHeaderStoreActions } from '@/shared/stores/site-header-store';
import { useEffect } from 'react';

/**
 * Custom hook to set the site header title.
 *
 * @param param - Object containing the title to set.
 */
export function useSetSiteHeader(title: string) {
  const { setTitle } = useSiteHeaderStoreActions();

  useEffect(() => {
    setTitle(title);
  }, [title]);
}
