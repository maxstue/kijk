import { AlertDialog } from '@kijk/ui/components/alert-dialog';
import { Button } from '@kijk/ui/components/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@kijk/ui/components/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kijk/ui/components/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@kijk/ui/components/tooltip';
import type { Row } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

import { CategoryDeleteContent } from '@/app/categories/delete-content';
import { CategoryForm } from '@/app/categories/form';
import type { Category } from '@/shared/api/categories/types';
import type { DataTableFeatures } from '@/shared/lib/table-features';

interface Props {
  canConfigure: boolean;
  row: Row<DataTableFeatures, Category>;
}

/** Row menu of the category table: update and delete. System categories and missing permissions disable both. */
export function CategoryRowActions({ canConfigure, row }: Props) {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const category = row.original;
  const restriction = getManagementRestriction(category, canConfigure);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className='h-8 w-8 p-0' variant='ghost'>
            <span className='sr-only'>Open menu</span>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <CategoryMenuItem
            label='Update'
            restriction={restriction}
            tooltip='Update category'
            onSelect={() => setShowUpdateDialog(true)}
          />
          <DropdownMenuSeparator />
          <CategoryMenuItem
            label='Delete'
            restriction={restriction}
            tooltip='Delete category'
            variant='destructive'
            onSelect={() => setShowDeleteDialog(true)}
          />
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <div className='max-h-[calc(100vh-5rem)] space-y-6 overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>Update {category.name}</DialogTitle>
              <DialogDescription>The kind of a category with budgets cannot be changed.</DialogDescription>
            </DialogHeader>
            <CategoryForm initialData={category} onClose={() => setShowUpdateDialog(false)} />
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <CategoryDeleteContent category={category} onClose={() => setShowDeleteDialog(false)} />
      </AlertDialog>
    </>
  );
}

function getManagementRestriction(category: Category, canConfigure: boolean) {
  if (category.creatorType === 'System') {
    return 'Default categories are read-only.';
  }

  if (!canConfigure) {
    return 'Your role in this space does not allow managing categories.';
  }
}

interface CategoryMenuItemProps {
  label: string;
  onSelect: () => void;
  restriction: string | undefined;
  tooltip: string;
  variant?: 'default' | 'destructive';
}

function CategoryMenuItem({ label, onSelect, restriction, tooltip, variant }: CategoryMenuItemProps) {
  const disabled = restriction !== undefined;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={disabled ? 'cursor-not-allowed' : undefined}>
          <DropdownMenuItem disabled={disabled} variant={variant} onSelect={onSelect}>
            {label}
          </DropdownMenuItem>
        </div>
      </TooltipTrigger>
      <TooltipContent>{restriction ?? tooltip}</TooltipContent>
    </Tooltip>
  );
}
