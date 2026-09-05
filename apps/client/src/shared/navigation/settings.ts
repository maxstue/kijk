import { InfoIcon, MonitorIcon, UserIcon } from '@kijk/ui/components/icons';

export const settingsTo = ['profile', 'appearance', 'info'] as const;

export const settingsNav = [
  { icon: UserIcon, label: 'Profile', shortCutKey: '⇧⌘P', to: settingsTo[0] },
  { icon: MonitorIcon, label: 'Appearance', shortCutKey: undefined, to: settingsTo[1] },
  { icon: InfoIcon, label: 'Info', shortCutKey: undefined, to: settingsTo[2] },
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
