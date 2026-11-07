import type { BudgetCategory } from '@kijk/api/budgets/types';
import { SpacePermissions } from '@kijk/api/spaces/permissions';
import { Badge } from '@kijk/ui/components/badge';
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
import { Progress } from '@kijk/ui/components/progress';
import { Pencil } from 'lucide-react';
import { useState } from 'react';

import { BudgetForm } from '@/app/budgets/form';
import { toAmount } from '@/app/budgets/helpers';
import { ResourceIcon } from '@/shared/components/resource-icon';
import { PrivateBadge } from '@/shared/components/visibility-select';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';
import { formatStringToCurrency } from '@/shared/utils/format';

interface CategoryCardProps {
  category: BudgetCategory;
  month: number;
  year: number;
}

export function CategoryCard({ category, month, year }: CategoryCardProps) {
  const hasBudget = category.budget !== null && category.budget !== undefined;
  const utilization = toAmount(category.utilizationPercentage);
  const pending = toAmount(category.pending);

  return (
    <Card className={category.isExceeded ? 'border-destructive' : undefined}>
      <CardHeader>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <ResourceIcon className='size-5' color={category.color} name={category.icon} />
            <CardTitle>{category.name}</CardTitle>
          </div>
          {category.budgetVisibility === 'Private' && <PrivateBadge />}
          {category.isExceeded && <Badge variant='destructive'>Over budget</Badge>}
          {!hasBudget && <Badge variant='secondary'>No budget</Badge>}
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='flex items-end justify-between gap-2'>
          <span className='text-2xl font-bold'>{formatStringToCurrency(category.spent)}</span>
          {hasBudget && (
            <span className='text-muted-foreground text-sm'>of {formatStringToCurrency(category.budget ?? 0)}</span>
          )}
        </div>
        {hasBudget && (
          <>
            <Progress
              className={category.isExceeded ? '[&_[data-slot=progress-indicator]]:bg-destructive' : undefined}
              value={Math.min(100, Math.max(0, utilization))}
            />
            <div className='text-muted-foreground flex justify-between text-xs'>
              <span>{utilization.toLocaleString()}% used</span>
              <span>{formatStringToCurrency(category.remaining ?? 0)} left</span>
            </div>
          </>
        )}
        {pending > 0 && (
          <p className='text-muted-foreground text-xs'>{formatStringToCurrency(pending)} pending, not counted yet</p>
        )}
        <div className='flex justify-end'>
          <EditBudgetButton category={category} month={month} year={year} />
        </div>
      </CardContent>
    </Card>
  );
}

interface EditBudgetButtonProps {
  category: BudgetCategory;
  month: number;
  year: number;
}

/** Opens the budget form of a category; members without budgets:plan may still set private budgets. */
function EditBudgetButton({ category, month, year }: EditBudgetButtonProps) {
  const canPlan = useSpacePermission(SpacePermissions.budgets.plan);
  const canRecord = useSpacePermission(SpacePermissions.finances.record);
  const canEdit = canPlan || canRecord;
  const [showDialog, setShowDialog] = useState(false);
  const hasBudget = category.budget !== null && category.budget !== undefined;

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger
        render={
          <Button
            disabled={!canEdit}
            size='sm'
            title={canEdit ? undefined : 'Your role in this space does not allow setting budgets'}
            variant='ghost'
          />
        }
      >
        <Pencil /> {hasBudget ? 'Change budget' : 'Set budget'}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Budget for {category.name}</DialogTitle>
          <DialogDescription>Earlier months keep their previous budget.</DialogDescription>
        </DialogHeader>
        <BudgetForm
          categoryId={category.categoryId}
          initialAmount={hasBudget ? toAmount(category.budget) : undefined}
          initialVisibility={category.budgetVisibility ?? undefined}
          month={month}
          year={year}
          onClose={() => setShowDialog(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
