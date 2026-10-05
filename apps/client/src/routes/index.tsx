import { Link, createFileRoute } from '@tanstack/react-router';

/** `/`: public landing page. */
export const Route = createFileRoute('/')({ component: PublicHomePage });

function PublicHomePage() {
  return (
    <div className='bg-background flex min-h-screen flex-col'>
      <header className='mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5'>
        <Link aria-label='Kijk home' className='text-lg font-semibold' to='/'>
          Kijk
        </Link>
        <Link className='text-sm font-medium underline-offset-4 hover:underline' to='/auth'>
          Sign in
        </Link>
      </header>
      <main className='mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-16'>
        <section className='max-w-2xl space-y-6'>
          <p className='text-muted-foreground text-sm font-medium'>Resources and budgets</p>
          <h1 className='text-4xl font-semibold tracking-tight sm:text-6xl'>Understand and plan what you use.</h1>
          <p className='text-muted-foreground max-w-xl text-lg'>
            Track any resource you measure, such as electricity, water or fuel, with limits, and your money with budgets
            – privately for yourself and together in shared spaces with your household, flatmates or partner.
          </p>
          <Link
            className='bg-primary text-primary-foreground hover:bg-primary/90 inline-flex min-h-10 items-center justify-center rounded-md px-5 py-2 text-sm font-medium'
            to='/auth'
          >
            Sign in or create an account
          </Link>
        </section>
      </main>
      <footer className='mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-6 text-sm'>
        <span className='text-muted-foreground'>Kijk – resources and budgets</span>
        <nav aria-label='Legal information' className='flex gap-5'>
          <Link className='underline-offset-4 hover:underline' to='/privacy'>
            Privacy Policy
          </Link>
          <Link className='underline-offset-4 hover:underline' to='/terms'>
            Terms of Service
          </Link>
        </nav>
      </footer>
    </div>
  );
}
