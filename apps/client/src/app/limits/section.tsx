import { AlertDialog, AlertDialogTrigger } from '@kijk/ui/components/alert-dialog';
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
import { useSuspenseQuery } from '@tanstack/react-query';
import { EditIcon, Gauge, Trash2, TriangleAlert } from 'lucide-react';
import { useState } from 'react';

import { LimitDeleteContent } from '@/app/limits/delete-content';
import { LimitForm } from '@/app/limits/form';
import { limitsQueryOptions } from '@/shared/api/limits/options';
import type { Limit } from '@/shared/api/limits/types';
import { SpacePermissions } from '@/shared/api/spaces/permissions';
import { PageAddButton, PageToolbar } from '@/shared/components/page-header';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';

/** Page section listing the space's limits with create, edit and delete actions. */
export function LimitsSection() {
  const canPlan = useSpacePermission(SpacePermissions.limits.plan);
  const { data } = useSuspenseQuery(limitsQueryOptions());
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className='space-y-6'>
      <PageToolbar
        actions={
          <>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <PageAddButton
                  disabled={!canPlan}
                  title={canPlan ? undefined : 'Your role in this space does not allow planning limits'}
                >
                  Add limit
                </PageAddButton>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create consumption limit</DialogTitle>
                  <DialogDescription>Choose a resource, period and maximum consumption.</DialogDescription>
                </DialogHeader>
                <LimitForm onClose={() => setShowCreateDialog(false)} />
              </DialogContent>
            </Dialog>
          </>
        }
      />
      {data.length === 0 ? (
        <Card className='border-dashed'>
          <CardContent className='flex flex-col items-center gap-2 py-12 text-center'>
            <Gauge className='text-muted-foreground size-8' />
            <p className='font-medium'>No consumption limits yet</p>
            <p className='text-muted-foreground text-sm'>Create a limit to start monitoring usage in this space.</p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {data.map((limit) => (
            <LimitCard key={limit.id} canPlan={canPlan} limit={limit} />
          ))}
        </div>
      )}
    </div>
  );
}

function LimitCard({ limit, canPlan }: { limit: Limit; canPlan: boolean }) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isExceeded = limit.isExceeded && limit.active;

  return (
    <Card className={`transition-shadow hover:shadow-md ${isExceeded ? 'border-destructive' : ''}`}>
      <CardHeader>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0 space-y-2'>
            <CardTitle>{limit.name}</CardTitle>
            <Badge variant='outline'>
              {limit.resource.name} · {limit.period}
            </Badge>
          </div>
          <LimitStatus active={limit.active} exceeded={limit.isExceeded} />
        </div>
      </CardHeader>
      <CardContent className='flex-1 space-y-4'>
        {isExceeded && (
          <div className='text-destructive flex items-center gap-2 text-sm font-medium'>
            <TriangleAlert className='size-4' /> Consumption is over the configured limit
          </div>
        )}
        <UsageProgress limit={limit} />
        <p className='text-muted-foreground text-sm'>
          Last reached:{' '}
          {limit.lastOccurrence ? (
            <time dateTime={limit.lastOccurrence}>
              {new Date(limit.lastOccurrence).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </time>
          ) : (
            'Not recorded yet'
          )}
        </p>
        {limit.description && <p className='text-muted-foreground text-sm'>{limit.description}</p>}
      </CardContent>
      <CardFooter className='w-full justify-end gap-2 border-t pt-4'>
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogTrigger asChild>
            <Button
              disabled={!canPlan}
              title={canPlan ? undefined : 'Your role in this space does not allow planning limits'}
              aria-label='Delete limit'
              size='icon'
              variant='destructive'
            >
              <Trash2 className='size-4' />
            </Button>
          </AlertDialogTrigger>
          <LimitDeleteContent limit={limit} onClose={() => setShowDeleteDialog(false)} />
        </AlertDialog>
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogTrigger asChild>
            <Button
              disabled={!canPlan}
              title={canPlan ? undefined : 'Your role in this space does not allow planning limits'}
              aria-label='Edit limit'
              className='text-muted-foreground'
              size='icon'
              variant='outline'
            >
              <EditIcon className='size-4' />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit consumption limit</DialogTitle>
              <DialogDescription>Update the target, period or warning status.</DialogDescription>
            </DialogHeader>
            <LimitForm initialData={limit} onClose={() => setShowEditDialog(false)} />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}

function LimitStatus({ active, exceeded }: { active: boolean; exceeded: boolean }) {
  if (!active) {
    return <Badge variant='secondary'>Paused</Badge>;
  }
  if (exceeded) {
    return <Badge variant='destructive'>Limit reached</Badge>;
  }
  return <Badge variant='secondary'>Active</Badge>;
}

function UsageProgress({ limit }: { limit: Limit }) {
  const percentage = Number(limit.utilizationPercentage);
  const displayPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className='space-y-2'>
      <div className='grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-x-2 gap-y-3'>
        <span className='text-muted-foreground min-w-0'>Current consumption</span>
        <span className='text-foreground min-w-[4ch] text-right font-medium tabular-nums'>
          {Number(limit.actualValue).toLocaleString()}
        </span>
        <span className='text-xs' style={{ color: limit.resource.color }}>
          {limit.resource.unit}
        </span>
        <span className='text-muted-foreground/80 min-w-0 text-sm'>Consumption limit</span>
        <span className='text-muted-foreground min-w-[4ch] text-right text-sm tabular-nums'>
          {Number(limit.limit).toLocaleString()}
        </span>
        <span className='text-xs' style={{ color: limit.resource.color }}>
          {limit.resource.unit}
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
