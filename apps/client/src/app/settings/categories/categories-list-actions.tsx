import { useCallback, useState } from 'react';
import { Row } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';

import { CategoryFormValues, categorySchema } from '@/app/settings/categories/schemas';
import { useDeleteCategory } from '@/app/settings/categories/use-delete-category';
import { useUpdateCategory } from '@/app/settings/categories/use-update-category';
import { Icons } from '@/shared/components/icons';
import { Button } from '@/shared/components/ui/button';
import { Dialog } from '@/shared/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form/form';
import { useZodForm } from '@/shared/components/ui/form/use-zod-form';
import { Input } from '@/shared/components/ui/input';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet';
import { useToast } from '@/shared/hooks/use-toast';
import { cn } from '@/shared/lib/utils';
import { Category } from '@/shared/types/app';

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataListRowActions<TData extends Category>({ row }: DataTableRowActionsProps<TData>) {
  const [showEdit, setShowEdit] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetType, setSheetType] = useState<'edit' | 'delete'>();
  const { toast } = useToast();
  const category = row.original;

  const handleCopyName = useCallback(async () => {
    await navigator.clipboard.writeText(category.name);
    toast({
      title: `Successfully copied: ${category.name} `,
      variant: 'default',
    });
  }, [category.name, toast]);

  const handleClose = useCallback(() => {
    setShowSheet(false);
    setSheetType(undefined);
  }, []);

  return (
    <Dialog open={showEdit} onOpenChange={setShowEdit}>
      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleCopyName}>Copy Name</DropdownMenuItem>
            {category.type !== 'Default' && (
              <>
                <SheetTrigger asChild onClick={() => setSheetType('edit')}>
                  <DropdownMenuItem>Update</DropdownMenuItem>
                </SheetTrigger>
                <DropdownMenuSeparator />
                <SheetTrigger asChild onClick={() => setSheetType('delete')}>
                  <DropdownMenuItem className={cn('focus:bg-red-500 focus:text-white')}>Delete</DropdownMenuItem>
                </SheetTrigger>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <SheetContent>
          {sheetType === 'delete' && <Delete category={category} onClose={handleClose} />}
          {sheetType === 'edit' && <Update category={category} onClose={handleClose} />}
        </SheetContent>
      </Sheet>
    </Dialog>
  );
}

interface EdProps {
  category: Category;
  onClose: () => void;
}

function Delete({ category, onClose }: EdProps) {
  const deleteMutation = useDeleteCategory();
  const { toast } = useToast();

  const handleDelete = useCallback(() => {
    deleteMutation.mutate(
      { categoryId: category.id },
      {
        onSuccess() {
          toast({ title: `Successfully deleted: ${category.name} ` });
          onClose();
        },
      },
    );
  }, [category.id, category.name, deleteMutation, onClose, toast]);

  return (
    <div className='space-y-8'>
      <SheetHeader>
        <SheetTitle>Delete Category</SheetTitle>
        <SheetDescription>This will irrevocably delete this category.</SheetDescription>
      </SheetHeader>
      <div className='flex flex-col gap-3'>
        <div className='flex w-1/2 flex-col'>
          <div className='flex justify-between'>
            <span className='font-bold'>Name:</span>
            <span>{category.name}</span>
          </div>
          <div className='flex justify-between'>
            <span className='font-bold'>Color:</span>
            <span style={{ color: category.color }} className='blend-'>
              {category.color}
            </span>
          </div>
        </div>
      </div>
      <SheetFooter>
        <SheetClose asChild>
          <Button type='button' variant='outline' disabled={deleteMutation.isPending}>
            Cancel
          </Button>
        </SheetClose>
        <Button type='button' className='bg-red-500' onClick={handleDelete} disabled={deleteMutation.isPending}>
          Delete
        </Button>
        {deleteMutation.isPending && <Icons.spinner className='h-5 w-5 animate-spin' />}
      </SheetFooter>
    </div>
  );
}

function Update({ category, onClose }: EdProps) {
  const form = useZodForm({
    schema: categorySchema,
    values: category,
    mode: 'onBlur',
  });
  const updateMutation = useUpdateCategory();
  const { toast } = useToast();

  function onSubmit(data: CategoryFormValues) {
    updateMutation.mutate(
      { category: data, categoryId: category.id },
      {
        onSuccess() {
          toast({ title: `Successfully updated: ${data.name} ` });
          onClose();
        },
      },
    );
  }

  const handleError = useCallback(() => {
    toast({
      title: `Error updating`,
      variant: 'destructive',
    });
  }, [toast]);

  return (
    <>
      <SheetHeader>
        <SheetTitle>Update {category.name}</SheetTitle>
        <SheetDescription>Change the values of this category.</SheetDescription>
      </SheetHeader>
      <div>
        <Form form={form} onSubmit={onSubmit} onInvalid={handleError} className='space-y-8'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder='Name' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='color'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <FormControl>
                  <Input type='color' placeholder='Color, e.g. `#123456`' {...field} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='flex items-center justify-end gap-2'>
            <SheetFooter>
              <SheetClose asChild>
                <Button type='button' variant='outline' disabled={updateMutation.isPending}>
                  Cancel
                </Button>
              </SheetClose>
              <Button type='submit' disabled={updateMutation.isPending}>
                Update
              </Button>
              {updateMutation.isPending && <Icons.spinner className='animate-spin' />}
            </SheetFooter>
          </div>
        </Form>
      </div>
    </>
  );
}
