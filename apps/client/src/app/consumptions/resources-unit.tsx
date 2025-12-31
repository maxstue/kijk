import type { Resource, ResourceStats } from '@/shared/types/app';

interface Props {
  type?: Resource | ResourceStats;
}

export function ResourceUnit({ type }: Props) {
  if (!type) {
    return <span className='text-xs'>-</span>;
  }

  return (
    <div className='flex items-center'>
      <span className='text-xs' style={{ color: type.color }}>
        {type.unit}
      </span>
    </div>
  );
}
