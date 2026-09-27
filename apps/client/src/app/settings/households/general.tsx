import { Card, CardContent } from '@kijk/ui/components/card';
import { Separator } from '@kijk/ui/components/separator';

import { HouseholdBackLink } from './back-link';
import { useHouseholdSettings } from './context';

export function HouseholdGeneral() {
  const { household } = useHouseholdSettings();
  return (
    <div className='mx-auto w-full max-w-4xl space-y-6'>
      <HouseholdBackLink />
      <div>
        <h2 className='text-lg font-medium'>General</h2>
        <p className='text-muted-foreground text-sm'>Basic information about {household.name}.</p>
      </div>
      <Separator />
      <Card>
        <CardContent className='space-y-5'>
          <div>
            <div className='text-muted-foreground text-sm'>Name</div>
            <div className='font-medium'>{household.name}</div>
          </div>
          <Separator />
          <div>
            <div className='text-muted-foreground text-sm'>Description</div>
            <div>{household.description || 'No description added.'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
