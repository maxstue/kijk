import { baseOptions } from '@/app/layout.config';
import { siteConfig } from '@/constants/config';
import { HomeLayout } from 'fumadocs-ui/home-layout';
import { ReactNode } from 'react';

export default function Layout({
  children,
}: {
  children: ReactNode;
}): React.ReactElement {
  return (
    <HomeLayout {...baseOptions}>
      {children}
      <Footer />
    </HomeLayout>
  );
}

function Footer(): React.ReactElement {
  return (
    <footer className="mt-auto border-t bg-card py-12 text-secondary-foreground">
      <div className="container flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-sm font-semibold">Kijk</p>
          <p className="text-xs">
            Built with ❤️ by{' '}
            <a
              href={siteConfig.url}
              rel="noreferrer noopener"
              target="_blank"
              className="font-medium"
            >
              maxstue
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
