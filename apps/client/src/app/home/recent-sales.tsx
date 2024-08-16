import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';

export function RecentSales() {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center gap-2'>
        <Avatar className='h-9 w-9'>
          <AvatarImage alt='Avatar' src='/avatars/01.png' />
          <AvatarFallback>OM</AvatarFallback>
        </Avatar>
        <div>
          <p className='text-sm font-medium leading-none'>Olivia Martin</p>
          <p className='text-sm text-muted-foreground'>olivia.martin@email.com</p>
        </div>
        <div className='ml-auto font-medium'>+$1,999.00</div>
      </div>
      <div className='flex items-center gap-2'>
        <Avatar className='h-9 w-9'>
          <AvatarImage alt='Avatar' src='/avatars/02.png' />
          <AvatarFallback>JL</AvatarFallback>
        </Avatar>
        <div>
          <p className='text-sm font-medium leading-none'>Jackson Lee</p>
          <p className='text-sm text-muted-foreground'>jackson.lee@email.com</p>
        </div>
        <div className='ml-auto font-medium'>+$39.00</div>
      </div>
      <div className='flex items-center gap-2'>
        <Avatar className='h-9 w-9'>
          <AvatarImage alt='Avatar' src='/avatars/03.png' />
          <AvatarFallback>IN</AvatarFallback>
        </Avatar>
        <div>
          <p className='text-sm font-medium leading-none'>Isabella Nguyen</p>
          <p className='text-sm text-muted-foreground'>isabella.nguyen@email.com</p>
        </div>
        <div className='ml-auto font-medium'>+$299.00</div>
      </div>
      <div className='flex items-center gap-2'>
        <Avatar className='h-9 w-9'>
          <AvatarImage alt='Avatar' src='/avatars/04.png' />
          <AvatarFallback>WK</AvatarFallback>
        </Avatar>
        <div>
          <p className='text-sm font-medium leading-none'>William Kim</p>
          <p className='text-sm text-muted-foreground'>will@email.com</p>
        </div>
        <div className='ml-auto font-medium'>+$99.00</div>
      </div>
      <div className='flex items-center gap-2'>
        <Avatar className='h-9 w-9'>
          <AvatarImage alt='Avatar' src='/avatars/05.png' />
          <AvatarFallback>SD</AvatarFallback>
        </Avatar>
        <div>
          <p className='text-sm font-medium leading-none'>Sofia Davis</p>
          <p className='text-sm text-muted-foreground'>sofia.davis@email.com</p>
        </div>
        <div className='ml-auto font-medium'>+$39.00</div>
      </div>
    </div>
  );
}
