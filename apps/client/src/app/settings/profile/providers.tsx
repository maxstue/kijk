import { useUser } from '@clerk/react';
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from '@kijk/ui/components/popover';
import { Info } from 'lucide-react';

const providerLabels: Record<string, string> = {
  github: 'GitHub',
  google: 'Google',
};

export function ConnectedSignInMethods() {
  const { isLoaded, user } = useUser();

  if (!isLoaded || !user) {
    return null;
  }

  const providers = new Map<string, string>();
  for (const { provider } of user.externalAccounts) {
    const key = provider.toLowerCase().replace(/^oauth_/, '');
    const label = providerLabels[key] ?? key.replace(/[_-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
    providers.set(key, label);
  }

  const methods = [
    ...(user.passwordEnabled ? ['Email and password'] : []),
    ...[...providers.entries()].sort(([, first], [, second]) => first.localeCompare(second)).map(([, label]) => label),
  ];

  return (
    <section className='space-y-2 rounded-lg border p-4' aria-labelledby='linked-sign-in-methods-title'>
      <div className='flex items-center gap-2'>
        <h4 id='linked-sign-in-methods-title' className='text-sm font-medium'>
          Linked sign-in methods
        </h4>
        {methods.length > 1 && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type='button'
                aria-label='How account linking works'
                className='text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex size-7 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:outline-none'
              >
                <Info className='size-4' aria-hidden='true' />
              </button>
            </PopoverTrigger>
            <PopoverContent align='start' className='w-80 max-w-[calc(100vw-2rem)] gap-3'>
              <PopoverHeader>
                <PopoverTitle>How account linking works</PopoverTitle>
              </PopoverHeader>
              <p className='text-muted-foreground text-sm'>
                This list shows methods currently linked to your account, not a history of past sign-ins. Our sign-in
                service can link a Google or other provider account when it uses the same email as an existing account.
              </p>
              <ul className='text-muted-foreground list-disc space-y-2 pl-4 text-sm'>
                <li>If the email is verified on both accounts, the service links them automatically.</li>
                <li>If the provider email is unverified, the service asks you to verify it first.</li>
                <li>
                  If the existing account&apos;s email is unverified, the service may require extra security checks,
                  such as changing the password and verifying ownership.
                </li>
                <li>A different email is not linked automatically; add it to your existing account first.</li>
              </ul>
            </PopoverContent>
          </Popover>
        )}
      </div>
      {methods.length > 0 ? (
        <ul className='flex flex-wrap gap-2'>
          {methods.map((method) => (
            <li key={method} className='bg-muted rounded-md px-3 py-1 text-sm'>
              {method}
            </li>
          ))}
        </ul>
      ) : (
        <p className='text-muted-foreground text-sm'>No linked sign-in methods were found.</p>
      )}
      <p className='text-muted-foreground text-xs'>These are the methods currently linked to your account.</p>
    </section>
  );
}
