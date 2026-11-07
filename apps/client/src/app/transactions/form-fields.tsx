import * as accountsOptions from '@kijk/api/accounts/options';
import * as categoriesOptions from '@kijk/api/categories/options';
import { Input } from '@kijk/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { ToggleGroup, ToggleGroupItem } from '@kijk/ui/components/toggle-group';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useFormContext } from 'react-hook-form';

import type { TransactionFormValues } from '@/app/transactions/schemas';
import { noneValue } from '@/app/transactions/schemas';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/form';
import { FormSwitchItem } from '@/shared/components/form-switch-item';
import { useSpaceId } from '@/shared/hooks/use-active-space';
import { accountLabel } from '@/shared/utils/format';

export function DirectionField() {
  const form = useFormContext<TransactionFormValues>();
  return (
    <FormField
      control={form.control}
      name='direction'
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <ToggleGroup
              className='w-full'
              value={[field.value]}
              variant='outline'
              onValueChange={(values) => values[0] && field.onChange(values[0])}
            >
              <ToggleGroupItem className='flex-1' value='expense'>
                Expense or payment
              </ToggleGroupItem>
              <ToggleGroupItem className='flex-1' value='income'>
                Income or refund
              </ToggleGroupItem>
            </ToggleGroup>
          </FormControl>
        </FormItem>
      )}
    />
  );
}

export function CategoryField() {
  const form = useFormContext<TransactionFormValues>();
  const spaceId = useSpaceId();
  const { data: categories } = useSuspenseQuery(categoriesOptions.listQueryOptions(spaceId));

  return (
    <FormField
      control={form.control}
      name='categoryId'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Category</FormLabel>
          <Select
            items={[
              { label: 'Uncategorized', value: noneValue },
              ...categories.map((category) => ({ label: category.name, value: category.id })),
            ]}
            value={field.value}
            onValueChange={field.onChange}
          >
            <FormControl>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value={noneValue}>Uncategorized</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function AccountField() {
  const form = useFormContext<TransactionFormValues>();
  const spaceId = useSpaceId();
  const { data: accounts } = useSuspenseQuery(accountsOptions.listQueryOptions(spaceId));

  return (
    <FormField
      control={form.control}
      name='accountId'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Account</FormLabel>
          <Select
            items={[
              { label: 'No account', value: noneValue },
              ...accounts.map((account) => ({ label: accountLabel(account), value: account.id })),
            ]}
            value={field.value}
            onValueChange={field.onChange}
          >
            <FormControl>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value={noneValue}>No account</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {accountLabel(account)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface SwitchFieldProps {
  description: string;
  label: string;
  name: 'isTransfer' | 'pending';
}

export function SwitchField({ description, label, name }: SwitchFieldProps) {
  const form = useFormContext<TransactionFormValues>();
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormSwitchItem
          checked={field.value}
          description={description}
          label={label}
          onCheckedChange={field.onChange}
        />
      )}
    />
  );
}

export function AmountField() {
  const form = useFormContext<TransactionFormValues>();
  return (
    <FormField
      control={form.control}
      name='amount'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Amount (EUR)</FormLabel>
          <FormControl>
            <Input
              min='0'
              step='0.01'
              type='number'
              {...field}
              onChange={(event) => field.onChange(event.target.valueAsNumber)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
export function BookingDateField() {
  const form = useFormContext<TransactionFormValues>();
  return (
    <FormField
      control={form.control}
      name='bookingDate'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Booking date</FormLabel>
          <FormControl>
            <Input type='date' {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
export function CounterpartyField() {
  const form = useFormContext<TransactionFormValues>();
  return (
    <FormField
      control={form.control}
      name='counterparty'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Counterparty</FormLabel>
          <FormControl>
            <Input maxLength={200} placeholder='Supermarket' {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
export function PurposeField() {
  const form = useFormContext<TransactionFormValues>();
  return (
    <FormField
      control={form.control}
      name='purpose'
      render={({ field }) => (
        <FormItem>
          <FormLabel>Purpose</FormLabel>
          <FormControl>
            <Input maxLength={500} placeholder='Weekly groceries' {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
