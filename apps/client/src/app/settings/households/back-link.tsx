import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

import { useHouseholdSettings } from './context';

export function HouseholdBackLink() {
  const { household } = useHouseholdSettings();
  return (
    <Link
      className='text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm'
      params={{ householdId: household.id }}
      to='/settings/households/$householdId'
    >
      <ArrowLeft className='size-4' />
      {household.name}
    </Link>
  );
}
