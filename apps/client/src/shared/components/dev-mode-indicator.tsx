import { env } from '@/shared/env';

/**
 * This component is only used in dev mode. It displays the current mode.
 *
 * @returns DevModeIndicator
 */
export function DevModeIndicator() {
  return (
    <div className='absolute top-0 z-50 flex w-[100vw] flex-col items-center'>
      <div className='h-[2px] w-full bg-gradient-to-r from-background via-[#E87B35] to-background' />
      <div className='rounded-b bg-[#E87B35] px-2 pb-1.5 pt-0 text-xs text-white'>{env.Mode}</div>
    </div>
  );
}
