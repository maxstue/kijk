import { useCallback, useEffect } from 'react';

/** Switches to the inactive favicon while the tab is hidden. Renders nothing. */
export const Favicon = () => {
  const updateIcon = useCallback(() => {
    const link = document.querySelector("link[rel='icon'][sizes='any']");
    if (link) {
      const path = document.hidden ? '/favicon_inactive.svg' : '/favicon.svg';
      link.setAttribute('href', path);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('visibilitychange', updateIcon);
    return () => {
      document.removeEventListener('visibilitychange', updateIcon);
    };
  }, [updateIcon]);

  return <></>;
};
