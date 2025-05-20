import { Link } from '@tanstack/react-router';

import { PlusIcon } from 'lucide-react';
import { Suspense, useState } from 'react';
import { mainNav } from '@/app/root/constants';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/shared/components/ui/sidebar';
import { cn } from '@/shared/lib/helpers.ts';
import { Button } from '@/shared/components/ui/button';
import { CommandMenu } from '@/app/root/command-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet';
import { ConsumptionCreateForm } from '@/app/consumptions/consumption-create-form';
import { months } from '@/shared/types/app';

export function NavMain() {
  const [showSheet, setShowSheet] = useState(false);

  const handleClose = () => setShowSheet(false);

  return (
    <SidebarGroup>
      <SidebarGroupContent className='flex flex-col gap-4'>
        <SidebarMenu className='flex flex-row items-center justify-between gap-2'>
          <SidebarMenuItem className='w-full'>
            <SidebarMenuButton asChild size='sm'>
              <CommandMenu />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Sheet open={showSheet} onOpenChange={setShowSheet}>
              <SheetTrigger asChild>
                <Button className='size-8 group-data-[collapsible=icon]:opacity-0' size='icon' variant='default'>
                  <PlusIcon />
                  <span className='sr-only'>Quick Create</span>
                </Button>
              </SheetTrigger>
              <SheetContent className='space-y-8'>
                <SheetHeader>
                  <SheetTitle>Add Consumption</SheetTitle>
                  <SheetDescription>Add a new consumption.</SheetDescription>
                </SheetHeader>
                <Suspense>
                  <ConsumptionCreateForm
                    month={months[new Date().getMonth()]}
                    year={new Date().getFullYear()}
                    onClose={handleClose}
                  />
                </Suspense>
              </SheetContent>
            </Sheet>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {mainNav.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link
                  key={item.url}
                  activeOptions={{ exact: false }}
                  className={cn(!item.isActive && 'cursor-not-allowed')}
                  disabled={!item.isActive}
                  to={item.url}
                  activeProps={{
                    className: 'text-primary-foreground bg-primary',
                  }}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
