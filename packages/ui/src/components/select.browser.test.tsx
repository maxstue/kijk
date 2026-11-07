import { expect, test, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-react';

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from './select';
import { TooltipProvider } from './tooltip';

const longUnit = 'Custom electricity consumption measurement unit with an unusually long name (kWh)';
const units = [
  { label: 'Liter (l)', value: 'liter' },
  { label: longUnit, value: 'electricity' },
];

for (const alignItemWithTrigger of [true, false]) {
  test(`keeps unit selection stable and reveals clipped options (aligned: ${alignItemWithTrigger})`, async () => {
    const onValueChange = vi.fn<(value: string | null, details: unknown) => void>();
    const screen = await render(
      <TooltipProvider delay={0}>
        <Select defaultValue='liter' items={units} onValueChange={onValueChange}>
          <SelectTrigger aria-label='Unit'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={alignItemWithTrigger}>
            <SelectGroup>
              <SelectLabel>Measurement units</SelectLabel>
              {units.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </TooltipProvider>,
    );
    const trigger = screen.getByRole('combobox', { name: 'Unit' });
    const initialWidth = trigger.element().getBoundingClientRect().width;
    expect(initialWidth).toBe(192);
    await trigger.click();
    const option = screen.getByRole('option', { name: longUnit });
    await expect.element(option).toBeVisible();
    const popup = document.querySelector<HTMLElement>('[data-slot=select-content]')!;
    await expect.poll(() => popup.getBoundingClientRect().width).toBe(initialWidth);
    expect(popup.getBoundingClientRect().width).toBeGreaterThanOrEqual(initialWidth);
    expect(popup.getBoundingClientRect().width).toBeLessThanOrEqual(384);
    const label = option.element().querySelector<HTMLElement>('.truncate')!;
    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    expect(getComputedStyle(label).textOverflow).toBe('ellipsis');
    await option.hover();
    await expect.element(page.getByRole('tooltip')).toHaveTextContent(longUnit);
    await option.click();
    expect(onValueChange).toHaveBeenCalledWith('electricity', expect.anything());
    expect(trigger.element().getBoundingClientRect().width).toBe(initialWidth);
  });
}

test('reveals clipped unit options during keyboard navigation', async () => {
  const screen = await render(
    <TooltipProvider delay={0}>
      <Select defaultValue='liter' items={units}>
        <SelectTrigger aria-label='Unit'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {units.map((unit) => (
            <SelectItem key={unit.value} value={unit.value}>
              {unit.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </TooltipProvider>,
  );
  await userEvent.tab();
  await expect.element(screen.getByRole('combobox', { name: 'Unit' })).toHaveFocus();
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(screen.getByRole('option', { name: 'Liter (l)' })).toBeVisible();
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(page.getByRole('tooltip')).toHaveTextContent(longUnit);
  await userEvent.keyboard('{Enter}');
  await expect.element(screen.getByRole('combobox', { name: 'Unit' })).toHaveTextContent(longUnit);
});

test('reveals the selected unit when the trigger receives keyboard focus', async () => {
  const screen = await render(
    <TooltipProvider delay={0}>
      <Select defaultValue='electricity' items={units}>
        <SelectTrigger aria-label='Unit'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {units.map((unit) => (
            <SelectItem key={unit.value} value={unit.value}>
              {unit.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </TooltipProvider>,
  );
  await userEvent.tab();
  await expect.element(screen.getByRole('combobox', { name: 'Unit' })).toHaveFocus();
  await expect.element(page.getByRole('tooltip')).toHaveTextContent(longUnit);
});

for (const viewportWidth of [320, 1280]) {
  test(`keeps the menu at least as wide as a full-width field within a ${viewportWidth}px viewport`, async () => {
    const previousViewport = { width: window.innerWidth, height: window.innerHeight };
    await page.viewport(viewportWidth, 720);
    try {
      const screen = await render(
        <div style={{ width: '600px', maxWidth: 'calc(100vw - 32px)', margin: '16px' }}>
          <Select defaultValue='liter' items={units}>
            <SelectTrigger aria-label='Unit' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {units.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>,
      );
      const trigger = screen.getByRole('combobox', { name: 'Unit' });
      await trigger.click();
      await expect.element(screen.getByRole('option', { name: longUnit })).toBeVisible();
      await expect
        .poll(() => document.querySelector<HTMLElement>('[data-slot=select-content]')!.getBoundingClientRect().width)
        .toBe(trigger.element().getBoundingClientRect().width);
      const menu = document.querySelector<HTMLElement>('[data-slot=select-content]')!.getBoundingClientRect();
      const field = trigger.element().getBoundingClientRect();
      expect(menu.width).toBeGreaterThanOrEqual(field.width);
      expect(menu.left).toBeGreaterThanOrEqual(0);
      expect(menu.right).toBeLessThanOrEqual(viewportWidth);
      expect(menu.top).toBeGreaterThanOrEqual(field.bottom);
      await userEvent.keyboard('{Escape}');
    } finally {
      await page.viewport(previousViewport.width, previousViewport.height);
    }
  });
}
