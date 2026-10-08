import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kijk/ui/components/dialog';
import { useState } from 'react';

import { CategoryForm } from '@/app/categories/form';
import { SpacePermissions } from '@/shared/api/spaces/permissions';
import { PageAddButton } from '@/shared/components/page-header';
import { useSpacePermission } from '@/shared/hooks/use-space-permission';

/** Page action for creating a category. */
export function CategoryCreateButton() {
  const canConfigure = useSpacePermission(SpacePermissions.finances.configure);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  return (
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogTrigger asChild>
        <PageAddButton
          disabled={!canConfigure}
          title={canConfigure ? undefined : 'Your role in this space does not allow managing categories'}
        >
          Add category
        </PageAddButton>
      </DialogTrigger>
      <DialogContent>
        <div className='max-h-[calc(100vh-5rem)] space-y-6 overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Add category</DialogTitle>
            <DialogDescription>Create a category for this space.</DialogDescription>
          </DialogHeader>
          <CategoryForm onClose={() => setShowCreateDialog(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
