import { Suspense, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { EditIcon, Plus, Trash2Icon } from 'lucide-react';
import { z } from 'zod';
import { zodValidator } from '@tanstack/zod-adapter';
import type { Consumption, Months } from '@/shared/types/app';
import { ConsumptionCreateForm } from '@/app/consumptions/consumption-create-form.tsx';
import { ConsumptionsMonthNav } from '@/app/consumptions/consumptions-month-nav.tsx';
import ConsumptionsStats from '@/app/consumptions/consumptions-stats.tsx';
import { ConsumptionsTodayButton } from '@/app/consumptions/consumptions-today-button.tsx';
import { ResourceUnit } from '@/app/consumptions/resources-unit.tsx';
import { ConsumptionsYearSwitcher } from '@/app/consumptions/consumptions-year-switcher.tsx';
import { getConsumptionsQuery, useGetConsumptionsBy } from '@/app/consumptions/use-get-consumptions-by.ts';
import { NotFound } from '@/shared/components/not-found';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { AsyncLoader } from '@/shared/components/ui/loaders/async-loader';
import { Separator } from '@/shared/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet';
import { months } from '@/shared/types/app';
import { useSetSiteHeader } from '@/shared/hooks/use-set-site-header';
import { ConsumptionUpdateForm } from '@/app/consumptions/consumtions-update-form';
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
} from '@/shared/components/ui/alert-dialog';
import { useDeleteConsumption } from '@/app/consumptions/use-delete-consumption';
import { toast } from 'sonner';

const searchSchema = z.object({
  month: z
    .string()
    .transform((x) => x as Months)
    .default(months[new Date().getMonth()]),
  year: z.number().default(new Date().getFullYear()),
});

export const Route = createFileRoute('/_protected/consumptions')({
  loaderDeps: ({ search: { month, year } }) => ({ month, year }),
  validateSearch: zodValidator(searchSchema),
  loader: ({ context: { queryClient }, deps }) => {
    queryClient.ensureQueryData(getConsumptionsQuery(deps.year, deps.month));
  },
  component: UsagePage,
  notFoundComponent: NotFound,
  pendingComponent: () => <AsyncLoader className='h-6 w-6' />,
});

function UsagePage() {
  useSetSiteHeader('Consumptions');
  const [showSheet, setShowSheet] = useState(false);
  const searchParameters = Route.useSearch();
  const { data } = useGetConsumptionsBy(searchParameters.year, searchParameters.month);

  const handleClose = () => setShowSheet(false);

  return (
    <div className='space-y-6 pt-10'>
      <div className='space-y-0.5'>
        <h2 className='text-2xl font-bold tracking-tight'>Resource usage</h2>
        <p className='text-muted-foreground'>Manage your monthly resource usage</p>
      </div>
      <Separator className='my-6' />
      <div className='flex flex-col gap-8 lg:flex-row lg:space-y-0 lg:space-x-12'>
        <div className='flex-1'>
          <div className='flex flex-col gap-4'>
            <Suspense fallback={<AsyncLoader />}>
              <ConsumptionsStats />
            </Suspense>

            <div className='flex w-full justify-end'>
              <Sheet open={showSheet} onOpenChange={setShowSheet}>
                <div className='flex w-full justify-between'>
                  <div className='flex w-1/3 justify-start gap-4'>
                    <ConsumptionsTodayButton />
                    <Suspense>
                      <ConsumptionsYearSwitcher />
                    </Suspense>
                    <ConsumptionsMonthNav />
                  </div>
                  <SheetTrigger asChild>
                    <Button variant='outline'>
                      Add <Plus />
                    </Button>
                  </SheetTrigger>
                </div>
                <SheetContent className='space-y-8'>
                  <SheetHeader>
                    <SheetTitle>Add Consumption</SheetTitle>
                    <SheetDescription>Add a new consumption.</SheetDescription>
                  </SheetHeader>
                  <Suspense>
                    <ConsumptionCreateForm
                      month={searchParameters.month}
                      year={searchParameters.year}
                      onClose={handleClose}
                    />
                  </Suspense>
                </SheetContent>
              </Sheet>
            </div>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {data.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <CardTitle>{item.name}</CardTitle>
                  </CardHeader>
                  <CardContent className='flex flex-col gap-2'>
                    <div className='text-muted-foreground flex items-center justify-between'>
                      Amount
                      <div className='text-foreground'>{item.value}</div>
                    </div>
                    <div className='text-muted-foreground flex items-center justify-between'>
                      Unit
                      <ResourceUnit type={item.resource} />
                    </div>
                  </CardContent>
                  <CardFooter className='flex w-full justify-end gap-2'>
                    <DeleteButton id={item.id} date={item.date} />
                    <EditButton data={item} />
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditButton({ data }: { data: Consumption }) {
  const [showSheet, setShowSheet] = useState(false);

  const handleClose = () => setShowSheet(false);

  return (
    <Sheet open={showSheet} onOpenChange={setShowSheet}>
      <SheetTrigger asChild>
        <Button className='text-muted-foreground' size='icon' variant='outline'>
          <EditIcon className='size-4' />
        </Button>
      </SheetTrigger>
      <SheetContent className='space-y-8'>
        <SheetHeader>
          <SheetTitle>Add Consumption</SheetTitle>
          <SheetDescription>Add a new consumption.</SheetDescription>
        </SheetHeader>
        <Suspense>
          <ConsumptionUpdateForm initialData={data} onClose={handleClose} />
        </Suspense>
      </SheetContent>
    </Sheet>
  );
}

function DeleteButton({ id, date }: { id: string; date: string }) {
  const [showModal, setShowModal] = useState(false);
  const { mutate } = useDeleteConsumption();

  const handleDelete = () => {
    const month = new Date(date).getMonth();
    const year = new Date(date).getFullYear();
    mutate(
      { id, month: months[month], year },
      {
        onError(error) {
          toast.error(error.name, { description: error.message });
        },
        onSuccess() {
          toast.success('Successfully updated');
          setShowModal(false);
        },
      },
    );
  };

  return (
    <AlertDialog open={showModal} onOpenChange={setShowModal}>
      <AlertDialogTrigger asChild>
        <Button className='text-muted-foreground hover:text-destructive-foreground' size='icon' variant='outline'>
          <Trash2Icon className='size-4' />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this consumption from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className='bg-destructive hover:bg-destructive-foreground text-white'
            onClick={handleDelete}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
