import type { ReactNode } from 'react';

interface Props {
  title: string;
  pending: boolean;
  error: boolean;
  retry: () => void;
  children: ReactNode;
}

export function Section({ title, pending, error, retry, children }: Props) {
  return (
    <section className='space-y-4 rounded-xl border p-5' aria-label={title}>
      <h2 className='text-xl font-semibold'>{title}</h2>
      {pending ? (
        <p role='status'>Loading…</p>
      ) : error ? (
        <div role='alert'>
          Could not load this section.{' '}
          <button className='underline' onClick={retry}>
            Try again
          </button>
        </div>
      ) : (
        children
      )}
    </section>
  );
}
