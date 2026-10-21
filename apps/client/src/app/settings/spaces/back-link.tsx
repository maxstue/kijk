import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

import { useSpaceSettings } from './context';

/** Link back to the space settings overview. */
export function SpaceBackLink() {
  const { space } = useSpaceSettings();
  return (
    <Link
      className='text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm'
      params={{ spaceId: space.id }}
      to='/settings/spaces/$spaceId'
    >
      <ArrowLeft className='size-4' />
      {space.name}
    </Link>
  );
}
