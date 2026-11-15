import * as limitsOptions from '@kijk/api/limits/options';
import type { LimitsQuery } from '@kijk/api/limits/types';
import * as resourcesOptions from '@kijk/api/resources/options';
import { SpacePermissions } from '@kijk/api/spaces/permissions';
import { Button } from '@kijk/ui/components/button';
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
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Gauge, LayoutGrid, List } from 'lucide-react';
import { useState } from 'react';

import { ListFilter } from '@/shared/components/list-filter';
import { ListPagination } from '@/shared/components/list-pagination';
import { PageAddButton } from '@/shared/components/page-header';
import { PageToolbar, PageToolbarActions, PageToolbarControls } from '@/shared/components/page-toolbar';
import { SearchInput } from '@/shared/components/search-input';
import { useSpaceId } from '@/shared/hooks/use-active-space';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';

import { LimitDialogs } from './actions';
import { LimitForm } from './form';
import { periods } from './schemas';
import type { LimitSelection, LimitsView } from './types';
import { LimitsGrid, LimitsList } from './views';

interface Props {
  view: LimitsView;
  query: LimitsQuery;
  onQueryChange: (query: LimitsQuery) => void;
  onViewChange: (view: LimitsView) => void;
}

/** One query and stable dialog ownership shared by both presentations. */
export function LimitsSection({ view, onViewChange, query, onQueryChange }: Props) {
  const spaceId = useSpaceId();
  const canPlan = useSpacePermission(SpacePermissions.limits.plan);
  const { data, isPending, isFetching, isError, refetch } = useQuery(limitsOptions.listQueryOptions(spaceId, query));
  const { data: resources } = useSuspenseQuery(resourcesOptions.listQueryOptions(spaceId));
  const update = (change: Partial<LimitsQuery>) => onQueryChange({ ...query, ...change, page: 1 });
  const limits = data?.items ?? [];
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selection, setSelection] = useState<LimitSelection | null>(null);
  const selectedLimit = limits.find((limit) => limit.id === selection?.id);
  const limitsView =
    view === 'list' ? (
      <LimitsList limits={limits} canPlan={canPlan} onAction={setSelection} />
    ) : (
      <LimitsGrid limits={limits} canPlan={canPlan} onAction={setSelection} />
    );

  return (
    <div className='flex min-w-0 flex-col gap-6'>
      <PageToolbar>
        <PageToolbarControls>
          <SearchInput
            value={query.search ?? ''}
            aria-label='Search limits'
            placeholder='Search limit or resource…'
            onSearch={(search) => update({ search })}
          />
          <ListFilter
            label='Resources'
            value={query.resourceId}
            options={resources.items.map((resource) => ({ value: resource.id, label: resource.name }))}
            onChange={(resourceId) => update({ resourceId })}
          />
          <ListFilter
            label='Periods'
            value={query.period}
            options={periods.map((value) => ({ value, label: value }))}
            onChange={(period) => update({ period: period as LimitsQuery['period'] })}
          />
          <ListFilter
            label='Sort order'
            allowAll={false}
            value={query.sort ?? 'Resource'}
            options={[
              { value: 'Resource', label: 'Resource' },
              { value: 'Name', label: 'Name' },
              { value: 'Period', label: 'Period' },
            ]}
            onChange={(sort) => update({ sort: sort as LimitsQuery['sort'] })}
          />
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
      {isPending && <p role='status'>Loading limits…</p>}
      {isError && (
        <div role='alert'>
          Limits could not be loaded.{' '}
          <Button variant='outline' onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      )}
      <div className='min-w-0' aria-busy={isFetching}>
        {data && limits.length === 0 ? (
          <Card className='border-dashed'>
            <CardContent className='flex flex-col items-center gap-2 py-12 text-center'>
              <Gauge className='text-muted-foreground size-8' />
              <p className='font-medium'>No matching consumption limits</p>
              <p className='text-muted-foreground text-sm'>
                {query.search || query.resourceId || query.period
                  ? 'Try another search or clear the filters.'
                  : 'Create a limit to start monitoring usage in this space.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          limitsView
        )}
      </div>
      {data && (
        <ListPagination {...data} isFetching={isFetching} onPageChange={(page) => onQueryChange({ ...query, page })} />
      )}
      <LimitDialogs limit={selectedLimit} selection={selection} onClose={() => setSelection(null)} />
    </div>
  );
}
