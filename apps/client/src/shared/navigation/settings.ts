import { InfoIcon, MonitorIcon, UserIcon } from '@kijk/ui/components/icons';
import { RulerIcon } from 'lucide-react';

export const settingsTo = ['profile', 'appearance', 'units', 'household-units', 'info'] as const;

export const settingsNav = [
  { icon: UserIcon, label: 'Profile', shortCutKey: '⇧⌘P', to: settingsTo[0] },
  { icon: MonitorIcon, label: 'Appearance', shortCutKey: undefined, to: settingsTo[1] },
  { icon: RulerIcon, label: 'Units', shortCutKey: undefined, to: settingsTo[2] },
  { icon: InfoIcon, label: 'Info', shortCutKey: undefined, to: settingsTo[4] },
] as const;

export const settingsNavGroups = [
  {
    items: [settingsNav[0], settingsNav[1], settingsNav[2]],
    label: 'Personal',
  },
  {
    items: [],
    label: 'Household',
  },
  {
    items: [settingsNav[3]],
    label: 'Administration',
  },
] as const;
