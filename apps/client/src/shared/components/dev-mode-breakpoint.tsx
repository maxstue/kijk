import { useEffect, useState } from 'react';

/**
 * This component is only used in dev mode. It displays the current window dimensions and the current breakpoint.
 *
 * @returns DevModeBreakpoint
 */
export function DevModeBreakpoint() {
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
    <div className='fixed bottom-5 left-5 z-50 flex items-center space-x-2 rounded bg-[#61371c] px-2.5 py-1 font-mono text-xs font-medium text-white'>
      <span>
        {width.toLocaleString()} x {height.toLocaleString()}
      </span>
      <div className='h-4 w-px bg-gray-800' />
      <span className='sm:hidden'>XS</span>
      <span className='hidden sm:inline md:hidden'>SM</span>
      <span className='hidden md:inline lg:hidden'>MD</span>
      <span className='hidden lg:inline xl:hidden'>LG</span>
      <span className='hidden xl:inline 2xl:hidden'>XL</span>
      <span className='hidden 2xl:inline'>2XL</span>
    </div>
  );
}
