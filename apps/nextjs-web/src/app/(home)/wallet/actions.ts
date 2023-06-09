'use server';

import { revalidatePath } from 'next/cache';

import { TransactionFormValues } from '@/app/(home)/wallet/_components/schemas';
import { db } from '@/lib/db';
import { Id } from '@/types/app';

export async function createTransaction(data: TransactionFormValues) {
  try {
    const created = await db.transaction.create({
      data: { name: data.name, amount: data.amount, type: data.type },
    });
    revalidatePath('/wallet');
    return { created };
  } catch (error) {
    return { error };
  }
}

export async function updateTransaction(id: string, data: Partial<TransactionFormValues>) {
  try {
    const updatedTransaction = await db.transaction.update({
      where: { id },
      data: { name: data.name, amount: data.amount, type: data.type },
    });
    revalidatePath('/wallet');
    return { updatedTransaction };
  } catch (error) {
    return { error };
  }
}

export async function deleteTransaction(id: Id) {
  try {
    const deletedTransaction = await db.transaction.delete({
      where: { id },
    });
    revalidatePath('/wallet');
    return { deletedTransaction };
  } catch (error) {
    return { error };
  }
}
