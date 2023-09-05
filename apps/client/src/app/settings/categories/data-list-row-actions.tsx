import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Row } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { CategoryFormValues, categorySchema } from '@/app/settings/categories/schemas';
import { Icons } from '@/components/icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Category } from '@/types/app';

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataListRowActions<TData extends Category>({ row }: DataTableRowActionsProps<TData>) {
  const [showEdit, setShowEdit] = useState(false);
  const category = row.original;

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(category.id);
    toast({
      title: `Successfully copied: ${row.original.name} `,
      variant: 'default',
    });
  };

  return (
    <Dialog open={showEdit} onOpenChange={setShowEdit}>
      <AlertDialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={void handleCopyId}>Copy Id</DropdownMenuItem>
            <DialogTrigger asChild>
              <DropdownMenuItem>Update</DropdownMenuItem>
            </DialogTrigger>
            <DropdownMenuSeparator />
            <AlertDialogTrigger asChild>
              <DropdownMenuItem className={cn('focus:bg-red-500')}>Delete</DropdownMenuItem>
            </AlertDialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>

        <DeleteAlertDialog category={category} />
      </AlertDialog>
      <UpdateDialog category={category} onClose={() => setShowEdit(false)} />
    </Dialog>
  );
}

function DeleteAlertDialog({ category }: { category: Category }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(() => {
      // await deleteCategory(category.id);
      toast({
        title: `Successfully deleted: ${category.name} `,
        variant: 'default',
      });
    });
  };

  return (
    <>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete</AlertDialogTitle>
          <AlertDialogDescription>This will irrevocably delete this category.</AlertDialogDescription>
        </AlertDialogHeader>
        <div>
          Category details:
          <div className='ml-6 flex flex-col'>
            <span>Name: {category.name}</span>
            <span style={{ background: `${category.color}` }}>Name: {category.color}</span>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending}>
            Delete
          </AlertDialogAction>
          {isPending && <Icons.spinner className='animate-spin bg-red-500' />}
        </AlertDialogFooter>
      </AlertDialogContent>
    </>
  );
}

function UpdateDialog({ category, onClose }: { category: Category; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    values: category,
    mode: 'onBlur',
  });

  function onSubmit(data: CategoryFormValues) {
    startTransition(() => {
      // await updateCategory(category.id, data).then(() => {
      //   toast({
      //     title: `Successfully updated: ${data.name} `,
      //     variant: 'default',
      //   });
      console.log(data);

      onClose();
      // });
    });
  }

  return (
    <>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update {category.name}</DialogTitle>
          <DialogDescription>Change the values of this category.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={void form.handleSubmit(onSubmit)} className='space-y-8'>
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
                    {/* TODO show color on text-color or inputborder or bg */}
                    <Input placeholder='example: "#ffffff"' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex items-center justify-end gap-2'>
              <DialogFooter>
                <Button variant='outline' onClick={onClose}>
                  Cancel
                </Button>
                <Button type='submit'>Update</Button>
              </DialogFooter>
              {isPending && <Icons.spinner className='h-5 w-5 animate-spin' />}
            </div>
          </form>
        </Form>
      </DialogContent>
    </>
  );
}
