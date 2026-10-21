import { createFileRoute } from '@tanstack/react-router';

/** `/consumptions`: the overview itself is rendered by the `_overview` layout. */
export const Route = createFileRoute('/_authenticated/_app/$spaceId/consumptions/_overview/')({});
