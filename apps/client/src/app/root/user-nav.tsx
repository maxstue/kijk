import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from '@tanstack/react-router';
import { LogOutIcon } from 'lucide-react';

import { getInitailChars } from '@/app/root/helpers';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { useThemeStore } from '@/shared/stores/theme-store';

export function UserNav() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  const userInitials = getInitailChars(email);
  const { radius } = useThemeStore();
  const navigate = useNavigate({ from: '/' });

  // eslint-disable-next-line react-perf/jsx-no-new-function-as-prop
  const handleSignOut = (event: Event) => {
    event.preventDefault();
    signOut()
      .then(() => navigate({ to: '/auth', replace: true }))
      .catch(console.warn);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='relative h-9 rounded-md hover:bg-primary/[0.05]'>
          <Avatar className='h-6 w-6'>
            <AvatarImage src='/avatars/01.png' alt={email ?? userInitials} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent key={radius} className='w-56 rounded-lg bg-background' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm font-medium leading-none'>{user?.firstName}</p>
            <p className='text-xs leading-none text-muted-foreground'>{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className='cursor-pointer gap-2' onSelect={handleSignOut}>
          <LogOutIcon className='h-4' />
          <div>Log out</div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
