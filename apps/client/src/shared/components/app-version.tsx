import { cn } from '@/shared/lib/helpers';

interface Props {
  className?: string;
}

export function AppVersion({ className }: Props) {
  return <span className={cn('text-2xs', className)}>v{LONG_APP_VERSION}</span>;
}
