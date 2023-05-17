import React, { ReactNode, Suspense } from 'react';

import { UserConfigNavSide } from '@/app/(home)/(user-config)/(components)/user-config-nav-side';

interface Props {
  children: ReactNode;
}

export default async function UserConfiglayout({ children }: Props) {
  return (
    <div className='grid flex-1 gap-12 pt-6  md:grid-cols-[200px_1fr]'>
      <aside className='hidden flex-col md:flex'>
        <Suspense fallback={<Fallback />}>
          <UserConfigNavSide />
        </Suspense>
      </aside>
      <div className='flex w-full flex-1 flex-col overflow-hidden'>{children}</div>
    </div>
  );
}

function Fallback() {
  return <>Loading ...</>;
}
