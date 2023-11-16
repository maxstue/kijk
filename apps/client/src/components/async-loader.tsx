import { useEffect, useState } from 'react';

import { Loader } from '@/components/loader';

interface Props {
  delay?: number;
}

export function AsyncLoader({ delay = 250 }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShow(true);
    }, delay);

    return () => {
      clearTimeout(timeout);
    };
  }, [delay]);

  return show ? <Loader /> : null;
}
