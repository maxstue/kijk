import { Link, useNavigate } from '@tanstack/react-router';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { settingsNav } from '@/lib/constants';
import { getInitailChars } from '@/lib/utils';
import { useAuthStore, useAuthStoreActions } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';

export function UserNav() {
  const { logout } = useAuthStoreActions();
  const { session } = useAuthStore();
  const userInitials = getInitailChars(session?.user.email);
  const { radius } = useThemeStore();
  const navigate = useNavigate();

  const handleSignOut = (event: Event) => {
    event.preventDefault();
    logout()
      .then(() => navigate({ to: '/', replace: true }))
      .catch(console.warn);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='relative h-8 w-8 rounded-full'>
          <Avatar className='h-8 w-8'>
            <AvatarImage src='/avatars/01.png' alt={session?.user.email ?? userInitials} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent key={radius} className='w-56 rounded-lg bg-background' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm font-medium leading-none'>{session?.user.email}</p>
            <p className='text-xs leading-none text-muted-foreground'>{session?.user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {settingsNav.map(({ to, label, shortCutKey }) => (
            <DropdownMenuItem key={label} asChild className='cursor-pointer'>
              <Link to={'/settings/$section'} params={{ section: to }} className='flex w-full'>
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
