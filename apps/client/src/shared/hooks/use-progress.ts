import { useEffect, useState } from 'react';
import { useSpring } from 'framer-motion';

import { useInterval } from '@/shared/hooks/use-interval';

export default function useProgress() {
  const [state, setState] = useState<'initial' | 'in-progress' | 'completing' | 'complete'>('initial');

  const value = useSpring(0, {
    damping: 25,
    mass: 0.5,
    stiffness: 300,
    restDelta: 0.1,
  });

  useInterval(
    () => {
      // If we start progress but the bar is currently complete, reset it first.
      if (value.get() === 100) {
        value.jump(0);
      }

      const current = value.get();

      let diff;
      if (current === 0) {
        diff = 15;
      } else if (current < 50) {
        diff = secureRandomInRange(1, 10);
      } else {
        diff = secureRandomInRange(1, 5);
      }

      value.set(Math.min(current + diff, 99));
    },
    state === 'in-progress' ? 750 : undefined,
  );

  useEffect(() => {
    if (state === 'initial') {
      value.jump(0);
    } else if (state === 'completing') {
      value.set(100);
    }

    return value.on('change', (latest) => {
      if (latest === 100) {
        setState('complete');
      }
    });
  }, [value, state]);

  function reset() {
    setState('initial');
  }

  function start() {
    setState('in-progress');
  }

  function done() {
    setState((s) => (s === 'initial' || s === 'in-progress' ? 'completing' : s));
  }

  return { state, value, start, done, reset };
}

function secureRandomInRange(min: number, max: number) {
  const range = max - min + 1;
  let randomValue;
  do {
    randomValue = crypto.getRandomValues(new Uint32Array(1))[0];
  } while (randomValue >= Math.floor(2 ** 32 / range) * range);
  return min + (randomValue % range);
}
