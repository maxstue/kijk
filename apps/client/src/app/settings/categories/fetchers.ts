// import { db } from '@/lib/db';
// import { Id } from '@/types/app';

// export async function getCategories(filter: { userId: Id }) {
//   try {
//     const categories = await db.category.findMany({
//       where: {
//         userId: filter.userId,
//       },
//       orderBy: { name: 'desc' },
//     });

//     return { categories };
//   } catch (error) {
//     return { error };
//   }
// }
