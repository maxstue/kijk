import React from 'react';

import { cn } from '@/lib/classnames';
import { fontSans } from '@/lib/fonts';
import { Analytics } from '@/components/analytics';
import { ThemeProvider } from '@/components/theme-provider';

import '@/styles/globals.css';
import { SiteFooter } from '@/components/site-footer';

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
      <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          {children}
          <Analytics />
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
