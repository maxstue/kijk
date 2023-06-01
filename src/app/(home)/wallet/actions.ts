'use server';

import { revalidatePath } from 'next/cache';

import { TransactionFormValues } from '@/app/(home)/wallet/_components/schemas';
import { db } from '@/lib/db';

export async function createTransaction(data: TransactionFormValues) {
  await db.transaction.create({
    data: { name: data.name, amount: data.amount, type: data.type },
  });
  revalidatePath('/wallet');
}
