import { useSyncExternalStore } from 'react';

import { config } from '@/shared/config';
import { capitalizeFirstLetter } from '@/shared/utils/string';

/** Displays the current development mode, viewport and CSS breakpoint. */
export function DevModeIndicator() {
  const dimensions = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [width, height] = dimensions.split('x').map(Number);

  return (
    <div className='pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center'>
      <div className='from-background to-background h-0.5 w-full bg-linear-to-r via-[#E87B35]' />
      <div className='group pointer-events-auto flex items-center gap-2 rounded-b bg-[#E87B35] px-2 py-1.5 text-xs font-medium text-white shadow-sm'>
        <span>{capitalizeFirstLetter(config.Mode)}</span>
        <span className='sm:hidden'>XS</span>
        <span className='hidden sm:inline md:hidden'>SM</span>
        <span className='hidden md:inline lg:hidden'>MD</span>
        <span className='hidden lg:inline xl:hidden'>LG</span>
        <span className='hidden xl:inline 2xl:hidden'>XL</span>
        <span className='hidden 2xl:inline'>2XL</span>
        <span className='max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity] duration-200 group-hover:max-w-32 group-hover:opacity-100'>
          {width.toLocaleString()} x {height.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function subscribe(onChange: () => void) {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
}

function getSnapshot() {
  return `${window.innerWidth}x${window.innerHeight}`;
}

const getServerSnapshot = () => '0x0';
