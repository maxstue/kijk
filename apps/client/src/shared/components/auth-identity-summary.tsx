import { Avatar, AvatarFallback, AvatarImage } from '@kijk/ui/components/avatar';

interface AuthIdentitySummaryProps {
  email?: string | null;
  fullName?: string | null;
  imageUrl?: string | null;
  profileEnabled?: boolean;
  provider: string;
}

export function AuthIdentitySummary({
  email,
  fullName,
  imageUrl,
  profileEnabled = true,
  provider,
}: AuthIdentitySummaryProps) {
  return (
    <div className='bg-muted/40 flex items-center gap-4 rounded-lg border p-4'>
      <Avatar className='size-14'>
        <AvatarImage alt='' src={imageUrl ?? undefined} />
        <AvatarFallback>{email?.slice(0, 2).toUpperCase() ?? '?'}</AvatarFallback>
      </Avatar>
      <dl className='min-w-0 space-y-1 text-sm'>
        <IdentityItem label='Full name' value={profileEnabled ? (fullName ?? 'Not provided') : 'Not used in Kijk'} />
        <IdentityItem label='Email' value={email ?? 'Not provided'} />
        <IdentityItem label='Signed in with' value={provider} />
      </dl>
    </div>
  );
}

function IdentityItem({ label, value }: { label: string; value: string }) {
  return (
    <div className='grid min-w-0 grid-cols-[auto_1fr] gap-2'>
      <dt className='text-muted-foreground'>{label}</dt>
      <dd className='truncate font-medium'>{value}</dd>
    </div>
  );
}
