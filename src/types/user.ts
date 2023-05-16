import type { User } from 'next-auth';

export type AppUser = User & {
  id: string;
};
