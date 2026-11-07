import type { UseFormReturn } from 'react-hook-form';

import type { UserStepFormDraft, UserStepFormValues } from '@/app/welcome/schemas';

export const steps = [
  { label: 'Profile', value: 'profile' },
  { label: 'Space', value: 'space' },
  { label: 'Privacy', value: 'privacy' },
  { label: 'Review', value: 'review' },
] as const;

export const stepOrder = steps.map(({ value }) => ({ value }));

export type StepValue = (typeof steps)[number]['value'];

export function stepTitle(step: number) {
  return ['Welcome to Kijk', 'Set up your space', 'Choose your privacy settings', 'Review your setup'][step];
}

export function stepDescription(step: number) {
  return [
    'Confirm the profile information connected to your account.',
    'Choose a name and whether to add all default resource types.',
    'Choose whether to share optional usage and route-performance data to help improve Kijk.',
    'Everything can be changed later in settings.',
  ][step];
}

export function validateStep(form: UseFormReturn<UserStepFormDraft, unknown, UserStepFormValues>, currentStep: number) {
  const fieldsByStep = [
    ['displayName', 'useExternalProfile'],
    ['spaceName', 'useDefaultResources'],
    ['analyticsConsent'],
  ] satisfies Array<Array<keyof UserStepFormDraft>>;
  const fields = fieldsByStep[currentStep];

  return form.trigger(fields, { shouldFocus: true });
}
