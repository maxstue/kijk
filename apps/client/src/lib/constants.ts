export const siteConfig = {
  name: 'kijk',
  url: 'https://kijk-maxstue.vercel.app/',
  description: 'Beautifully designed Budget book built with shadcn/ui and nextjs',
  links: {
    github: 'https://github.com/maxstue/kijk' as string,
  },
} as const;

/** Icon: available icons come from the "Icons" file */
export const settingsNav = [
  { to: 'profile', label: 'Profile', shortCutKey: '⇧⌘P', icon: 'user' },
  { to: 'account', label: 'Account', shortCutKey: undefined, icon: 'settings' },
  { to: 'appearance', label: 'Appearance', shortCutKey: undefined, icon: 'monitor' },
  { to: 'notifications', label: 'Notifications', shortCutKey: undefined, icon: 'bellRing' },
  { to: 'categories', label: 'Categories', shortCutKey: undefined, icon: 'category' },
] as const;

export const themeStorageKey = 'theme';
