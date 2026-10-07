import * as React from 'react';
import { ContextMenu as ContextMenuPrimitive } from 'radix-ui';

import { cn } from 'cn';
import { ChevronRightIcon, CheckIcon } from 'lucide-react';

/** Menu opened by right-click or long-press. */
function ContextMenu({ ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Root>) {
  return <ContextMenuPrimitive.Root data-slot='context-menu' {...props} />;
}

/** Area that opens the context menu. */
function ContextMenuTrigger({ className, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Trigger>) {
  return (
    <ContextMenuPrimitive.Trigger
      data-slot='context-menu-trigger'
      className={cn('select-none', className)}
      {...props}
    />
  );
}

/** Groups related menu items. */
function ContextMenuGroup({ ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Group>) {
  return <ContextMenuPrimitive.Group data-slot='context-menu-group' {...props} />;
}

/** Renders the context menu into a portal. */
function ContextMenuPortal({ ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Portal>) {
  return <ContextMenuPrimitive.Portal data-slot='context-menu-portal' {...props} />;
}

/** Nested submenu. */
function ContextMenuSub({ ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Sub>) {
  return <ContextMenuPrimitive.Sub data-slot='context-menu-sub' {...props} />;
}

/** Group of mutually exclusive radio items. */
function ContextMenuRadioGroup({ ...props }: React.ComponentProps<typeof ContextMenuPrimitive.RadioGroup>) {
  return <ContextMenuPrimitive.RadioGroup data-slot='context-menu-radio-group' {...props} />;
}

/** Panel of the context menu. */
function ContextMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Content> & {
  side?: 'top' | 'right' | 'bottom' | 'left';
}) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        data-slot='context-menu-content'
        className={cn(
          'bg-popover text-popover-foreground ring-foreground/10 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 z-50 max-h-(--radix-context-menu-content-available-height) min-w-36 origin-(--radix-context-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md p-1 shadow-md ring-1 duration-100',
          className,
        )}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  );
}

/** A menu action; `variant="destructive"` highlights dangerous actions. */
function ContextMenuItem({
  className,
  inset,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Item> & {
  inset?: boolean;
  variant?: 'default' | 'destructive';
}) {
  return (
    <ContextMenuPrimitive.Item
      data-slot='context-menu-item'
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "group/context-menu-item focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 focus:*:[svg]:text-accent-foreground data-[variant=destructive]:*:[svg]:text-destructive relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

/** Item that opens a submenu. */
function ContextMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.SubTrigger> & {
  inset?: boolean;
}) {
  return (
    <ContextMenuPrimitive.SubTrigger
      data-slot='context-menu-sub-trigger'
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-open:bg-accent data-open:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className='ml-auto' />
    </ContextMenuPrimitive.SubTrigger>
  );
}

/** Panel of a submenu. */
function ContextMenuSubContent({ className, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.SubContent>) {
  return (
    <ContextMenuPrimitive.SubContent
      data-slot='context-menu-sub-content'
      className={cn(
        'bg-popover text-popover-foreground data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 z-50 min-w-32 origin-(--radix-context-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg duration-100',
        className,
      )}
      {...props}
    />
  );
}

/** A menu item that toggles a value. */
function ContextMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.CheckboxItem> & {
  inset?: boolean;
}) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      data-slot='context-menu-checkbox-item'
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className='pointer-events-none absolute right-2'>
        <ContextMenuPrimitive.ItemIndicator>
          <CheckIcon />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  );
}

/** A menu item that selects one value of a radio group. */
function ContextMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.RadioItem> & {
  inset?: boolean;
}) {
  return (
    <ContextMenuPrimitive.RadioItem
      data-slot='context-menu-radio-item'
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span className='pointer-events-none absolute right-2'>
        <ContextMenuPrimitive.ItemIndicator>
          <CheckIcon />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  );
}

/** Non-interactive label in the menu. */
function ContextMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Label> & {
  inset?: boolean;
}) {
  return (
    <ContextMenuPrimitive.Label
      data-slot='context-menu-label'
      data-inset={inset}
      className={cn('text-muted-foreground px-2 py-1.5 text-xs font-medium data-inset:pl-8', className)}
      {...props}
    />
  );
}

/** Divider between menu items. */
function ContextMenuSeparator({ className, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Separator>) {
  return (
    <ContextMenuPrimitive.Separator
      data-slot='context-menu-separator'
      className={cn('bg-border -mx-1 my-1 h-px', className)}
      {...props}
    />
  );
}

/** Keyboard shortcut hint of a menu item. */
function ContextMenuShortcut({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot='context-menu-shortcut'
      className={cn(
        'text-muted-foreground group-focus/context-menu-item:text-accent-foreground ml-auto text-xs tracking-widest',
        className,
      )}
      {...props}
    />
  );
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
};
