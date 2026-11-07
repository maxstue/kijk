import '@kijk/ui/globals.css';
import { Button } from '@kijk/ui/components/button';
import { expect, onTestFinished, test } from 'vite-plus/test';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from './page-header';
import { PageToolbar, PageToolbarActions, PageToolbarControls } from './page-toolbar';

test.each([360, 1024])(
  'keeps toolbar actions above controls on mobile and beside them on desktop at %i px',
  async (width) => {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    await page.viewport(width, 768);
    onTestFinished(() => page.viewport(viewport.width, viewport.height));
    const content = (actions: boolean) => (
      <PageToolbar>
        <PageToolbarControls>
          <Button variant='outline'>Filters</Button>
        </PageToolbarControls>
        {actions && (
          <PageToolbarActions>
            <Button>Add transaction</Button>
          </PageToolbarActions>
        )}
      </PageToolbar>
    );
    const screen = await render(content(true));
    onTestFinished(() => screen.unmount());
    await expect
      .poll(() => {
        const controls = screen.getByRole('button', { name: 'Filters' }).element().getBoundingClientRect();
        const actions = screen.getByRole('button', { name: 'Add transaction' }).element().getBoundingClientRect();
        return width < 640
          ? actions.bottom < controls.top
          : Math.abs(actions.top - controls.top) < 2 && actions.left > controls.right;
      })
      .toBe(true);
    await screen.rerender(content(false));
    await expect.element(screen.getByRole('button', { name: 'Add transaction' })).not.toBeInTheDocument();
    await expect
      .poll(() => {
        const controls = screen.getByRole('button', { name: 'Filters' }).element();
        const toolbar = controls.closest('[data-slot="page-toolbar"]')!;
        return toolbar.getBoundingClientRect().height === controls.getBoundingClientRect().height;
      })
      .toBe(true);
  },
);

test.each([360, 1024])(
  'keeps header actions above content on mobile and beside it on desktop at %i px',
  async (width) => {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    await page.viewport(width, 768);
    onTestFinished(() => page.viewport(viewport.width, viewport.height));
    const screen = await render(
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Units</PageHeaderTitle>
          <PageHeaderDescription>Manage measurement units.</PageHeaderDescription>
        </PageHeaderContent>
        <PageHeaderActions>
          <Button>Add unit</Button>
        </PageHeaderActions>
      </PageHeader>,
    );
    onTestFinished(() => screen.unmount());
    await expect
      .poll(() => {
        const heading = screen.getByRole('heading', { name: 'Units' }).element().getBoundingClientRect();
        const actions = screen.getByRole('button', { name: 'Add unit' }).element().getBoundingClientRect();
        return width < 640
          ? actions.bottom < heading.top
          : Math.abs(actions.top - heading.top) < 2 && actions.left > heading.right;
      })
      .toBe(true);
  },
);
