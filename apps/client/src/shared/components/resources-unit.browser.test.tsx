import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';

import { ResourceUnit } from './resources-unit';

test('renders a fallback when no resource is available', async () => {
  const screen = await render(<ResourceUnit />);

  await expect.element(screen.getByText('-')).toBeVisible();
});

test('renders the resource unit and color', async () => {
  const screen = await render(
    <ResourceUnit
      type={{ color: '#123456', creatorType: 'User', id: crypto.randomUUID(), name: 'Electricity', unit: 'kWh' }}
    />,
  );

  const unit = screen.getByText('kWh');
  await expect.element(unit).toBeVisible();
  await expect.element(unit).toHaveStyle({ color: 'rgb(18, 52, 86)' });
});
