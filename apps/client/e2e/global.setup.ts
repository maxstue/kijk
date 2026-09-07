import { mkdir } from 'node:fs/promises';

import { clerk, clerkSetup } from '@clerk/testing/playwright';
import { expect, test as setup } from '@playwright/test';

const authFile = 'playwright/.clerk/user.json';

setup.describe.configure({ mode: 'serial' });

setup('configure Clerk testing', async () => {
  await clerkSetup();
});

setup('authenticate the E2E user', async ({ page }) => {
  const emailAddress = process.env.E2E_CLERK_USER_EMAIL;
  if (!emailAddress) {
    throw new Error('E2E_CLERK_USER_EMAIL must contain the email address of a Clerk test user.');
  }

  await page.goto('/privacy');
  await clerk.signIn({ emailAddress, page });
  await page.goto('/home');

  await expect(page).not.toHaveURL(/\/auth(?:\?|$)/);
  await mkdir('playwright/.clerk', { recursive: true });
  await page.context().storageState({ path: authFile });
});
