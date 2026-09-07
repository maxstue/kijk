import { TooltipProvider } from '@kijk/ui/components/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import type { PropsWithChildren } from 'react';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';

import type { ConsumptionLimit } from '@/shared/api/consumption-limits/types';
import { worker } from '@/test/mocks/browser';

import { ConsumptionLimitWarning } from './limit-warning';

const resourceId = '72f1314f-af24-4b88-83a5-94fcaed7e4a7';

test('does not render a warning when no active limit is exceeded', async () => {
  const screen = await renderWarning();

  await expect.element(screen.getByRole('img', { name: 'Limit(s) exceeded' })).not.toBeInTheDocument();
});

test('renders exceeded limits returned by the API', async () => {
  worker.use(
    http.get('http://localhost:5000/api/consumption-limits', () =>
      HttpResponse.json<ConsumptionLimit[]>([
        {
          active: true,
          actualValue: 125,
          description: null,
          id: '0cab1db3-080c-4fd9-bb6d-cbe48422dcf0',
          isExceeded: true,
          lastOccurrence: '2026-09-06T12:00:00Z',
          limit: 100,
          name: 'Monthly electricity',
          period: 'Month',
          periodEnd: '2026-10-01T00:00:00Z',
          periodStart: '2026-09-01T00:00:00Z',
          remainingValue: 0,
          resource: { color: '#123456', id: resourceId, name: 'Electricity', unit: 'kWh' },
          utilizationPercentage: 125,
        },
      ]),
    ),
  );
  const screen = await renderWarning();

  const warning = screen.getByRole('img', { name: 'Limit(s) exceeded' });
  await expect.element(warning).toBeVisible();
  await warning.hover();
  await expect.element(screen.getByText(/Monthly electricity: 125 of 100 kWh used this month\./)).toBeVisible();
});

function renderWarning() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  function TestProviders({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
      </QueryClientProvider>
    );
  }

  return render(<ConsumptionLimitWarning resourceId={resourceId} />, { wrapper: TestProviders });
}
