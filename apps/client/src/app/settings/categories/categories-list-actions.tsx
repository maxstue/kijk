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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
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
import { cn } from '@/shared/lib/helpers';
import { Category, CategoryTypes } from '@/shared/types/app';

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
            <Button className='h-8 w-8 p-0' variant='ghost'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleCopyName}>Copy Name</DropdownMenuItem>
            {category.creatorType !== 'Default' && (
              <>
                <SheetTrigger
                  asChild
                  onClick={() => {
                    setSheetType('edit');
                  }}
                >
                  <DropdownMenuItem>Update</DropdownMenuItem>
                </SheetTrigger>
                <DropdownMenuSeparator />
                <SheetTrigger
                  asChild
                  onClick={() => {
                    setSheetType('delete');
                  }}
                >
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
            <span className='blend-' style={{ color: category.color }}>
              {category.color}
            </span>
          </div>
        </div>
      </div>
      <SheetFooter>
        <SheetClose asChild>
          <Button disabled={deleteMutation.isPending} type='button' variant='outline'>
            Cancel
          </Button>
        </SheetClose>
        <Button className='bg-red-500' disabled={deleteMutation.isPending} type='button' onClick={handleDelete}>
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
      title: 'Error updating',
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
        <Form className='space-y-8' form={form} onInvalid={handleError} onSubmit={onSubmit}>
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
                  <Input placeholder='Color, e.g. `#123456`' type='color' {...field} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='type'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select defaultValue={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a category type' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={CategoryTypes.EXPENSE}>Expense</SelectItem>
                    <SelectItem value={CategoryTypes.INCOME}>Income</SelectItem>
                    <SelectItem value={CategoryTypes.OTHER}>Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='flex items-center justify-end gap-2'>
            <SheetFooter>
              <SheetClose asChild>
                <Button disabled={updateMutation.isPending} type='button' variant='outline'>
                  Cancel
                </Button>
              </SheetClose>
              <Button disabled={updateMutation.isPending} type='submit'>
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
