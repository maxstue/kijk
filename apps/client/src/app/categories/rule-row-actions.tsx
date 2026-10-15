import { deleteCategoryRuleMutationOptions } from '@kijk/api/category-rules/options';
import type { CategoryRule } from '@kijk/api/category-rules/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@kijk/ui/components/alert-dialog';
import { Button } from '@kijk/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@kijk/ui/components/dropdown-menu';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { Tooltip, TooltipContent, TooltipTrigger } from '@kijk/ui/components/tooltip';
import { useMutation } from '@tanstack/react-query';
import type { Row } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useSpaceId } from '@/shared/hooks/use-active-space';
import type { DataTableFeatures } from '@/shared/lib/table-features';

interface Props {
  canRecord: boolean;
  row: Row<DataTableFeatures, CategoryRule>;
}

/** Row menu of the rule table: delete. Rules are created from corrections and cannot be edited. */
export function CategoryRuleRowActions({ canRecord, row }: Props) {
  const spaceId = useSpaceId();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { isPending, mutate } = useMutation(deleteCategoryRuleMutationOptions(spaceId));
  const rule = row.original;
  const restriction = canRecord ? undefined : 'Your role in this space does not allow deleting rules.';

  const handleDelete = () => {
    mutate(rule.id, {
      onError(error) {
        toast.error(error.name, { description: error.message });
      },
      onSuccess() {
        toast.success('Rule deleted; transactions keep their categories');
        setShowDeleteDialog(false);
      },
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button className='h-8 w-8 p-0' variant='ghost' />}>
          <span className='sr-only'>Open menu</span>
          <MoreHorizontal className='h-4 w-4' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <Tooltip>
              <TooltipTrigger render={<div className={restriction ? 'cursor-not-allowed' : undefined} />}>
                <DropdownMenuItem
                  disabled={restriction !== undefined}
                  variant='destructive'
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Delete
                </DropdownMenuItem>
              </TooltipTrigger>
              <TooltipContent>{restriction ?? 'Delete rule'}</TooltipContent>
            </Tooltip>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete the rule for {rule.label || 'this transaction'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Future imports no longer get this category automatically. Existing transactions keep their categories.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              variant='destructive'
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
            >
              {isPending ? <SpinnerIcon className='size-5 animate-spin' /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
