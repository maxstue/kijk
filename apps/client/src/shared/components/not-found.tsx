import { buttonVariants } from '@kijk/ui/components/button';
import { Link } from '@tanstack/react-router';

import { AppBrand } from '@/shared/components/app-brand';

export function NotFound() {
  return (
    <main className='flex min-h-full flex-col items-center justify-center gap-6 p-6 text-center'>
      <AppBrand />
      <div className='space-y-2'>
        <h1 className='text-2xl font-bold'>Page not found</h1>
        <p className='text-muted-foreground'>The page you are looking for does not exist.</p>
      </div>
      <Link className={buttonVariants()} to='/'>
        Back to home
      </Link>
    </main>
  );
}
