import { format } from 'date-fns';
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import { z } from 'zod';

import { Button } from '@/shared/components/ui/button';
import { Calendar } from '@/shared/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/shared/components/ui/command';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form/form';
import { useZodForm } from '@/shared/components/ui/form/use-zod-form';
import { Input } from '@/shared/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { toast } from '@/shared/hooks/use-toast';
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
  dob: z.date({
    required_error: 'A date of birth is required.',
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
    toast({
      title: 'You submitted the following values:',
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
        name='dob'
        render={({ field }) => (
          <FormItem className='flex flex-col'>
            <FormLabel>Date of birth</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    className={cn('w-[240px] pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                    variant={'outline'}
                  >
                    {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                    <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent align='start' className='w-auto p-0'>
                <Calendar
                  autoFocus
                  disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                  mode='single'
                  selected={field.value}
                  onSelect={field.onChange}
                />
              </PopoverContent>
            </Popover>
            <FormDescription>Your date of birth is used to calculate your age.</FormDescription>
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
