import React from 'react';

import { CardSkeleton } from '@/components/card-skeleton';
import { Heading } from '@/components/heading';

export default function SettingPageLoading() {
  return (
    <div className='grid items-start gap-8'>
      <Heading heading='Einstellungen' text='Verwalte deine Einstellungen' />
      <div className='grid gap-10 px-2'>
        <CardSkeleton />
      </div>
    </div>
  );
}
