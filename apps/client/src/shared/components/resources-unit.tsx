import type { Resource, ResourceStats } from '@/shared/types/domain';

import { ResourceIcon } from './resource-icon';

interface Props {
  type?: Resource | ResourceStats;
}

/**
 * A component that displays the unit of a resource. If the resource is not provided, it displays a dash.
 *
 * @param The {@link Props props} of the component.
 */
export function ResourceUnit({ type }: Props) {
  if (!type) {
    return <span className='text-xs'>-</span>;
  }

  return (
    <div className='flex items-center gap-1'>
      <ResourceIcon className='size-3.5' color={type.color} name={type.icon} />
      <span className='text-xs' style={{ color: type.color }}>
        {type.unit}
      </span>
    </div>
  );
}
