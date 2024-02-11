import { env } from '@/shared/env';

export default function DevModeIndicator() {
  return env.Mode !== 'production' ? (
    <div className='absolute top-0 z-50 flex w-[100vw] flex-col items-center'>
      <div className='h-1 w-full bg-gradient-to-r from-background via-[#E87B35] to-background'></div>
      <div className=' rounded-b bg-[#E87B35] px-2 pb-1.5 pt-0 text-xs text-white'>{env.Mode}</div>
    </div>
  ) : null;
}
