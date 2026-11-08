import { useEffect } from 'react';
/** Switches to the inactive favicon while the tab is hidden. Renders nothing. */
export function Favicon() {
  useEffect(() => {
    function updateIcon() {
      const link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (link) {
        link.href = document.hidden ? '/favicon_inactive.svg' : '/favicon.svg';
      }
    }
    updateIcon();
    document.addEventListener('visibilitychange', updateIcon);
    return () => document.removeEventListener('visibilitychange', updateIcon);
  }, []);
  return null;
}
