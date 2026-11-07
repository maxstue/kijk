import { CardDescription, CardHeader, CardTitle } from '@kijk/ui/components/card';

import { steps, type StepValue, stepTitle, stepDescription } from './steps';
interface WelcomeStepHeaderProps {
  currentStep: StepValue;
}
export function WelcomeStepHeader({ currentStep }: WelcomeStepHeaderProps) {
  return (
    <div className='grid'>
      {steps.map((step, index) => {
        const isActive = currentStep === step.value;

        return (
          <CardHeader
            key={step.value}
            aria-hidden={!isActive}
            className={`col-start-1 row-start-1 ${isActive ? '' : 'invisible'}`}
            inert={!isActive}
          >
            <CardTitle>{stepTitle(index)}</CardTitle>
            <CardDescription>{stepDescription(index)}</CardDescription>
          </CardHeader>
        );
      })}
    </div>
  );
}
