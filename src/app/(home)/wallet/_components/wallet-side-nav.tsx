'use client';

import React, { Suspense, useEffect } from 'react';

import { MonthNav } from '@/app/(home)/wallet/_components/month-nav';
import { YearSwitcher } from '@/app/(home)/wallet/_components/year-switcher';
import { useSearchQuery } from '@/hooks/use-search-query';
import { months } from '@/types/app';

export function WalletSideNav() {
  const { pushQueryString, isQuerySet, createQueriesString } = useSearchQuery();

  useEffect(() => {
    const params = [];
    if (!isQuerySet('year')) {
      params.push({ name: 'year', value: new Date().getFullYear().toString() });
    }
    if (!isQuerySet('month')) {
      params.push({ name: 'month', value: months[new Date().getMonth()] });
    }
    pushQueryString(createQueriesString(params));
  }, [createQueriesString, isQuerySet, pushQueryString]);

  return (
    <>
      <Suspense fallback={<Fallback />}>
        <YearSwitcher />
      </Suspense>
      <Suspense fallback={<Fallback />}>
        <MonthNav />
      </Suspense>
    </>
  );
}

function Fallback() {
  return <div>Loading ...</div>;
}
