import React from 'react';

import { Heading } from '@/components/heading';

export default async function TeamsPage() {
  return (
    <div className='grid items-start gap-8'>
      <Heading heading='Teams' text='Verwalte deine Teams' />
      <div className='grid gap-10 px-2'>TeamsPage Content</div>
    </div>
  );
}
