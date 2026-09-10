import { cn } from '@kijk/core/utils/style';

import { config } from '@/shared/config';
import { siteConfig } from '@/shared/config/site';

interface Props {
  className?: string;
}

/**
 * A component that displays the current version of the app. The version is retrieved from the {@link config}.
 *
 * @param props The {@link Props} for the component
 */
export function AppVersion({ className }: Props) {
  const isDevelopment = config.Version === 'development';

  if (isDevelopment) {
    return <span className={cn('text-2xs', className)}>Development</span>;
  }

  const label = `v${config.Version} (${config.Commit.slice(0, 7)})`;

  return (
    <a
      className={cn('text-2xs underline underline-offset-4', className)}
      href={`${siteConfig.links.releases}/tag/${config.Version}`}
      rel='noopener noreferrer'
      target='_blank'
    >
      {label}
    </a>
  );
}
