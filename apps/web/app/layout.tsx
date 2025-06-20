import { baseUrl } from '@/utils/metadata';

import './global.css';

import { Inter } from 'next/font/google';
import { Viewport } from 'next/types';
import { RootProvider } from 'fumadocs-ui/provider';

import type { ReactNode } from 'react';

import { Body } from './layout.client';

export const metadata = {
  title: {
    default: 'kijk',
    template: `%s | kijk`,
  },
  keywords: ['Next.js', 'React', 'fumadocs', 'Tailwind CSS', 'Server Components', 'Radix UI'],
  authors: [
    {
      name: 'maxstue',
    },
  ],
  creator: 'maxstue',
  metadataBase: baseUrl,
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0A' },
    { media: '(prefers-color-scheme: light)', color: '#fff' },
  ],
};

const inter = Inter({
  subsets: ['latin'],
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang='en' className={inter.className} suppressHydrationWarning>
      <Body>
        <RootProvider>{children}</RootProvider>
      </Body>
    </html>
  );
}
