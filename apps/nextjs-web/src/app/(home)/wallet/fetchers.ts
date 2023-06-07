import { db } from '@/lib/db';
import { Months, months } from '@/types/app';

export async function getTransactions(filter: { month: Months; year: string }) {
  const nextMonth = months[months.indexOf(filter.month) + 1];
  const posts = await db.transaction.findMany({
    where: {
      createdAt: {
        gte: new Date(`${filter.year}-${filter.month}-01`).toISOString(),
        lt: new Date(`${filter.year}-${nextMonth}-01`).toISOString(),
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return posts;
}
