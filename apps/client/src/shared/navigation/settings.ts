import { InfoIcon, MonitorIcon, UserIcon } from '@kijk/ui/components/icons';
import { RulerIcon } from 'lucide-react';

/** Route segments of the settings pages. */
export const settingsTo = ['profile', 'appearance', 'units', 'space-units', 'info'] as const;

/** Navigation entries of the settings pages. */
export const settingsNav = [
  { icon: UserIcon, label: 'Profile', shortCutKey: '⇧⌘P', to: settingsTo[0] },
  { icon: MonitorIcon, label: 'Appearance', shortCutKey: undefined, to: settingsTo[1] },
  { icon: RulerIcon, label: 'Units', shortCutKey: undefined, to: settingsTo[2] },
  { icon: InfoIcon, label: 'Info', shortCutKey: undefined, to: settingsTo[4] },
] as const;

/** Settings navigation grouped by section. */
export const settingsNavGroups = [
  {
    items: [settingsNav[0], settingsNav[1], settingsNav[2]],
    label: 'Personal',
  },
  {
    items: [],
    label: 'Space',
  },
  {
    items: [settingsNav[3]],
    label: 'Administration',
  },
] as const;
