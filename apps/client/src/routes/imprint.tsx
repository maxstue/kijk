import { createFileRoute } from '@tanstack/react-router';

import { LegalContact } from '@/shared/components/legal-contact';

/** `/imprint`: legal notice (Impressum) according to § 5 DDG. */
export const Route = createFileRoute('/imprint')({ component: Imprint });

function Imprint() {
  return (
    <main className='mx-auto max-w-3xl space-y-8 px-4 py-12'>
      <header className='space-y-2'>
        <h1 className='text-3xl font-semibold'>Imprint</h1>
        <p className='text-muted-foreground'>Impressum – information according to § 5 DDG</p>
      </header>

      <section className='space-y-3'>
        <h2 className='text-xl font-semibold'>Operator</h2>
        <LegalContact />
      </section>
    </main>
  );
}
