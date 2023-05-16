import { Route } from 'next';

// TODO
export const siteConfig = {
  name: 'kijk',
  url: 'https://ui.shadcn.com',
  ogImage: 'https://ui.shadcn.com/og.jpg',
  description: 'Beautifully designed components built with Radix UI and Tailwind CSS.',
  links: {
    github: 'https://github.com/maxstue/kijk' as Route,
  },
};

export type SiteConfig = typeof siteConfig;
