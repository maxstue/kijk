import { Badge } from '@kijk/ui/components/badge';
import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@kijk/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kijk/ui/components/dialog';
import { Progress } from '@kijk/ui/components/progress';
import { Separator } from '@kijk/ui/components/separator';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Gauge, Pencil, Plus, TriangleAlert } from 'lucide-react';
import { useState } from 'react';

import { ConsumptionLimitForm } from '@/app/consumption-limits/form';
import { consumptionLimitsQueryOptions } from '@/shared/api/consumption-limits/options';
import type { ConsumptionLimit } from '@/shared/api/consumption-limits/types';

export function ConsumptionLimitsSection() {
  const { data } = useSuspenseQuery(consumptionLimitsQueryOptions());
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Consumption limits</h2>
          <p className='text-muted-foreground'>
            Set targets for each resource and see when your household reaches them.
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button variant='outline'>
              <Plus /> Add limit
            </Button>
          </DialogTrigger>
          <DialogContent className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle>Create consumption limit</DialogTitle>
              <DialogDescription>Choose a resource, period and maximum consumption.</DialogDescription>
            </DialogHeader>
            <ConsumptionLimitForm onClose={() => setShowCreateDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>
      <Separator />
      {data.length === 0 ? (
        <Card className='border-dashed'>
          <CardContent className='flex flex-col items-center gap-2 py-12 text-center'>
            <Gauge className='text-muted-foreground size-8' />
            <p className='font-medium'>No consumption limits yet</p>
            <p className='text-muted-foreground text-sm'>Create a limit to start monitoring household usage.</p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {data.map((limit) => (
            <LimitCard key={limit.id} limit={limit} />
          ))}
        </div>
      )}
    </div>
  );
}

function LimitCard({ limit }: { limit: ConsumptionLimit }) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const isExceeded = limit.isExceeded && limit.active;

  return (
    <Card className={isExceeded ? 'border-destructive' : undefined}>
      <CardHeader>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <CardTitle>{limit.name}</CardTitle>
            <p className='text-muted-foreground mt-1 text-sm'>
              {limit.resource.name} · {limit.period}
            </p>
          </div>
          <LimitStatus active={limit.active} exceeded={limit.isExceeded} />
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {isExceeded && (
          <div className='text-destructive flex items-center gap-2 text-sm font-medium'>
            <TriangleAlert className='size-4' /> Consumption is over the configured limit
          </div>
        )}
        <UsageProgress limit={limit} />
        {limit.description && <p className='text-muted-foreground text-sm'>{limit.description}</p>}
      </CardContent>
      <CardFooter className='justify-end'>
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogTrigger asChild>
            <Button size='sm' variant='ghost'>
              <Pencil /> Edit
            </Button>
          </DialogTrigger>
          <DialogContent className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle>Edit consumption limit</DialogTitle>
              <DialogDescription>Update the target, period or warning status.</DialogDescription>
            </DialogHeader>
            <ConsumptionLimitForm initialData={limit} onClose={() => setShowEditDialog(false)} />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}

function LimitStatus({ active, exceeded }: { active: boolean; exceeded: boolean }) {
  if (!active) return <Badge variant='secondary'>Paused</Badge>;
  if (exceeded) return <Badge variant='destructive'>Limit reached</Badge>;
  return <Badge variant='outline'>Active</Badge>;
}

function UsageProgress({ limit }: { limit: ConsumptionLimit }) {
  const percentage = Number(limit.utilizationPercentage);
  const displayPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className='space-y-2'>
      <div className='flex items-end justify-between gap-2'>
        <span className='text-2xl font-bold'>
          {Number(limit.actualValue).toLocaleString()} {limit.resource.unit}
        </span>
        <span className='text-muted-foreground text-sm'>
          of {Number(limit.limit).toLocaleString()} {limit.resource.unit}
        </span>
      </div>
      <Progress
        className={limit.isExceeded ? '[&_[data-slot=progress-indicator]]:bg-destructive' : undefined}
        value={displayPercentage}
      />
      <div className='text-muted-foreground flex justify-between text-xs'>
        <span>{percentage.toLocaleString()}% used</span>
        <span>{Number(limit.remainingValue).toLocaleString()} remaining</span>
      </div>
    </div>
  );
}
