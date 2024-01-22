import { Suspense, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { BudgetYearCalendar } from '@/app/budget/budget-year-calendar';
import { AsyncLoader } from '@/components/async-loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function BudgetYearCalenderCard({ year }: { year: number }) {
  const [open, setOpen] = useState(false);

  const handleToggle = () => setOpen((c) => !c);

  return (
    <div className='flex w-full'>
      <Card className='w-full'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0'>
          <CardTitle className='text-sm font-medium'>Year overview</CardTitle>
          <Button variant='ghost' className='' size='icon-sm' onClick={handleToggle}>
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground', open && 'rotate-180')} />
          </Button>
        </CardHeader>
        {open && (
          <CardContent className='pt-0'>
            <Suspense fallback={<AsyncLoader className='h-4 w-4' />}>
              <BudgetYearCalendar year={year} />
            </Suspense>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
