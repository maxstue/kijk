import { Route } from 'next/types';

export const siteConfig = {
  name: 'kijk',
  url: 'https://kijk-maxstue.vercel.app/',
  email: 'mail:kijk@justmax.xyz',
  docs_user: '/docs/user',
  docs_dev: '/docs/developer',
  description: 'Beautifully designed Budget book built with shadcn/ui and nextjs',
  links: {
    github: 'https://github.com/maxstue/kijk' as Route,
  },
} as const;
