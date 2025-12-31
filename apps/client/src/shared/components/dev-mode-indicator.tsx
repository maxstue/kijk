import { useEffect, useState } from 'react';
import { env } from '@/shared/env';

/**
 * This component is only used in dev mode. It displays the current mode, the current dimensions and css breakpoint.
 *
 * @returns DevModeIndicator
 */
export function DevModeIndicator() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function updateDimensions() {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  const { width, height } = dimensions;

  return (
    <div className='pointer-events-none absolute top-0 z-50 flex w-full flex-col items-center'>
      <div className='from-background to-background h-[2px] w-full bg-gradient-to-r via-[#E87B35]' />
      <div className='group pointer-events-auto flex origin-top items-center space-x-2 rounded-b bg-[#E87B35] px-2 pt-0 pb-1.5 text-xs text-white'>
        <div className=' '>{env.Mode}</div>
        <div className='h-4 w-px bg-gray-200' />
        {/* Breakpoint */}
        <div className='flex items-center space-x-1'>
          <span className='sm:hidden'>XS</span>
          <span className='hidden sm:inline md:hidden'>SM</span>
          <span className='hidden md:inline lg:hidden'>MD</span>
          <span className='hidden lg:inline xl:hidden'>LG</span>
          <span className='hidden xl:inline 2xl:hidden'>XL</span>
          <span className='hidden 2xl:inline'>2XL</span>
        </div>
        <div className='relative max-w-0 overflow-hidden pl-1 whitespace-nowrap transition-[max-width,opacity] delay-300 duration-300 ease-in-out group-hover:max-w-[190px]'>
          <span className='inline-block transition-[clip-path] delay-300 duration-[400ms] ease-in-out will-change-transform [clip-path:circle(0%_at_0%_0%)] group-hover:[clip-path:circle(150%_at_0%_0%)]'>
            {width.toLocaleString()} x {height.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
