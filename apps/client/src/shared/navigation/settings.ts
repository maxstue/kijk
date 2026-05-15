export const settingsTo = ['profile', 'account', 'appearance', 'info'] as const;

/** Icon: available icons come from the "Icons" file */
export const settingsNav = [
  { icon: 'user', label: 'Profile', shortCutKey: '⇧⌘P', to: settingsTo[0] },
  { icon: 'settings', label: 'Account', shortCutKey: undefined, to: settingsTo[1] },
  { icon: 'monitor', label: 'Appearance', shortCutKey: undefined, to: settingsTo[2] },
  { icon: 'info', label: 'Info', shortCutKey: undefined, to: settingsTo[3] },
] as const;
