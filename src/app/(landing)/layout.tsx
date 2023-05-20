import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { LandingnNavActions } from '@/app/(landing)/(components)/landing-nav-actions';

interface Props {
  children: React.ReactNode;
}

export default function LandingLayout({ children }: Props) {
  return (
    <div className='flex min-h-screen flex-col'>
      <header className='bg-background'>
        <SiteHeader>
          <LandingnNavActions />
        </SiteHeader>
      </header>
      <main className='container flex-1'>{children}</main>
      <SiteFooter />
    </div>
  );
}
