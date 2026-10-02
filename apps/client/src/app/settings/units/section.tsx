import { Button } from '@kijk/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kijk/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kijk/ui/components/dialog';
import { Separator } from '@kijk/ui/components/separator';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { BarChart3, Hash, List } from 'lucide-react';
import { useDeferredValue, useState } from 'react';

import { HouseholdPermissions, hasHouseholdPermission } from '@/shared/api/households/permissions';
import { systemUnitsQueryOptions, unitPageQueryOptions } from '@/shared/api/units/options';
import { currentUserQueryOptions } from '@/shared/api/users/options';

import { UnitCreateForm } from './create-form';
import { UnitTable } from './table';

interface Props {
  householdId?: string;
  scope: 'household' | 'personal';
}

/** Units page for personal units or the units of a household, with statistics, table and create dialog. */
export function UnitsSection({ householdId: selectedHouseholdId, scope }: Props) {
  const [showDialog, setShowDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const { data: pageData, isPending } = useQuery(
    unitPageQueryOptions(scope, selectedHouseholdId, page, 20, deferredSearch),
  );
  const { data: systemUnits = [] } = useQuery(systemUnitsQueryOptions());
  const { data: currentAccount } = useQuery(currentUserQueryOptions());
  const households = currentAccount?.user?.households ?? [];
  const activeHousehold = households.find((household) => household.isActive);
  const householdId = selectedHouseholdId ?? activeHousehold?.id;
  const selectedHousehold = households.find((household) => household.id === householdId);
  // In the household scope a new unit is shared with that household right away, which needs units:share.
  const canCreate =
    scope === 'personal' ||
    (householdId !== undefined && hasHouseholdPermission(selectedHousehold, HouseholdPermissions.units.share));
  const shareableHouseholds = households.filter((household) =>
    hasHouseholdPermission(household, HouseholdPermissions.units.share),
  );

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>
          {scope === 'personal' ? 'Units' : `${selectedHousehold?.name ?? 'Household'} units`}
        </h3>
        <p className='text-muted-foreground text-sm'>
          {scope === 'personal'
            ? 'Browse system units and manage the custom units you can use across households.'
            : 'Browse system units and units shared with this household.'}
        </p>
      </div>
      <Separator />
      {scope === 'household' && (
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
      <div className='flex justify-end'>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button
              disabled={!canCreate}
              title={canCreate ? undefined : 'Your household role does not allow sharing units'}
              variant='outline'
            >
              Create
            </Button>
          </DialogTrigger>
          <DialogContent className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle>Create Unit</DialogTitle>
              <DialogDescription>Define a custom unit relative to a supported system unit.</DialogDescription>
            </DialogHeader>
            <UnitCreateForm
              householdId={scope === 'household' ? householdId : undefined}
              onClose={() => setShowDialog(false)}
              systemUnits={systemUnits}
            />
          </DialogContent>
        </Dialog>
      </div>
      <Card className='min-w-0'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Units</CardTitle>
          <List className='text-muted-foreground h-4 w-4' />
        </CardHeader>
        <CardContent>
          <UnitTable
            householdId={householdId}
            shareableHouseholds={shareableHouseholds}
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
