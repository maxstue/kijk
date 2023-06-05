import { siteConfig } from '@/config/site';

export function SiteFooter() {
  return (
    <footer className='border-t py-6 md:py-0'>
      <div className='container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row'>
        <div className='flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0'>
          kijk
          <p className='text-center text-sm leading-loose text-muted-foreground md:text-left'>
            Built by{' '}
            <a
              href='https://github.com/maxstue'
              target='_blank'
              rel='noreferrer'
              className='font-medium underline underline-offset-4'
            >
              maxstue
            </a>{' '}
            and inspired by{' '}
            <a
              href='https://github.com/shadcn/ui'
              target='_blank'
              rel='noreferrer'
              className='font-medium underline underline-offset-4'
            >
              shadcn/ui
            </a>
            . Hosted on{' '}
            <a
              href='https://vercel.com/'
              target='_blank'
              rel='noreferrer'
              className='font-medium underline underline-offset-4'
            >
              vercel
            </a>
            . Illustrations by{' '}
            <a
              href='https://popsy.co/'
              target='_blank'
              rel='noreferrer'
              className='font-medium underline underline-offset-4'
            >
              popsy
            </a>{' '}
            . The source code is available on{' '}
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
