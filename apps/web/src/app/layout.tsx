import React, { Suspense } from 'react';

import { fontMono } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { Analytics } from '@/components/analytics';
import { ThemeProvider } from '@/components/theme-provider';

import '@/styles/globals.css';

import { Link } from 'lucide-react';

import { LandingnNavActions } from '@/app/landing-nav-actions';
import { siteConfig } from '@/lib/constants';
import { Logo } from '@/components/Logo';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

// import Script from 'next/script';

export const metadata = {
  title: {
    default: 'kijk',
    template: `%s | kijk`,
  },
  keywords: ['Next.js', 'React', 'Tailwind CSS', 'Server Components', 'Radix UI'],
  authors: [
    {
      name: 'maxstue',
    },
  ],
  creator: 'maxstue',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head />
      <body className={cn('min-h-screen bg-background font-sans antialiased', fontMono.variable)}>
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          <div className='flex min-h-screen flex-col'>
            <header className='bg-background'>
              <Suspense fallback={<NavLoading />}>
                <SiteHeader>
                  <LandingnNavActions />
                </SiteHeader>
              </Suspense>
            </header>
            <main className='container flex-1'>{children}</main>
            <SiteFooter />
          </div>
          <Suspense>
            <Analytics />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}

function NavLoading() {
  return (
    <header className='supports-backdrop-blur:bg-background/60 sticky top-0 z-40 w-full border-b bg-background/95 shadow-sm backdrop-blur'>
      <div className='container flex h-14 items-center'>
        <div className='mr-4 hidden md:flex'>
          <Link href='/' className='mr-6 flex items-center space-x-2'>
            <Logo className='h-6 w-6' />
            <span className='hidden font-bold sm:inline-block'>{siteConfig.name}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
