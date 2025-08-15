import { siteConfig } from '@/constants/config';
import { HomeLayoutProps } from 'fumadocs-ui/home-layout';

import { Logo } from '@/components/logo';

import { NavChildren } from './layout.client';

// shared configuration
export const baseOptions: HomeLayoutProps = {
  githubUrl: siteConfig.links.github,
  nav: {
    title: (
      <>
        <Logo className='size-4' fill='currentColor' />
        <span className='font-medium max-md:[header_&]:hidden'>{siteConfig.name}</span>
      </>
    ),
    enabled: true,
    transparentMode: 'top',
    url: '/',
    children: <NavChildren />,
  },
  links: [
    {
      text: 'Documentation',
      url: '/docs',
      active: 'nested-url',
    },
  ],
};
