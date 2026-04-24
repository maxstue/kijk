export const siteConfig = {
  description: 'Beautifully designed household app built with shadcn/ui and nextjs',
  email: 'mail:kijk@justmax.xyz',
  links: {
    github: 'https://github.com/maxstue/kijk',
    support: 'https://github.com/maxstue/kijk/discussions',
  },
  name: 'kijk',
  url: 'https://kijk-ruby.vercel.app/',
} as const;

export const settingsTo = ['profile', 'account', 'appearance', 'info'] as const;

/** Icon: available icons come from the "Icons" file */
export const settingsNav = [
  { icon: 'user', label: 'Profile', shortCutKey: '⇧⌘P', to: settingsTo[0] },
  { icon: 'settings', label: 'Account', shortCutKey: undefined, to: settingsTo[1] },
  { icon: 'monitor', label: 'Appearance', shortCutKey: undefined, to: settingsTo[2] },
  { icon: 'info', label: 'Info', shortCutKey: undefined, to: settingsTo[3] },
] as const;
