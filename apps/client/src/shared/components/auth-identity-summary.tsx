import { Avatar, AvatarFallback, AvatarImage } from '@kijk/ui/components/avatar';

interface AuthIdentitySummaryProps {
  email: string;
  fullName: string;
  imageUrl: string;
  provider: string;
}

export function AuthIdentitySummary({ email, fullName, imageUrl, provider }: AuthIdentitySummaryProps) {
  return (
    <div className='bg-muted/40 flex items-center gap-4 rounded-lg border p-4'>
      <Avatar className='size-14'>
        <AvatarImage alt='' src={imageUrl} />
        <AvatarFallback>{email.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <dl className='min-w-0 space-y-1 text-sm'>
        <IdentityItem label='Full name' value={fullName || 'Not provided'} />
        <IdentityItem label='Email' value={email} />
        <IdentityItem label='Signed in with' value={formatProvider(provider)} />
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

function formatProvider(provider: string) {
  return provider.replace('oauth_', '').replaceAll('_', ' ');
}
