import { cn } from 'cn';
import { Check } from 'lucide-react';

const steps = ['File', 'Columns', 'Months', 'Review', 'Done'];

/** Shared orientation across the upload and import detail pages. */
export function ImportSteps({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label='Import progress'>
      <ol className='grid grid-cols-5 gap-2'>
        {steps.map((label, index) => (
          <li
            key={label}
            aria-current={index === currentStep ? 'step' : undefined}
            className={cn(
              'relative flex flex-col items-center gap-2 text-xs',
              index === currentStep ? 'text-foreground font-medium' : 'text-muted-foreground',
            )}
          >
            {index < steps.length - 1 && (
              <span
                aria-hidden='true'
                className={cn(
                  'absolute top-4 left-[calc(50%+1.25rem)] h-px w-[calc(100%-1.5rem)]',
                  index < currentStep ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border text-xs',
                index <= currentStep
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-background border-border',
              )}
            >
              {index < currentStep ? <Check aria-label='Completed' className='size-3.5' /> : index + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>
    </nav>
  );
}
