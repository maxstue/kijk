import * as React from 'react';
import { cva, VariantProps } from 'class-variance-authority';
import { Check, Loader2, X } from 'lucide-react';

import { useMediaQuery } from '@/shared/hooks/use-stepper';
import { cn } from '@/shared/lib/helpers';

import { Button } from './button';
import { Separator } from './separator';

/** Context ********* */

interface StepsContextValue extends StepsProps {
  isClickable?: boolean;
  isError?: boolean;
  isLoading?: boolean;
  isVertical?: boolean;
  isLabelVertical?: boolean;
  stepCount?: number;
}

const StepsContext = React.createContext<StepsContextValue>({
  activeStep: 0,
});

export const useStepperContext = () => React.useContext(StepsContext);

export const StepsProvider: React.FC<{
  value: StepsContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => {
  const isError = value.state === 'error';
  const isLoading = value.state === 'loading';

  const isVertical = value.orientation === 'vertical';
  const isLabelVertical = value.orientation !== 'vertical' && value.labelOrientation === 'vertical';

  return (
    <StepsContext.Provider
      value={{
        ...value,
        isError,
        isLoading,
        isVertical,
        isLabelVertical,
      }}
    >
      {children}
    </StepsContext.Provider>
  );
};

/** Steps ********* */

export interface StepsProps extends React.HTMLAttributes<HTMLDivElement> {
  activeStep: number;
  orientation?: 'vertical' | 'horizontal';
  state?: 'loading' | 'error';
  responsive?: boolean;
  onClickStep?: (step: number) => void;
  successIcon?: React.ReactElement;
  errorIcon?: React.ReactElement;
  labelOrientation?: 'vertical' | 'horizontal';
  children?: React.ReactNode;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
}

export const Steps = React.forwardRef<HTMLDivElement, StepsProps>(
  (
    {
      activeStep = 0,
      state,
      responsive = true,
      orientation: orientationProp = 'horizontal',
      onClickStep,
      labelOrientation = 'horizontal',
      children,
      errorIcon,
      successIcon,
      variant = 'default',
      className,
      ...props
    },
    ref,
  ) => {
    const childArray = React.Children.toArray(children);

    const stepCount = childArray.length;
    const renderHorizontalContent = () => {
      if (activeStep <= childArray.length) {
        return React.Children.map(childArray[activeStep], (node) => {
          if (!React.isValidElement(node)) return;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return React.Children.map(node.props.children, (childNode) => childNode);
        });
      }
      return;
    };

    const isClickable = !!onClickStep;

    const isMobile = useMediaQuery('(max-width: 43em)');

    const orientation = isMobile && responsive ? 'vertical' : orientationProp;

    return (
      <StepsProvider
        value={{
          activeStep,
          orientation,
          state,
          responsive,
          onClickStep,
          labelOrientation,
          isClickable,
          stepCount,
          errorIcon,
          successIcon,
          variant,
        }}
      >
        <div
          {...props}
          ref={ref}
          className={cn(
            'flex w-full flex-1 justify-between gap-4 text-center',
            orientation === 'vertical' ? 'flex-col' : 'flex-row',
            className,
          )}
        >
          {React.Children.map(children, (child, index) => {
            const isCompletedStep = ((React.isValidElement(child) && child.props.isCompletedStep) ??
              index < activeStep) as boolean;
            const isLastStep = index === stepCount - 1;
            const isCurrentStep = index === activeStep;

            const stepProps = {
              index: index,
              isCompletedStep,
              isCurrentStep,
              isLastStep,
            };

            if (React.isValidElement(child)) {
              return React.cloneElement(child, stepProps);
            }

            return;
          })}
        </div>
        {orientation === 'horizontal' && renderHorizontalContent()}
      </StepsProvider>
    );
  },
);

Steps.displayName = 'Steps';

/** Step ********* */

const stepVariants = cva('relative flex flex-row gap-2', {
  variants: {
    isLastStep: {
      true: 'flex-[0_0_auto] justify-end',
      false: 'flex-[1_0_auto] justify-start',
    },
    isVertical: {
      true: 'flex-col',
      false: 'items-center',
    },
    isClickable: {
      true: 'cursor-pointer',
    },
  },
  compoundVariants: [
    {
      isVertical: true,
      isLastStep: true,
      class: 'w-full flex-[1_0_auto] flex-col items-start justify-start',
    },
  ],
});

export interface StepConfig extends StepLabelProps {
  icon?: React.ReactElement;
}

export interface StepProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof stepVariants>, StepConfig {
  isCompletedStep?: boolean;
}

interface StepStatus {
  index: number;
  isCompletedStep?: boolean;
  isCurrentStep?: boolean;
}

interface StepAndStatusProps extends StepProps, StepStatus {
  additionalClassName?: {
    button?: string;
    label?: string;
    description?: string;
  };
}

export const Step = React.forwardRef<HTMLDivElement, StepAndStatusProps>((props, ref) => {
  const {
    children,
    description,
    icon: CustomIcon,
    index,
    isCompletedStep,
    isCurrentStep,
    isLastStep,
    label,
    optional,
    optionalLabel,
    className,
    additionalClassName,
    ...rest
  } = props;

  const {
    isVertical,
    isError,
    isLoading,
    successIcon: CustomSuccessIcon,
    errorIcon: CustomErrorIcon,
    isLabelVertical,
    onClickStep,
    isClickable,
    variant,
  } = useStepperContext();

  const hasVisited = isCurrentStep ?? isCompletedStep;

  const handleClick = (index: number) => {
    if (isClickable && onClickStep) {
      onClickStep(index);
    }
  };

  const Icon = React.useMemo(() => CustomIcon ?? undefined, [CustomIcon]);

  const SuccessIson = React.useMemo(() => CustomSuccessIcon ?? <Check />, [CustomSuccessIcon]);

  const ErrorIcon = React.useMemo(() => CustomErrorIcon ?? <X />, [CustomErrorIcon]);

  const RenderIcon = React.useMemo(() => {
    if (isCompletedStep) return SuccessIson;
    if (isCurrentStep) {
      if (isError) return ErrorIcon;
      if (isLoading) return <Loader2 className='animate-spin' />;
    }
    if (Icon) return Icon;
    return (index || 0) + 1;
  }, [isCompletedStep, SuccessIson, isCurrentStep, Icon, index, isError, ErrorIcon, isLoading]);

  return (
    <div
      {...rest}
      ref={ref}
      aria-disabled={!hasVisited}
      className={cn(
        stepVariants({
          isLastStep,
          isVertical,
          isClickable: isClickable && !!onClickStep,
        }),
        className,
      )}
      onClick={() => {
        handleClick(index);
      }}
    >
      <div className={cn('flex items-center gap-2', isLabelVertical ? 'flex-col' : '')}>
        <Button
          aria-current={isCurrentStep ? 'step' : undefined}
          data-clickable={isClickable}
          data-highlighted={isCompletedStep}
          data-invalid={isCurrentStep && isError}
          disabled={!hasVisited}
          variant={isCurrentStep && isError ? 'destructive' : variant}
          className={cn(
            'aspect-square h-12 w-12 rounded-full data-[highlighted=true]:bg-green-700 data-[highlighted=true]:text-white',
            (isCompletedStep ?? typeof RenderIcon !== 'number') ? 'px-3 py-2' : '',
            additionalClassName?.button,
          )}
        >
          {RenderIcon}
        </Button>
        <StepLabel
          description={description}
          descriptionClassName={additionalClassName?.description}
          label={label}
          labelClassName={additionalClassName?.label}
          optional={optional}
          optionalLabel={optionalLabel}
          {...{ isCurrentStep }}
        />
      </div>
      <Connector
        hasLabel={!!label || !!description}
        index={index}
        isCompletedStep={isCompletedStep ?? false}
        isLastStep={isLastStep}
      >
        {(isCurrentStep ?? isCompletedStep) && children}
      </Connector>
    </div>
  );
});

Step.displayName = 'Step';

/** StepLabel ********* */

interface StepLabelProps {
  label: string | React.ReactNode;
  description?: string | React.ReactNode;
  optional?: boolean;
  optionalLabel?: string | React.ReactNode;
  labelClassName?: string;
  descriptionClassName?: string;
}

const StepLabel = ({
  isCurrentStep,
  label,
  description,
  optional,
  optionalLabel,
  labelClassName,
  descriptionClassName,
}: StepLabelProps & {
  isCurrentStep?: boolean;
}) => {
  const { isLabelVertical } = useStepperContext();

  const shouldRender = !!label || !!description;

  const renderOptionalLabel = !!optional && !!optionalLabel;

  return shouldRender ? (
    <div
      aria-current={isCurrentStep ? 'step' : undefined}
      className={cn(
        'flex w-max flex-col justify-center',
        isLabelVertical ? 'items-center text-center' : 'items-start text-left',
      )}
    >
      {!!label && (
        <p className={labelClassName}>
          {label}
          {renderOptionalLabel && <span className='ml-1 text-xs text-muted-foreground'>({optionalLabel})</span>}
        </p>
      )}
      {!!description && <p className={cn('text-sm text-muted-foreground', descriptionClassName)}>{description}</p>}
    </div>
  ) : undefined;
};

StepLabel.displayName = 'StepLabel';

/** Connector ********* */

interface ConnectorProps extends React.HTMLAttributes<HTMLDivElement> {
  isCompletedStep: boolean;
  isLastStep?: boolean | null;
  hasLabel?: boolean;
  index: number;
}

const Connector = React.memo(({ isCompletedStep, children, isLastStep }: ConnectorProps) => {
  const { isVertical } = useStepperContext();

  if (isVertical) {
    return (
      <div
        data-highlighted={isCompletedStep}
        className={cn(
          'ms-6 mt-1 flex h-auto min-h-[2rem] flex-1 self-stretch border-l-2 ps-8',
          isLastStep ? 'min-h-0 border-transparent' : '',
          isCompletedStep ? 'border-green-700' : '',
        )}
      >
        {!isCompletedStep && <div className='my-4 block h-auto w-full'>{children}</div>}
      </div>
    );
  }

  if (isLastStep) {
    return;
  }

  return (
    <Separator
      className='flex h-[2px] min-h-[auto] flex-1 self-auto data-[highlighted=true]:bg-green-700'
      data-highlighted={isCompletedStep}
      orientation='horizontal'
    />
  );
});

Connector.displayName = 'Connector';
