import { cn } from '@kijk/core/utils/style';
import { Icons } from '@kijk/ui/components/icons';

import { siteConfig } from '@/shared/config/site';

interface AppBrandProps extends React.ComponentProps<'div'> {
  logoClassName?: string;
  nameClassName?: string;
  showName?: boolean;
}

export function AppBrand({ className, logoClassName, nameClassName, showName = true, ...props }: AppBrandProps) {
  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      <Icons.logo className={cn('text-primary size-10', logoClassName)} />
      {showName && <span className={cn('truncate text-2xl font-bold', nameClassName)}>{siteConfig.name}</span>}
    </div>
  );
}
