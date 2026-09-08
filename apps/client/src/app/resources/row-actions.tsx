import { AlertDialog } from '@kijk/ui/components/alert-dialog';
import { Button } from '@kijk/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kijk/ui/components/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@kijk/ui/components/tooltip';
import { useNavigate } from '@tanstack/react-router';
import type { Row } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { ResourceTypeDeleteContent } from '@/app/resources/delete-content';
import { CreatorTypes, type CreatorType, type Resource } from '@/shared/types/domain';

interface DataTableRowActionsProps<TData> {
  canManage: boolean;
  row: Row<TData>;
}

export function ResourceTypeRowActions<TData extends Resource>({ canManage, row }: DataTableRowActionsProps<TData>) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const navigate = useNavigate();
  const resourceType = row.original;
  const managementRestriction = getManagementRestriction(resourceType.creatorType, canManage);
  const managementActionsDisabled = managementRestriction !== undefined;

  const handleCopyName = useCallback(async () => {
    await navigator.clipboard.writeText(resourceType.name);
    toast(`Successfully copied: ${resourceType.name}`);
  }, [resourceType.name]);

  const handleCloseDeleteDialog = useCallback(() => setShowDeleteDialog(false), []);

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
          <DropdownMenuItem onClick={handleCopyName}>Copy Name</DropdownMenuItem>
          <ResourceManagementMenuItem
            disabled={managementActionsDisabled}
            label='Update'
            tooltip={managementRestriction ?? 'Update resource'}
            onSelect={() =>
              navigate({
                to: '/resources/$resourceId',
                params: { resourceId: resourceType.id },
                search: (previous) => previous,
              })
            }
          />
          <DropdownMenuSeparator />
          <ResourceManagementMenuItem
            disabled={managementActionsDisabled}
            label='Delete'
            tooltip={managementRestriction ?? 'Delete resource'}
            variant='destructive'
            onSelect={() => setShowDeleteDialog(true)}
          />
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <ResourceTypeDeleteContent resourceType={resourceType} onClose={handleCloseDeleteDialog} />
      </AlertDialog>
    </>
  );
}

function getManagementRestriction(creatorType: CreatorType, canManage: boolean) {
  if (creatorType === CreatorTypes.SYSTEM) {
    return 'System resources are read-only.';
  }

  if (!canManage) {
    return 'Household admin role required.';
  }
}

interface ResourceManagementMenuItemProps {
  disabled: boolean;
  label: string;
  onSelect: () => void;
  tooltip: string;
  variant?: 'default' | 'destructive';
}

function ResourceManagementMenuItem({ disabled, label, onSelect, tooltip, variant }: ResourceManagementMenuItemProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={disabled ? 'cursor-not-allowed' : undefined}>
          <DropdownMenuItem disabled={disabled} variant={variant} onSelect={onSelect}>
            {label}
          </DropdownMenuItem>
        </div>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
