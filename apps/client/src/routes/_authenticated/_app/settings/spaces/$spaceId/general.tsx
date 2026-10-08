import { createFileRoute } from '@tanstack/react-router';

import { SpaceGeneral } from '@/app/settings/spaces/general';

/** `/settings/spaces/$spaceId/general`: space details and deletion. */
export const Route = createFileRoute('/_authenticated/_app/settings/spaces/$spaceId/general')({
  component: SpaceGeneral,
});
