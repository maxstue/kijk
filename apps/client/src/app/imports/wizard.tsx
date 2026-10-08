import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

import { ImportSteps } from '@/app/imports/steps';

/** Stable page frame shared by every step of the import wizard. */
export function ImportWizard({
  children,
  currentStep,
  title,
  description,
  context,
}: {
  children: ReactNode;
  currentStep?: number;
  title: string;
  description: string;
  context?: ReactNode;
}) {
  return (
    <div className='mx-auto w-full max-w-5xl space-y-8 py-6'>
      <Link
        className='text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm'
        to='/finances/imports'
      >
        <ArrowLeft className='size-4' /> Import history
      </Link>
      {currentStep !== undefined && <ImportSteps currentStep={currentStep} />}
      <div className='space-y-3'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-semibold tracking-tight'>{title}</h1>
          <p className='text-muted-foreground text-sm'>{description}</p>
        </div>
        {context && <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>{context}</div>}
      </div>
      {children}
    </div>
  );
}
