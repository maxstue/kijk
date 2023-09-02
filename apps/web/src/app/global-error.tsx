'use client';

import ErrorSimple from '@/components/error-simple';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorSimple error={error} reset={reset} />;
}
