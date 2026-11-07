import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-react';
import { SettingsIcon } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { TooltipProvider } from './tooltip';

test('bounds menu widths and reveals long actions without losing icons, shortcuts or rendered links', async () => {
  const longAction = 'Open the settings for a space with an unusually long descriptive name';
  const screen = await render(
    <TooltipProvider delay={0}>
      <DropdownMenu>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            <SettingsIcon />
            {longAction}
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem render={<a href='#support'>Support</a>} />
          <DropdownMenuItem>Short action</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>,
  );
  await screen.getByRole('button', { name: 'Actions' }).click();
  const action = screen.getByRole('menuitem', { name: `${longAction} ⌘S` });
  await expect.element(action).toBeVisible();
  const menu = screen.getByRole('menu').element();
  await expect.poll(() => menu.getBoundingClientRect().width).toBeGreaterThanOrEqual(192);
  expect(menu.getBoundingClientRect().width).toBeGreaterThanOrEqual(192);
  expect(menu.getBoundingClientRect().width).toBeLessThanOrEqual(384);
  await action.hover();
  await expect.element(page.getByRole('tooltip')).toHaveTextContent(longAction);
  await expect.element(screen.getByRole('menuitem', { name: 'Support' })).toHaveAttribute('href', '#support');
  await userEvent.keyboard('{Escape}');
});
