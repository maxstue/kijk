import React, { Suspense } from 'react';

import { Heading } from '@/components/heading';

export default async function SettingsPage() {
  return (
    <div className='grid items-start gap-8'>
      <Suspense>
        <Heading heading='Einstellungen' text='Verwalte deine Einstellungen' />
      </Suspense>
      <div className='grid gap-10 px-2'>Settingspage Content</div>
    </div>
  );
}
