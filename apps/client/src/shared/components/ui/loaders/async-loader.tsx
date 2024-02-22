import { useEffect, useState } from 'react';

import { Loader } from '@/shared/components/ui/loaders/loader';
import { cn } from '@/shared/lib/utils';

interface Props {
  delay?: number;
  className?: string;
}

export function AsyncLoader({ className, delay = 250 }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShow(true);
    }, delay);

    return () => {
      clearTimeout(timeout);
    };
  }, [delay]);

  return show ? <Loader className={cn(className)} /> : null;
}
