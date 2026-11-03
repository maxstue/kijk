import * as usersOptions from '@kijk/api/users/options';
import { Card, CardHeader, CardTitle, CardDescription } from '@kijk/ui/components/card';
import { useQuery } from '@tanstack/react-query';

import { MonthSwitcher } from '@/shared/components/month-switcher';

import { Budgets } from './budgets';
import { Consumptions } from './consumptions';
import { Finances } from './finances';
import { Limits } from './limits';
import { DashboardSectionContent } from './section-content';
import type { ConsumptionView } from './types';

interface Props {
  spaceId: string;
  year: number;
  month: number;
  resourceId?: string;
  view: ConsumptionView;
  onResourceChange: (resourceId: string) => void;
  onViewChange: (view: ConsumptionView) => void;
  onChange: (period: { year: number; month: number }) => void;
}

/** Common space overview with independent loading and failure states. */
export function Dashboard({ spaceId, year, month, resourceId, view, onResourceChange, onViewChange, onChange }: Props) {
  const features = useQuery(usersOptions.featuresQueryOptions());
  let financeSection = null;
  if (features.isPending || features.isError) {
    financeSection = (
      <Card role='region' aria-label='Finances' aria-busy={false} className='min-w-0 gap-4 shadow-xs'>
        <CardHeader className='min-h-16 has-data-[slot=card-action]:grid-cols-1 @3xl/home:has-data-[slot=card-action]:grid-cols-[1fr_auto]'>
          <CardTitle>Finances</CardTitle>
          <CardDescription>Shared income and spending.</CardDescription>
        </CardHeader>
        <DashboardSectionContent
          size='finance'
          pending={features.isPending}
          error={features.isError}
          retry={() => void features.refetch()}
        >
          {null}
        </DashboardSectionContent>
      </Card>
    );
  } else if (features.data?.finances) {
    financeSection = <Finances spaceId={spaceId} year={year} month={month} />;
  }
  return (
    <div className='@container/home mx-auto flex w-full max-w-7xl flex-col gap-8 pb-6'>
      <div className='flex justify-start'>
        <MonthSwitcher year={year} month={month} onChange={onChange} />
      </div>
      <Consumptions
        spaceId={spaceId}
        year={year}
        month={month}
        resourceId={resourceId}
        view={view}
        onResourceChange={onResourceChange}
        onViewChange={onViewChange}
      />
      <div className='grid min-w-0 items-stretch gap-5 @3xl/home:grid-cols-2'>
        <Limits spaceId={spaceId} year={year} month={month} />
        {features.data?.finances && <Budgets spaceId={spaceId} year={year} month={month} />}
      </div>
      {financeSection}
    </div>
  );
}
