import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';

import { ResourceIcon } from './resource-icon';

test('falls back to the circle icon for an unknown stored name', async () => {
  const screen = await render(<ResourceIcon name='no-longer-available' testId='resource-icon' />);

  await expect.element(screen.getByTestId('resource-icon')).toHaveClass('lucide-circle');
});
