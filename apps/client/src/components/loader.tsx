import { Icons } from '@/components/icons';

export function Loader() {
  return (
    <div className='flex items-center justify-center'>
      <Icons.spinner className='animate-spin' />
    </div>
  );
}
