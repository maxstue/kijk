import type { PropsWithChildren } from 'react';

/** Expand the hit area to at least 44×44px on touch devices */
export function TouchTarget({ children }: PropsWithChildren) {
  return (
    <>
      <span
        aria-hidden='true'
        className='absolute top-1/2 left-1/2 size-[max(100%,2.75rem)] -translate-x-1/2 -translate-y-1/2 [@media(pointer:fine)]:hidden'
      />
      {children}
    </>
  );
}
