import { Check, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/shared/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/shared/components/ui/command';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { useZodForm } from '@/shared/components/ui/form/use-zod-form';
import { Input } from '@/shared/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { cn } from '@/shared/lib/helpers';

const languages = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Spanish', value: 'es' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Russian', value: 'ru' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Chinese', value: 'zh' },
] as const;

const accountFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: 'Name must be at least 2 characters.',
    })
    .max(30, {
      message: 'Name must not be longer than 30 characters.',
    }),
  language: z.string({
    required_error: 'Please select a language.',
  }),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

// This can come from your database or API.
const defaultValues: Partial<AccountFormValues> = {
  name: '',
  // dob: new Date("2023-01-23"),
};

export function AccountForm() {
  const form = useZodForm({
    schema: accountFormSchema,
    defaultValues,
    mode: 'onBlur',
  });

  function onSubmit(data: AccountFormValues) {
    toast('You submitted the following values:', {
      description: (
        <pre className='mt-2 w-[340px] rounded bg-slate-950 p-4'>
          <code className='text-white'>{JSON.stringify(data, undefined, 2)}</code>
        </pre>
      ),
    });
  }

  return (
    <Form className='space-y-8' form={form} onSubmit={onSubmit}>
      <FormField
        control={form.control}
        name='name'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder='Your name' {...field} />
            </FormControl>
            <FormDescription>This is the name that will be displayed on your profile and in emails.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name='language'
        render={({ field }) => (
          <FormItem className='flex flex-col'>
            <FormLabel>Language</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    className={cn('w-[200px] justify-between', !field.value && 'text-muted-foreground')}
                    role='combobox'
                    aria-expanded={field.value ? 'true' : 'false'}
                    aria-controls='language-popover'
                    variant='outline'
                  >
                    {field.value
                      ? languages.find((language) => language.value === field.value)?.label
                      : 'Select language'}
                    <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className='w-[200px] p-0'>
                <Command>
                  <CommandInput placeholder='Search framework...' />
                  <CommandEmpty>No framework found.</CommandEmpty>
                  <CommandGroup>
                    {languages.map((language) => (
                      <CommandItem
                        key={language.value}
                        value={language.value}
                        onSelect={(value) => {
                          form.setValue('language', value);
                        }}
                      >
                        <Check
                          className={cn('mr-2 h-4 w-4', language.value === field.value ? 'opacity-100' : 'opacity-0')}
                        />
                        {language.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            <FormDescription>This is the language that will be used in the dashboard.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button type='submit'>Update account</Button>
    </Form>
  );
}
