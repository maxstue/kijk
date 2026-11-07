import { Button } from '@kijk/ui/components/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@kijk/ui/components/card';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@kijk/ui/components/collapsible';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { SlidersHorizontal } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface CategorizationProgressProps {
  active: boolean;
}

export function CategorizationProgress({ active }: CategorizationProgressProps) {
  if (!active) {
    return null;
  }
  return (
    <output aria-label='Suggesting categories' className='bg-background/80 absolute inset-0 z-10 backdrop-blur-[1px]'>
      <div className='bg-popover sticky top-40 mx-auto flex w-fit max-w-[calc(100%-2rem)] flex-col items-center gap-2 rounded-lg border p-5 text-center shadow-sm'>
        <SpinnerIcon className='size-6 animate-spin' />
        <p className='text-sm font-medium'>Suggesting categories…</p>
        <p className='text-muted-foreground text-xs'>Please wait. Your transactions will update automatically.</p>
      </div>
    </output>
  );
}

interface ReviewAdjustmentsProps {
  children: ReactNode;
}

export function ReviewAdjustments({ children }: ReviewAdjustmentsProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Collapsible
      open={expanded}
      onOpenChange={setExpanded}
      render={<Card role='region' aria-label='Review and adjust' />}
    >
      <CardHeader className='flex flex-wrap items-center justify-between gap-4'>
        <div className='flex flex-col gap-1'>
          <CardTitle>Review &amp; adjust</CardTitle>
          <CardDescription>Optional: suggest categories, change them manually or exclude transactions.</CardDescription>
        </div>
        <CollapsibleTrigger render={<Button variant='outline' />}>
          <SlidersHorizontal data-icon='inline-start' />
          <span className='grid'>
            <span className='invisible col-start-1 row-start-1' aria-hidden='true'>
              Adjust transactions
            </span>
            <span className='col-start-1 row-start-1'>{expanded ? 'Hide transactions' : 'Adjust transactions'}</span>
          </span>
        </CollapsibleTrigger>
      </CardHeader>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
}
