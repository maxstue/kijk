import React from 'react';

import { CardSkeleton } from '@/components/card-skeleton';
import { Heading } from '@/components/heading';

export default function ProfilePageLoading() {
  return (
    <div className='grid items-start gap-8'>
      <Heading heading='Profile' text='Verwalte dein Profil' />
      <div className='grid gap-10 px-2'>
        <CardSkeleton />
      </div>
    </div>
  );
}
