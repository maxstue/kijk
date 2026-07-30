export const settingsTo = ['profile', 'appearance', 'info'] as const;

/** Icon: available icons come from the "Icons" file */
export const settingsNav = [
  { icon: 'user', label: 'Profile', shortCutKey: '⇧⌘P', to: settingsTo[0] },
  { icon: 'monitor', label: 'Appearance', shortCutKey: undefined, to: settingsTo[1] },
  { icon: 'info', label: 'Info', shortCutKey: undefined, to: settingsTo[2] },
] as const;

export const settingsNavGroups = [
  {
    items: [settingsNav[0], settingsNav[1]],
    label: 'Personal',
  },
  {
    items: [settingsNav[2]],
    label: 'Administration',
  },
] as const;
