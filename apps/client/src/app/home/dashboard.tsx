import * as usersOptions from '@kijk/api/users/options';
import { useQuery } from '@tanstack/react-query';

import { MonthSwitcher } from '@/shared/components/month-switcher';

import { Budgets } from './budgets';
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
      <div className='flex justify-start'>
        <MonthSwitcher year={year} month={month} onChange={onChange} />
      </div>
      <Consumptions spaceId={spaceId} month={month} />
      <div className='grid min-w-0 items-stretch gap-5 @3xl/home:grid-cols-2'>
        <Limits spaceId={spaceId} year={year} month={month} />
        {features.data?.finances && <Budgets spaceId={spaceId} year={year} month={month} />}
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
        <Finances spaceId={spaceId} year={year} month={month} />
      ) : null}
    </div>
  );
}
