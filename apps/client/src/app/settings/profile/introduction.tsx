import { queryKeys } from '@kijk/api/query-keys';
import * as usersOptions from '@kijk/api/users/options';
import { Button } from '@kijk/ui/components/button';
import { useIsMutating, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

/** Resets the optional tour independently of profile edits and account onboarding. */
export function IntroductionSettings() {
  const reset = useMutation(usersOptions.resetGuideMutationOptions());
  const saving = useIsMutating({ mutationKey: queryKeys.users.guide }) > 0;
  return (
    <section aria-labelledby='introduction-heading' className='space-y-3 border-t pt-6'>
      <div className='space-y-1'>
        <h2 id='introduction-heading' className='font-medium'>
          Getting started
        </h2>
        <p className='text-muted-foreground text-sm'>
          Reset your tour checklist and completion date. Getting started will open automatically the next time you
          reload a space. Your profile, spaces and recorded data stay as they are.
        </p>
      </div>
      <Button
        variant='outline'
        disabled={saving}
        onClick={() =>
          reset.mutate(undefined, {
            onSuccess: () => toast.success('Introduction reset. Reload a space to start fresh.'),
            onError: () => toast.error('Could not reset the introduction. Please try again.'),
          })
        }
      >
        {reset.isPending ? 'Resetting…' : 'Reset introduction'}
      </Button>
    </section>
  );
}
