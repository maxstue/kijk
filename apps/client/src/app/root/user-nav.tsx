import { Link } from '@tanstack/react-router';

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
import { getInitailChars } from '@/lib/utils';
import { User } from '@/types/app';

interface Props {
  user: User;
}

export function UserNav({ user }: Props) {
  const userInitials = getInitailChars(user.name);

  // TODO logout
  const handleSignOut = (event: Event) => {
    event.preventDefault();
    // signOut({
    //   callbackUrl: `${window.location.origin}`,
    // }).catch((err) => Sentry.captureException(err));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='relative h-8 w-8 rounded-full'>
          <Avatar className='h-8 w-8'>
            <AvatarImage src='/avatars/01.png' alt={user.name ?? userInitials} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm font-medium leading-none'>{user.name}</p>
            <p className='text-xs leading-none text-muted-foreground'>{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem key={'Profile'} asChild className='cursor-pointer'>
            <Link to={'/settings'} className='flex w-full'>
              Profile
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem key={'Account'} asChild className='cursor-pointer'>
            <Link to={'/settings/account'} className='flex w-full'>
              Account
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem key={'Appearance'} asChild className='cursor-pointer'>
            <Link to={'/settings/appearance'} className='flex w-full'>
              Appearance
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem key={'Notifications'} asChild className='cursor-pointer'>
            <Link to={'/settings/notifications'} className='flex w-full'>
              Notifications
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem key={'Categories'} asChild className='cursor-pointer'>
            <Link to={'/settings/categories'} className='flex w-full'>
              Categories
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className='cursor-pointer' onSelect={handleSignOut}>
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
