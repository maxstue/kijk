import { Card, CardContent, CardHeader, CardTitle } from '@kijk/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kijk/ui/components/dialog';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { BarChart3, Hash, List } from 'lucide-react';
import { useDeferredValue, useState } from 'react';

import { SpacePermissions, hasSpacePermission } from '@/shared/api/spaces/permissions';
import { systemUnitsQueryOptions, unitPageQueryOptions } from '@/shared/api/units/options';
import { currentUserQueryOptions } from '@/shared/api/users/options';
import { PageAddButton, PageHeader } from '@/shared/components/page-header';

import { UnitCreateForm } from './create-form';
import { UnitTable } from './table';

interface Props {
  spaceId?: string;
  scope: 'space' | 'personal';
}

/** Units page for personal units or the units of a space, with statistics, table and create dialog. */
export function UnitsSection({ spaceId: selectedSpaceId, scope }: Props) {
  const [showDialog, setShowDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const { data: pageData, isPending } = useQuery(
    unitPageQueryOptions(scope, selectedSpaceId, page, 20, deferredSearch),
  );
  const { data: systemUnits = [] } = useQuery(systemUnitsQueryOptions());
  const { data: currentAccount } = useQuery(currentUserQueryOptions());
  const spaces = currentAccount?.user?.spaces ?? [];
  const activeSpace = spaces.find((space) => space.isActive);
  const spaceId = selectedSpaceId ?? activeSpace?.id;
  const selectedSpace = spaces.find((space) => space.id === spaceId);
  // In the space scope a new unit is shared with that space right away, which needs units:share.
  const canCreate =
    scope === 'personal' || (spaceId !== undefined && hasSpacePermission(selectedSpace, SpacePermissions.units.share));
  const shareableSpaces = spaces.filter((space) => hasSpacePermission(space, SpacePermissions.units.share));

  return (
    <div className='space-y-6'>
      <PageHeader
        actions={
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <PageAddButton
                disabled={!canCreate}
                title={canCreate ? undefined : 'Your role in this space does not allow sharing units'}
              >
                Add unit
              </PageAddButton>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Unit</DialogTitle>
                <DialogDescription>Define a custom unit relative to a supported system unit.</DialogDescription>
              </DialogHeader>
              <UnitCreateForm
                spaceId={scope === 'space' ? spaceId : undefined}
                onClose={() => setShowDialog(false)}
                systemUnits={systemUnits}
              />
            </DialogContent>
          </Dialog>
        }
        title={scope === 'personal' ? 'Units' : `${selectedSpace?.name ?? 'Space'} units`}
        description={
          scope === 'personal'
            ? 'Browse system units and manage the custom units you can use across spaces.'
            : 'Browse system units and units shared with this space.'
        }
      />
      {scope === 'space' && (
        <p className='text-muted-foreground text-sm'>
          Have a personal unit to use here?{' '}
          <Link
            className='text-foreground underline underline-offset-4'
            params={{ section: 'units' }}
            to='/settings/$section'
          >
            Share it from your units
          </Link>
          .
        </p>
      )}
      <div className='grid gap-4 lg:grid-cols-2'>
        <UnitStatistic label='Overall' value={Number(pageData?.totalCount ?? 0)} icon='overall' />
        <UnitStatistic label='Custom' value={Number(pageData?.customCount ?? 0)} icon='custom' />
      </div>
      <Card className='min-w-0'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Units</CardTitle>
          <List className='text-muted-foreground h-4 w-4' />
        </CardHeader>
        <CardContent>
          <UnitTable
            spaceId={spaceId}
            shareableSpaces={shareableSpaces}
            isPending={isPending}
            items={pageData?.items ?? []}
            page={page}
            pageSize={20}
            scope={scope}
            search={search}
            setPage={setPage}
            setSearch={setSearch}
            systemUnits={systemUnits}
            totalCount={Number(pageData?.totalCount ?? 0)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function UnitStatistic({ icon, label, value }: { icon: 'custom' | 'overall'; label: string; value: number }) {
  const Icon = icon === 'overall' ? Hash : BarChart3;
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{label}</CardTitle>
        <Icon className='text-muted-foreground h-4 w-4' />
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
      </CardContent>
    </Card>
  );
}
