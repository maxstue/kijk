import { DynamicIcon } from 'lucide-react/dynamic';

import { defaultResourceIcon, isResourceIconName } from '@/shared/lib/resource-icons';

interface Props {
  className?: string;
  color?: string;
  name: string;
  testId?: string;
}

export function ResourceIcon({ className, color, name, testId }: Props) {
  const iconName = isResourceIconName(name) ? name : defaultResourceIcon;

  return <DynamicIcon aria-hidden className={className} color={color} data-testid={testId} name={iconName} />;
}
