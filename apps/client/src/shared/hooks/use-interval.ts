import { useEffect, useRef } from 'react';

/** Calls `callback` immediately and then every `delay` ms; `undefined` pauses the interval. */
export function useInterval(callback: () => void, delay: number | undefined) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }

    if (delay !== undefined) {
      tick();

      const id = setInterval(tick, delay);
      return () => {
        clearInterval(id);
      };
    }
  }, [delay]);
}
