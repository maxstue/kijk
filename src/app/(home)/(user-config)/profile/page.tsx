import React from 'react';

import { Heading } from '@/components/heading';

export default async function ProfilePage() {
  return (
    <div className='grid items-start gap-8'>
      <Heading heading='Profile' text='Verwalte dein Profil' />
      <div className='grid gap-10 px-2'>UserPage Content</div>
    </div>
  );
}
