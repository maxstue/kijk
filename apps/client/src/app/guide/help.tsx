import * as usersOptions from '@kijk/api/users/options';
import { Button } from '@kijk/ui/components/button';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';

import { useNavigationSpaceId } from '@/shared/hooks/use-active-space';

/** Permanent entry point to the optional introduction, independent of analytics consent. */
export function GuideHelp() {
  const spaceId = useNavigationSpaceId();
  const update = useMutation(usersOptions.updateGuideMutationOptions());
  const navigate = useNavigate();
  return (
    <section className='space-y-4'>
      <h1 className='text-2xl font-semibold'>Help & introduction</h1>
      <p>
        Record meter readings or consumption, explore your dashboard and optionally set limits. Your introduction is
        voluntary and can be closed at any time.
      </p>
      <p>
        The first absolute meter reading is a baseline. Consumption is calculated from later readings. A relative value
        records the amount used directly.
      </p>
      {spaceId && (
        <div className='flex flex-wrap gap-3'>
          <Button
            disabled={update.isPending}
            onClick={() =>
              update.mutate(
                { hidden: false },
                {
                  onSuccess: () =>
                    void navigate({ to: '/$spaceId', params: { spaceId }, search: { introduction: 'tour' } }),
                },
              )
            }
          >
            Get to know Kijk
          </Button>
          <Button
            variant='outline'
            disabled={update.isPending}
            onClick={() =>
              update.mutate(
                { hidden: false },
                {
                  onSuccess: () =>
                    void navigate({ to: '/$spaceId', params: { spaceId }, search: { introduction: 'checklist' } }),
                },
              )
            }
          >
            Show checklist on dashboard
          </Button>
          <Link to='/$spaceId' params={{ spaceId }}>
            Back to dashboard
          </Link>
        </div>
      )}
      {update.isError && <p role='alert'>Could not save your preference. Please try again.</p>}
    </section>
  );
}
