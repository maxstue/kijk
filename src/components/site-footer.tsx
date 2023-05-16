import { siteConfig } from '@/config/site';

// TODO change text like "Built by shadcn. Hosted on Vercel. Illustrations by Popsy. The source code is available on GitHub."
// TODO add link to "shadcn"
export function SiteFooter() {
  return (
    <footer className='border-t py-6 md:py-0'>
      <div className='container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row'>
        <div className='flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0'>
          kijk
          <p className='text-center text-sm leading-loose text-muted-foreground md:text-left'>
            Built by maxstue and inspired by shadcn/ui . The source code is available on{' '}
            <a
              href={siteConfig.links.github}
              target='_blank'
              rel='noreferrer'
              className='font-medium underline underline-offset-4'
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
