import { Route } from 'next';

export const siteConfig = {
  name: 'kijk',
  url: 'https://kijk-maxstue.vercel.app/',
  description: 'Beautifully designed Budget book built with shadcn/ui and nextjs',
  links: {
    github: 'https://github.com/maxstue/kijk' as Route,
  },
};

export type SiteConfig = typeof siteConfig;
