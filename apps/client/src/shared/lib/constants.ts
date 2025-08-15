export const siteConfig = {
  name: 'kijk',
  url: 'https://kijk-ruby.vercel.app/',
  email: 'mail:kijk@justmax.xyz',
  description: 'Beautifully designed household app built with shadcn/ui and nextjs',
  links: {
    github: 'https://github.com/maxstue/kijk',
    support: 'https://github.com/maxstue/kijk/discussions',
  },
} as const;

export const settingsTo = ['profile', 'account', 'appearance', 'info'] as const;

/** Icon: available icons come from the "Icons" file */
export const settingsNav = [
  { to: settingsTo[0], label: 'Profile', shortCutKey: '⇧⌘P', icon: 'user' },
  { to: settingsTo[1], label: 'Account', shortCutKey: undefined, icon: 'settings' },
  { to: settingsTo[2], label: 'Appearance', shortCutKey: undefined, icon: 'monitor' },
  { to: settingsTo[3], label: 'Info', shortCutKey: undefined, icon: 'info' },
] as const;

export const themeStorageKey = 'theme';
