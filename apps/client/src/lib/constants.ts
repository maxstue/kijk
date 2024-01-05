export const siteConfig = {
  name: 'kijk',
  url: 'https://kijk-maxstue.vercel.app/',
  description: 'Beautifully designed Budget book built with shadcn/ui and nextjs',
  links: {
    github: 'https://github.com/maxstue/kijk' as string,
  },
} as const;

export const settingsTo = ['profile', 'account', 'appearance', 'notifications', 'categories'] as const;

/** Icon: available icons come from the "Icons" file */
export const settingsNav = [
  { to: settingsTo[0], label: 'Profile', shortCutKey: '⇧⌘P', icon: 'user' },
  { to: settingsTo[1], label: 'Account', shortCutKey: undefined, icon: 'settings' },
  { to: settingsTo[2], label: 'Appearance', shortCutKey: undefined, icon: 'monitor' },
  { to: settingsTo[3], label: 'Notifications', shortCutKey: undefined, icon: 'bellRing' },
  { to: settingsTo[4], label: 'Categories', shortCutKey: undefined, icon: 'category' },
] as const;

export const themeStorageKey = 'theme';
