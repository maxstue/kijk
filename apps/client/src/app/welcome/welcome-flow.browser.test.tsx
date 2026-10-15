import { toast } from 'sonner';
import { beforeEach, expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import type { UserStepFormValues } from './schemas';
import { WelcomeFlow } from './welcome-flow';

const mutation = vi.hoisted(() => ({
  mutateAsync: vi.fn<(values: UserStepFormValues) => Promise<void>>(),
  isPending: false,
}));
vi.mock('./use-welcome-user', () => ({ useWelcomeUser: () => mutation }));
vi.mock('@/shared/hooks/use-sign-in-provider-name', () => ({
  useSignInProviderName: () => ({ providerName: 'Test provider' }),
}));
vi.mock('sonner', () => ({ toast: vi.fn<typeof toast>() }));

beforeEach(() => {
  vi.clearAllMocks();
  mutation.mutateAsync.mockResolvedValue(undefined);
  mutation.isPending = false;
});

function renderWelcome(onComplete = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)) {
  return render(
    <WelcomeFlow
      initialDisplayName='  Max  '
      spaceName='  Family  '
      email='test@example.test'
      fullName='Example User'
      onComplete={onComplete}
    />,
  );
}

async function advanceToReview(screen: Awaited<ReturnType<typeof render>>, share: boolean) {
  await screen.getByRole('radio', { name: share ? /Use profile/ : /Do not use/ }).click();
  await screen.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect.element(screen.getByText('Set up your space', { exact: true })).toBeVisible();
  if (!share) {
    await screen.getByRole('radio', { name: /No defaults/ }).click();
  }
  await screen.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect.element(screen.getByText('Choose your privacy settings', { exact: true })).toBeVisible();
  await screen.getByRole('radio', { name: share ? /Share usage and performance data/ : /Do not share/ }).click();
  await screen.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect.element(screen.getByText('Review your setup', { exact: true })).toBeVisible();
}

test.each([true, false])('submits the explicit profile, resource and privacy choices (share=%s)', async (share) => {
  const onComplete = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const screen = await renderWelcome(onComplete);
  await advanceToReview(screen, share);
  await expect.element(screen.getByText(share ? 'Shared' : 'Not shared', { exact: true })).toBeVisible();
  expect(mutation.mutateAsync).not.toHaveBeenCalled();
  await screen.getByRole('button', { name: 'Finish setup' }).click();
  await vi.waitFor(() => expect(onComplete).toHaveBeenCalledOnce());
  expect(mutation.mutateAsync).toHaveBeenCalledWith({
    displayName: 'Max',
    spaceName: 'Family',
    useExternalProfile: share,
    useDefaultResources: share,
    analyticsConsent: share ? 'Accepted' : 'Declined',
  });
});

test('requires an explicit profile and analytics choice before advancing', async () => {
  const screen = await renderWelcome();
  await screen.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect.element(screen.getByText('Please choose whether Kijk may use your sign-in profile.')).toBeVisible();
  await expect.element(screen.getByText('Welcome to Kijk', { exact: true })).toBeVisible();
  await screen.getByRole('radio', { name: /Do not use/ }).click();
  await screen.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect.element(screen.getByText('Set up your space', { exact: true })).toBeVisible();
  await screen.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect.element(screen.getByText('Choose your privacy settings', { exact: true })).toBeVisible();
  await screen.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect.element(screen.getByText('Please choose whether to allow analytics.')).toBeVisible();
  expect(mutation.mutateAsync).not.toHaveBeenCalled();
});

test('keeps the review available after a failed submission and permits retry', async () => {
  const onComplete = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const screen = await renderWelcome(onComplete);
  await advanceToReview(screen, false);
  mutation.mutateAsync.mockRejectedValueOnce(new Error('Synthetic connection failure'));
  await screen.getByRole('button', { name: 'Finish setup' }).click();
  await vi.waitFor(() =>
    expect(toast).toHaveBeenCalledWith('An error occurred while completing your setup.', {
      description: 'Please try again.',
    }),
  );
  expect(onComplete).not.toHaveBeenCalled();
  await expect.element(screen.getByText('Review your setup', { exact: true })).toBeVisible();
  await screen.getByRole('button', { name: 'Finish setup' }).click();
  await vi.waitFor(() => expect(onComplete).toHaveBeenCalledOnce());
  expect(mutation.mutateAsync).toHaveBeenCalledTimes(2);
});
