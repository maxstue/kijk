import { useSyncExternalStore } from 'react';

const mobileQuery = '(max-width: 767px)';

function subscribe(onChange: () => void) {
  const mediaQuery = window.matchMedia(mobileQuery);
  mediaQuery.addEventListener('change', onChange);
  return () => mediaQuery.removeEventListener('change', onChange);
}

function getSnapshot() {
  return window.matchMedia(mobileQuery).matches;
}

const getServerSnapshot = () => false;

/** Subscribes to the mobile breakpoint without mirroring the browser state in an Effect. */
export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
