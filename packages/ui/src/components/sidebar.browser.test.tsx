import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-react';

import { SidebarProvider, useSidebar } from './sidebar';

test('a reloaded sidebar consumer keeps access to an already mounted provider', async () => {
  const screen = await render(
    <SidebarProvider>
      <span>Waiting for updated consumer</span>
    </SidebarProvider>,
  );
  const moduleUrl = new URL('./sidebar.tsx', import.meta.url);
  moduleUrl.searchParams.set('reload', 'sidebar-consumer');
  const reloaded = (await import(/* @vite-ignore */ moduleUrl.href)) as typeof import('./sidebar');

  expect(reloaded.useSidebar).toBe(useSidebar);

  function ReloadedConsumer() {
    const { state, setOpen } = reloaded.useSidebar();
    return <button onClick={() => setOpen(false)}>{state}</button>;
  }

  await screen.rerender(
    <SidebarProvider>
      <ReloadedConsumer />
    </SidebarProvider>,
  );
  await screen.getByRole('button', { name: 'expanded' }).click();
  await expect.element(screen.getByRole('button', { name: 'collapsed' })).toBeVisible();
  await screen.unmount();
});
