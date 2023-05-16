import React from 'react';

import { Heading } from '@/components/heading';

export default async function SettingsPage() {
  return (
    <div className='grid items-start gap-8'>
      <Heading heading='Einstellungen' text='Verwalte deine Einstellungen' />
      <div className='grid gap-10 px-2'>Settingspage Content</div>
    </div>
  );
}
