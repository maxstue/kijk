import * as usersOptions from '@kijk/api/users/options';
import { useQuery } from '@tanstack/react-query';

import { MonthSwitcher } from '@/shared/components/month-switcher';

import { months } from './constants';
import { Consumptions } from './consumptions';
import { Finances } from './finances';
import { Limits } from './limits';

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
    <div className='space-y-6'>
      <header className='flex flex-wrap items-center justify-between gap-4'>
        <h1 className='text-2xl font-semibold'>
          Space overview · {months[month - 1]} {year}
        </h1>
        <MonthSwitcher year={year} month={month} onChange={onChange} />
      </header>
      {features.isPending ? (
        <p role='status'>Loading available modules…</p>
      ) : features.isError ? (
        <p role='alert'>
          Could not load available modules.{' '}
          <button className='underline' onClick={() => void features.refetch()}>
            Try again
          </button>
        </p>
      ) : (
        features.data?.finances && <Finances spaceId={spaceId} year={year} month={month} />
      )}
      <Consumptions spaceId={spaceId} year={year} month={month} />
      <Limits spaceId={spaceId} year={year} month={month} />
    </div>
  );
}
