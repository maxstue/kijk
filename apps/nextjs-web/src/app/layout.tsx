import React, { Suspense } from 'react';

import { cn } from '@/lib/classnames';
import { fontMono } from '@/lib/fonts';
import { Analytics } from '@/components/analytics';
import { ThemeProvider } from '@/components/theme-provider';

import '@/styles/globals.css';

import Script from 'next/script';

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
      <Script
        async
        src='https://analytics.umami.is/script.js'
        data-website-id='8a6e035b-c1d5-4152-9ad9-1fe9f25cfbc4'
        strategy='worker'
      />
      <body className={cn('min-h-screen bg-background font-sans antialiased', fontMono.variable)}>
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          {children}
          <Suspense>
            <Analytics />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
