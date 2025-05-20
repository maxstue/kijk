import { Separator } from '@/shared/components/ui/separator';
import { SidebarTrigger } from '@/shared/components/ui/sidebar';
import { useSiteHeaderStore } from '@/shared/stores/site-header-store';

export function SiteHeader() {
  const { title } = useSiteHeaderStore();

  return (
    <>
      <title>{title ? `${title} | Kijk` : 'Kijk'}</title>
      <header className='bg-background sticky inset-x-0 top-0 isolate z-10 flex h-12 shrink-0 items-center gap-2 rounded-t-xl border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
        <div className='flex h-14 w-full items-center gap-2 px-4 lg:gap-2 lg:px-6'>
          <SidebarTrigger className='-ml-1' />
          <Separator className='mx-2 data-[orientation=vertical]:h-4' orientation='vertical' />
          <h1 className='text-base font-medium'>{title}</h1>
        </div>
      </header>
    </>
  );
}
