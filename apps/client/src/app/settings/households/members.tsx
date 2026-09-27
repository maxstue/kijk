import { Card, CardContent } from '@kijk/ui/components/card';
import { Separator } from '@kijk/ui/components/separator';

import { HouseholdBackLink } from './back-link';
import { useHouseholdSettings } from './context';

export function HouseholdMembers() {
  const { household, user } = useHouseholdSettings();
  return (
    <div className='mx-auto w-full max-w-4xl space-y-6'>
      <HouseholdBackLink />
      <div>
        <h2 className='text-lg font-medium'>Members</h2>
        <p className='text-muted-foreground text-sm'>Your membership in {household.name}.</p>
      </div>
      <Separator />
      <Card>
        <CardContent className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <div className='font-medium'>{user.name || user.email || 'You'}</div>
            {user.email && <div className='text-muted-foreground text-sm'>{user.email}</div>}
          </div>
          <span className='bg-muted rounded-md px-2.5 py-1 text-sm'>{household.role.name}</span>
        </CardContent>
      </Card>
      <p className='text-muted-foreground text-sm'>The full member list and member management are not available yet.</p>
    </div>
  );
}
