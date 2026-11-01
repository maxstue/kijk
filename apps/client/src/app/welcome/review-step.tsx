import { useFormContext, useWatch } from 'react-hook-form';

import type { UserStepFormDraft } from '@/app/welcome/schemas';

export function ReviewStep() {
  const { control } = useFormContext<UserStepFormDraft>();
  const [displayName, useExternalProfile, spaceName, useDefaultResources, analyticsConsent] = useWatch({
    control,
    name: ['displayName', 'useExternalProfile', 'spaceName', 'useDefaultResources', 'analyticsConsent'],
  });

  return (
    <dl className='divide-y rounded-lg border'>
      <ReviewItem label='Username' value={displayName} />
      <ReviewItem label='Sign-in profile' value={useExternalProfile ? 'Name and image used' : 'Not used'} />
      <ReviewItem label='Space' value={spaceName} />
      <ReviewItem label='Default resources' value={useDefaultResources ? 'All defaults' : 'None'} />
      <ReviewItem label='Analytics and tracing' value={analyticsConsent === 'Accepted' ? 'Shared' : 'Not shared'} />
    </dl>
  );
}

interface ReviewItemProps {
  label: string;
  value: string;
}

function ReviewItem({ label, value }: ReviewItemProps) {
  return (
    <div className='grid gap-1 px-4 py-3 sm:grid-cols-2'>
      <dt className='text-muted-foreground text-sm'>{label}</dt>
      <dd className='font-medium sm:text-right'>{value}</dd>
    </div>
  );
}
