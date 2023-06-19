import { format, lastDayOfMonth, toDate } from 'date-fns';

import { db } from '@/lib/db';
import { Months, months } from '@/types/app';

export async function getTransactions(filter: { month: Months; year: string }) {
  try {
    const filterDate = format(new Date(Number(filter.year), months.indexOf(filter.month)), "yyyy-MM-dd'T'00:00:00'Z'");
    const firstDateOfMonth = format(toDate(new Date(filterDate)), "yyyy-MM-01'T'00:00:00'Z'");
    const lastDateOfMonth = format(lastDayOfMonth(toDate(new Date(filterDate))), "yyyy-MM-dd'T'23:59:59'Z'");

    const transactions = await db.transaction.findMany({
      where: {
        executedAt: {
          gte: firstDateOfMonth,
          lte: lastDateOfMonth,
        },
      },
      orderBy: { executedAt: 'desc' },
    });

    return { transactions };
  } catch (error) {
    return { error };
  }
}
