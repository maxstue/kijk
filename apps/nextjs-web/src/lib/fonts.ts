import { JetBrains_Mono as FontMono, Inter as FontSans } from 'next/font/google';
import localFont from 'next/font/local';

export const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
  preload: true,
});

export const fontMono = FontMono({
  subsets: ['latin'],
  variable: '--font-mono',
  preload: true,
});

// TODO add local fonts
// Font files can be colocated inside of `pages`
export const fontHeading = localFont({
  src: '../assets/fonts/CalSans-SemiBold.woff2',
  variable: '--font-heading',
  preload: true,
});
