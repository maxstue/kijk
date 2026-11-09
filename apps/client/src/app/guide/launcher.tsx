import * as usersOptions from '@kijk/api/users/options';
import { Button } from '@kijk/ui/components/button';
import { useQuery } from '@tanstack/react-query';

import { GuideChecklist } from './checklist';
import type { GuideContext } from './types';

interface Props extends GuideContext {}

/** Loads user-owned progress before mounting the space-specific introduction. */
export function GuideLauncher({ spaceId, request }: Props) {
  const progress = useQuery(usersOptions.guideQueryOptions());
  if (progress.isPending) {
    return null;
  }
  if (progress.isError) {
    return request ? (
      <p role='alert'>
        Could not load introduction.{' '}
        <Button variant='link' onClick={() => void progress.refetch()}>
          Retry introduction
        </Button>
      </p>
    ) : null;
  }
  return <GuideChecklist key={spaceId} spaceId={spaceId} request={request} progress={progress.data} />;
}
