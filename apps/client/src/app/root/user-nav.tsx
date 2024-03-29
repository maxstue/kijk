import { Link, useNavigate } from '@tanstack/react-router';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { settingsNav } from '@/shared/lib/constants';
import { getInitailChars } from '@/shared/lib/utils';
import { useAuthStore, useAuthStoreActions } from '@/shared/stores/auth-store';
import { useThemeStore } from '@/shared/stores/theme-store';

export function UserNav() {
  const { logout } = useAuthStoreActions();
  const { user } = useAuthStore();
  const userInitials = getInitailChars(user?.email);
  const { radius } = useThemeStore();
  const navigate = useNavigate({ from: '/' });

  const handleSignOut = (event: Event) => {
    event.preventDefault();
    logout()
      .then(() => navigate({ to: '/auth', replace: true }))
      .catch(console.warn);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='relative h-8 w-8 rounded-full'>
          <Avatar className='h-8 w-8'>
            <AvatarImage src='/avatars/01.png' alt={user?.email ?? userInitials} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent key={radius} className='w-56 rounded-lg bg-background' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm font-medium leading-none'>{user?.name}</p>
            <p className='text-xs leading-none text-muted-foreground'>{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {settingsNav.map(({ to, label, shortCutKey }) => (
            <DropdownMenuItem key={label} asChild className='cursor-pointer'>
              <Link to={`/home/settings/$section`} params={{ section: to }} className='flex w-full'>
                {label}
                {shortCutKey && <DropdownMenuShortcut>{shortCutKey}</DropdownMenuShortcut>}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className='cursor-pointer' onSelect={handleSignOut}>
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
