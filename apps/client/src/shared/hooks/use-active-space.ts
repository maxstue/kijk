import { currentUserQueryOptions } from '@kijk/api/users/options';
import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';

/** Returns the id of the space in the URL; only use it below the `/$spaceId` route. */
export function useSpaceId() {
  return useParams({ from: '/_authenticated/_app/$spaceId' }).spaceId;
}

/** Returns the current user's membership of the space in the URL, or `undefined` outside a space or while loading. */
export function useActiveSpace() {
  const { spaceId } = useParams({ strict: false });
  const { data } = useQuery(currentUserQueryOptions());
  return data?.user?.spaces?.find((entry) => entry.id === spaceId);
}
