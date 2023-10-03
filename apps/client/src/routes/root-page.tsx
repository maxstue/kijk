import { ReactNode } from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

import { UserNav } from '@/app/root/user-nav';
import { Icons } from '@/components/icons';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { siteConfig } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function RootPage() {
  const { login, register, isAuthenticated, user } = useKindeAuth();

  const handleSignup = () => {
    void register({});
  };

  const handleSignin = () => {
    void login({});
  };

  return (
    <>
      {isAuthenticated && user ? (
        <div className='flex min-h-screen flex-col'>
          <header className='bg-background'>
            <SiteHeader>
              <div className='flex space-x-2'>
                <div className='w-full flex-1 md:w-auto md:flex-none'>{/* TODO add <CommandMenu /> */}</div>
                <nav className='flex items-center space-x-1'>
                  <ThemeToggle />
                </nav>
                <div className='ml-auto flex items-center space-x-4'>
                  <UserNav user={user} />
                </div>
              </div>
            </SiteHeader>
          </header>
          <main className='container flex-1'>
            <Outlet />
            <Toaster />
          </main>
          {/* <SiteFooter /> */}
        </div>
      ) : (
        <div className='flex h-full w-full items-center justify-center gap-6'>
          <Button onClick={handleSignup} type='button'>
            Sign up
          </Button>
          <Button onClick={handleSignin} type='button'>
            Sign in
          </Button>
        </div>
      )}
      <TanStackRouterDevtools position='bottom-right' />
    </>
  );
}

interface SProps {
  children?: ReactNode;
}

function SiteHeader({ children }: SProps) {
  return (
    <header className='supports-backdrop-blur:bg-background/60 sticky top-0 z-40 w-full border-b bg-background/95 shadow-sm backdrop-blur'>
      <div className='container flex h-14 items-center'>
        <div className='mr-4 hidden md:flex'>
          <Link to='/' className='mr-6 flex items-center space-x-2'>
            <Icons.logo className='h-6 w-6' />
            <span className='hidden font-bold sm:inline-block'>{siteConfig.name}</span>
          </Link>
          <nav className='hidden gap-6 md:flex'>
            <Link
              to={'/'}
              className={cn(
                'flex items-center text-lg font-medium text-foreground/60 transition-colors hover:text-foreground/80 data-[active]:text-foreground sm:text-sm',
                false && 'cursor-not-allowed opacity-80',
              )}
            >
              Dashboard
            </Link>
            <Link
              to={'/'}
              className={cn(
                'flex items-center text-lg font-medium text-foreground/60 transition-colors hover:text-foreground/80 data-[active]:text-foreground sm:text-sm',
                false && 'cursor-not-allowed opacity-80',
              )}
            >
              Budget
            </Link>
            <Link
              to={'/'}
              className={cn(
                'flex items-center text-lg font-medium text-foreground/60 transition-colors hover:text-foreground/80 data-[active]:text-foreground sm:text-sm',
                false && 'cursor-not-allowed opacity-80',
              )}
            >
              Report
            </Link>
          </nav>
        </div>
        <div className='flex flex-1 items-center justify-between space-x-2 sm:space-x-4 md:justify-end'>{children}</div>
      </div>
    </header>
  );
}

// function SiteFooter() {
//   return (
//     <footer className='border-t py-6 md:py-0'>
//       <div className='container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row'>
//         <div className='flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0'>
//           kijk
//           <p className='text-center text-sm leading-loose text-muted-foreground md:text-left'>
//             Built by{' '}
//             <a
//               href='https://github.com/maxstue'
//               target='_blank'
//               rel='noreferrer'
//               className='font-medium underline underline-offset-4'
//             >
//               maxstue
//             </a>{' '}
//             and inspired by{' '}
//             <a
//               href='https://github.com/shadcn/ui'
//               target='_blank'
//               rel='noreferrer'
//               className='font-medium underline underline-offset-4'
//             >
//               shadcn/ui
//             </a>
//             . Hosted on{' '}
//             <a
//               href='https://vercel.com/'
//               target='_blank'
//               rel='noreferrer'
//               className='font-medium underline underline-offset-4'
//             >
//               vercel
//             </a>
//             . Illustrations by{' '}
//             <a
//               href='https://popsy.co/'
//               target='_blank'
//               rel='noreferrer'
//               className='font-medium underline underline-offset-4'
//             >
//               popsy
//             </a>{' '}
//             . The source code is available on{' '}
//             <a
//               href={siteConfig.links.github}
//               target='_blank'
//               rel='noreferrer'
//               className='font-medium underline underline-offset-4'
//             >
//               GitHub
//             </a>
//             .
//           </p>
//         </div>
//       </div>
//     </footer>
//   );
// }
