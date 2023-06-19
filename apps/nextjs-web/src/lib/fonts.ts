import { JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';

// Inter as FontSans
// export const fontSans = FontSans({
//   subsets: ['latin'],
//   variable: '--font-sans',
//   preload: true,
// });

export const fontMono = JetBrains_Mono({
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
