import * as limitsOptions from '@kijk/api/limits/options';
import { SpacePermissions } from '@kijk/api/spaces/permissions';
import { Card, CardContent } from '@kijk/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kijk/ui/components/dialog';
import { ToggleGroup, ToggleGroupItem } from '@kijk/ui/components/toggle-group';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Gauge, LayoutGrid, List } from 'lucide-react';
import { useState } from 'react';

import { PageAddButton } from '@/shared/components/page-header';
import { PageToolbar, PageToolbarActions, PageToolbarControls } from '@/shared/components/page-toolbar';
import { useSpaceId } from '@/shared/hooks/use-active-space';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';

import { LimitDialogs } from './actions';
import { LimitForm } from './form';
import type { LimitSelection, LimitsView } from './types';
import { LimitsGrid, LimitsList } from './views';

interface LimitsSectionProps {
  view: LimitsView;
  onViewChange: (view: LimitsView) => void;
}

/** One query and stable dialog ownership shared by both presentations. */
export function LimitsSection({ view, onViewChange }: LimitsSectionProps) {
  const spaceId = useSpaceId();
  const canPlan = useSpacePermission(SpacePermissions.limits.plan);
  const { data } = useSuspenseQuery(limitsOptions.listQueryOptions(spaceId));
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selection, setSelection] = useState<LimitSelection | null>(null);
  const selectedLimit = data.find((limit) => limit.id === selection?.id);
  const limitsView =
    view === 'list' ? (
      <LimitsList limits={data} canPlan={canPlan} onAction={setSelection} />
    ) : (
      <LimitsGrid limits={data} canPlan={canPlan} onAction={setSelection} />
    );

  return (
    <div className='flex min-w-0 flex-col gap-6'>
      <PageToolbar>
        <PageToolbarControls>
          <ToggleGroup
            aria-label='Limits view'
            variant='outline'
            size='sm'
            spacing={0}
            value={[view]}
            onValueChange={(values) => {
              const nextView = values[0];
              if (nextView === 'list' || nextView === 'cards') {
                onViewChange(nextView);
              }
            }}
          >
            <ToggleGroupItem value='list' aria-label='List view'>
              <List data-icon='inline-start' /> List
            </ToggleGroupItem>
            <ToggleGroupItem value='cards' aria-label='Card view'>
              <LayoutGrid data-icon='inline-start' /> Cards
            </ToggleGroupItem>
          </ToggleGroup>
        </PageToolbarControls>
        <PageToolbarActions>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger
              render={
                <PageAddButton
                  disabled={!canPlan}
                  title={canPlan ? undefined : 'Your role in this space does not allow planning limits'}
                />
              }
            >
              Add limit
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create consumption limit</DialogTitle>
                <DialogDescription>Choose a resource, period and maximum consumption.</DialogDescription>
              </DialogHeader>
              <LimitForm onClose={() => setShowCreateDialog(false)} />
            </DialogContent>
          </Dialog>
        </PageToolbarActions>
      </PageToolbar>
      {data.length === 0 ? (
        <Card className='border-dashed'>
          <CardContent className='flex flex-col items-center gap-2 py-12 text-center'>
            <Gauge className='text-muted-foreground size-8' />
            <p className='font-medium'>No consumption limits yet</p>
            <p className='text-muted-foreground text-sm'>Create a limit to start monitoring usage in this space.</p>
          </CardContent>
        </Card>
      ) : (
        limitsView
      )}
      <LimitDialogs limit={selectedLimit} selection={selection} onClose={() => setSelection(null)} />
    </div>
  );
}
