import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useCreateCategory } from '@/app/settings/categories/use-create-category';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

import { CategoryFormValues, categorySchema } from './schemas';

interface Props {
  onClose?: () => void;
}

export function CategoryCreateForm({ onClose }: Props) {
  const { isPending, mutate } = useCreateCategory();
  const { toast } = useToast();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      color: '#000000',
    },
    mode: 'onBlur',
  });

  function onSubmit(data: CategoryFormValues) {
    mutate(
      { category: data },
      {
        onError(error) {
          console.log(error);

          toast({
            title: `${error.data?.at(0)?.code}: ${error.data?.at(0)?.message}`,
            description: error.message,
            variant: 'destructive',
          });
        },
        onSuccess() {
          toast({
            title: 'Successfully created',
            variant: 'default',
          });
          onClose?.();
        },
      },
    );
  }

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
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

          <Button type='submit' disabled={isPending}>
            Add
          </Button>
          {isPending && <Icons.spinner className='h-5 w-5 animate-spin' />}
        </form>
      </Form>
    </div>
  );
}
