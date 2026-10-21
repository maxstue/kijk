'use client';

import { cn } from 'cn';
import { CheckIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from './button';

type StepperProps<TValue extends string> = React.ComponentProps<'div'> & {
  steps: ReadonlyArray<{ value: TValue }>;
  value: TValue;
  onValueChange: (value: TValue) => void;
};

type StepperContextValue = {
  id: string;
  value: string;
  steps: ReadonlyArray<{ value: string }>;
  onValueChange: (value: string) => void;
};

type StepperItemContextValue = {
  value: string;
  index: number;
  state: 'active' | 'completed' | 'inactive';
  disabled: boolean;
};

const StepperContext = React.createContext<StepperContextValue | null>(null);
const StepperItemContext = React.createContext<StepperItemContextValue | null>(null);

function useStepperContext() {
  const context = React.useContext(StepperContext);
  if (!context) {
    throw new Error('Stepper components must be used within Stepper');
  }
  return context;
}

function useStepperItemContext() {
  const context = React.useContext(StepperItemContext);
  if (!context) {
    throw new Error('Stepper item components must be used within StepperItem');
  }
  return context;
}

/** Controlled, horizontal multi-step flow with an explicit step order. */
function Stepper<TValue extends string>({ steps, value, onValueChange, className, ...props }: StepperProps<TValue>) {
  const id = React.useId();

  return (
    <StepperContext value={{ id, value, steps, onValueChange: (nextValue) => onValueChange(nextValue as TValue) }}>
      <div data-slot='stepper' className={cn('flex flex-col gap-6', className)} {...props} />
    </StepperContext>
  );
}

/** Ordered list of the steps. */
function StepperList({ className, 'aria-label': ariaLabel = 'Progress steps', ...props }: React.ComponentProps<'ol'>) {
  return (
    <ol
      data-slot='stepper-list'
      aria-label={props['aria-labelledby'] ? undefined : ariaLabel}
      className={cn('flex w-full min-w-0 pb-2', className)}
      {...props}
    />
  );
}

/** A step with its trigger, indicator and label. */
function StepperItem({
  value,
  completed = false,
  disabled = false,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<'li'>, 'value'> & { value: string; completed?: boolean; disabled?: boolean }) {
  const { steps, value: currentValue } = useStepperContext();
  const index = steps.findIndex((step) => step.value === value);
  const currentIndex = steps.findIndex((step) => step.value === currentValue);
  let state: StepperItemContextValue['state'] = completed ? 'completed' : 'inactive';
  if (value === currentValue) {
    state = 'active';
  }

  return (
    <StepperItemContext value={{ value, index, state, disabled }}>
      <li
        data-slot='stepper-item'
        data-state={state}
        data-completed={completed || index < currentIndex ? '' : undefined}
        className={cn(
          'group/stepper-item relative flex min-w-0 flex-1 flex-col items-center',
          '[--stepper-indicator-size:1.75rem] sm:[--stepper-indicator-size:2.25rem]',
          className,
        )}
        {...props}
      >
        {children}
        {index < steps.length - 1 && (
          <span
            aria-hidden='true'
            data-slot='stepper-separator'
            className="bg-muted-foreground/25 after:bg-primary absolute top-[calc(var(--stepper-indicator-size)/2)] right-[calc(-50%+var(--stepper-indicator-size)/2)] left-[calc(50%+var(--stepper-indicator-size)/2)] h-px overflow-hidden after:absolute after:inset-0 after:origin-left after:scale-x-0 after:transition-transform after:duration-200 after:content-[''] group-data-completed/stepper-item:after:scale-x-100 motion-reduce:after:transition-none"
          />
        )}
      </li>
    </StepperItemContext>
  );
}

/** Button that jumps to its step; arrow keys move focus between enabled triggers. */
function StepperTrigger({ className, disabled, onClick, onKeyDown, ...props }: React.ComponentProps<'button'>) {
  const { id, value: currentValue, onValueChange } = useStepperContext();
  const { value, index, state, disabled: itemDisabled } = useStepperItemContext();
  const isDisabled = disabled || itemDisabled;

  return (
    <button
      type='button'
      id={`${id}-trigger-${index}`}
      data-slot='stepper-trigger'
      data-state={state}
      aria-current={value === currentValue ? 'step' : undefined}
      aria-controls={value === currentValue ? `${id}-content-${index}` : undefined}
      disabled={isDisabled}
      className={cn(
        'group inline-flex min-h-10 w-full min-w-0 flex-col items-center gap-2 rounded-lg text-center text-sm font-medium outline-none',
        'text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 transition-colors focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:text-foreground data-[state=completed]:text-foreground',
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !isDisabled) {
          onValueChange(value);
        }
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
          return;
        }
        const triggers = Array.from(
          event.currentTarget
            .closest('[data-slot="stepper-list"]')!
            .querySelectorAll<HTMLButtonElement>('[data-slot="stepper-trigger"]:not(:disabled)'),
        );
        const currentIndex = triggers.indexOf(event.currentTarget);
        let nextIndex = currentIndex + (event.key === 'ArrowRight' ? 1 : -1);
        if (event.key === 'Home') {
          nextIndex = 0;
        } else if (event.key === 'End') {
          nextIndex = triggers.length - 1;
        }
        const nextTrigger = triggers[nextIndex];
        if (nextTrigger) {
          event.preventDefault();
          nextTrigger.focus();
        }
      }}
      {...props}
    />
  );
}

/** Number or check mark of a step. */
function StepperIndicator({ className, children, ...props }: React.ComponentProps<'span'>) {
  const { index, state } = useStepperItemContext();

  return (
    <>
      <span className='sr-only'>Step {index + 1}:</span>
      <span
        aria-hidden='true'
        data-slot='stepper-indicator'
        className={cn(
          'border-border bg-background text-muted-foreground flex size-(--stepper-indicator-size) shrink-0 items-center justify-center rounded-full border text-xs font-semibold shadow-sm transition-colors',
          'group-hover:border-foreground/30 group-data-[state=active]:border-primary group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground',
          'group-data-[state=completed]:border-primary group-data-[state=completed]:bg-primary group-data-[state=completed]:text-primary-foreground',
          '[&>svg]:size-3.5 [&>svg]:shrink-0 sm:[&>svg]:size-4',
          className,
        )}
        {...props}
      >
        {children ?? (state === 'completed' ? <CheckIcon /> : index + 1)}
      </span>
    </>
  );
}

/** Label of a step. */
function StepperLabel({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot='stepper-label'
      className={cn('max-w-40 min-w-0 text-xs leading-tight font-medium text-balance sm:text-sm', className)}
      {...props}
    />
  );
}

/** Content of a step; `preserveLayout` keeps inactive panels mounted, invisible and inert. */
function StepperContent({
  value,
  preserveLayout = false,
  className,
  ...props
}: React.ComponentProps<'section'> & { value: string; preserveLayout?: boolean }) {
  const { id, steps, value: currentValue } = useStepperContext();
  const index = steps.findIndex((step) => step.value === value);
  const isActive = currentValue === value;
  if (!isActive && !preserveLayout) {
    return null;
  }

  return (
    <section
      id={`${id}-content-${index}`}
      aria-labelledby={`${id}-trigger-${index}`}
      aria-hidden={!isActive ? true : undefined}
      inert={!isActive}
      data-slot='stepper-content'
      data-state={isActive ? 'active' : 'inactive'}
      className={cn(!isActive && 'invisible', className)}
      {...props}
    />
  );
}

/** Goes to the previous step. */
function StepperPrevious({ disabled, onClick, children = 'Previous', ...props }: React.ComponentProps<typeof Button>) {
  const { steps, value, onValueChange } = useStepperContext();
  const previous = steps[steps.findIndex((step) => step.value === value) - 1];

  return (
    <Button
      type='button'
      data-slot='stepper-previous'
      disabled={disabled || !previous}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && previous) {
          onValueChange(previous.value);
        }
      }}
      {...props}
    >
      {children}
    </Button>
  );
}

/** Goes to the next step after optional asynchronous validation succeeds. */
function StepperNext({
  disabled,
  onClick,
  onBeforeNext,
  children = 'Next',
  ...props
}: React.ComponentProps<typeof Button> & { onBeforeNext?: () => boolean | Promise<boolean> }) {
  const { steps, value, onValueChange } = useStepperContext();
  const next = steps[steps.findIndex((step) => step.value === value) + 1];
  const [isPending, setIsPending] = React.useState(false);
  const pending = React.useRef(false);

  async function handleClick(event: Parameters<NonNullable<React.ComponentProps<typeof Button>['onClick']>>[0]) {
    onClick?.(event);
    if (event.defaultPrevented || pending.current || disabled || !next) {
      return;
    }
    pending.current = true;
    setIsPending(true);
    try {
      if ((await onBeforeNext?.()) !== false) {
        onValueChange(next.value);
      }
    } finally {
      pending.current = false;
      setIsPending(false);
    }
  }

  return (
    <Button
      type='button'
      data-slot='stepper-next'
      disabled={disabled || isPending || !next}
      aria-busy={isPending || undefined}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
}

export {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperLabel,
  StepperList,
  StepperNext,
  StepperPrevious,
  StepperTrigger,
};
