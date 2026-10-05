import { createFileRoute } from '@tanstack/react-router';

import { SpaceOverview } from '@/app/settings/spaces/overview';

/** `/settings/spaces/$spaceId/`: space settings overview. */
export const Route = createFileRoute('/_authenticated/_app/settings/spaces/$spaceId/')({
  component: SpaceOverview,
});
