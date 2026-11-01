import * as usersOptions from '@kijk/api/users/options';
import { useQuery } from '@tanstack/react-query';

import { MonthSwitcher } from '@/shared/components/month-switcher';

import { Budgets } from './budgets';
import { months } from './constants';
import { Consumptions } from './consumptions';
import { Finances } from './finances';
import { Limits } from './limits';
import { Section } from './section';

interface Props {
  spaceId: string;
  year: number;
  month: number;
  onChange: (period: { year: number; month: number }) => void;
}

/** Common space overview with independent loading and failure states. */
export function Dashboard({ spaceId, year, month, onChange }: Props) {
  const features = useQuery(usersOptions.featuresQueryOptions());
  return (
    <div className='@container/home mx-auto flex w-full max-w-7xl flex-col gap-8 pb-6'>
      <header className='flex flex-wrap items-center justify-between gap-4'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            Space overview · {months[month - 1]} {year}
          </h1>
          <p className='text-muted-foreground text-sm'>Your household consumption, at a glance.</p>
        </div>
        <MonthSwitcher year={year} month={month} onChange={onChange} />
      </header>
      <div className='grid min-w-0 gap-5 @4xl/home:grid-cols-[minmax(0,2.3fr)_minmax(0,1fr)]'>
        <Consumptions spaceId={spaceId} year={year} month={month} />
        <Limits spaceId={spaceId} year={year} month={month} />
      </div>
      {features.isPending || features.isError ? (
        <Section
          title='Finances'
          description='Shared income and spending.'
          size='finance'
          pending={features.isPending}
          error={features.isError}
          retry={() => void features.refetch()}
        >
          {null}
        </Section>
      ) : features.data?.finances ? (
        <div className='grid min-w-0 items-start gap-5 @4xl/home:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]'>
          <Budgets spaceId={spaceId} year={year} month={month} />
          <Finances spaceId={spaceId} year={year} month={month} />
        </div>
      ) : null}
    </div>
  );
}
