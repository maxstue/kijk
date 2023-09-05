// import { revalidatePath } from 'next/cache';

// import { CategoryFormValues } from '@/app/(home)/settings/categories/_components/schemas';
// import { db } from '@/lib/db';
// import { Id } from '@/types/app';

// export function createCategory(data: CategoryFormValues) {
//   try {
//     const created = await db.category.create({
//       data: { name: data.name, color: data.color, userId: data.userId },
//     });
//     revalidatePath('/settings/categories');
//     return { created };
//   } catch (error) {
//     return { error };
//   }
// }

// export async function updateCategory(id: string, data: Partial<CategoryFormValues>) {
//   try {
//     const updatedCategory = await db.category.update({
//       where: { id },
//       data: { ...data },
//     });
//     revalidatePath('/settings/categories');
//     return { updatedCategory };
//   } catch (error) {
//     return { error };
//   }
// }

// export async function deleteCategory(id: Id) {
//   try {
//     const deletedCategory = await db.category.delete({
//       where: { id },
//     });
//     revalidatePath('/settings/categories');
//     return { deletedCategory };
//   } catch (error) {
//     return { error };
//   }
// }
