import { Button } from '@kijk/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kijk/ui/components/dialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { categoryRulesQueryOptions, deleteCategoryRuleMutationOptions } from '@/shared/api/category-rules/options';
import type { CategoryRule } from '@/shared/api/category-rules/types';
import { HouseholdPermissions } from '@/shared/api/households/permissions';
import { queryKeys } from '@/shared/api/query-keys';
import { useHouseholdPermission } from '@/shared/hooks/use-household-permission';

const ruleScopeLabels: Record<CategoryRule['scope'], string> = {
  Counterparty: 'Counterparty account',
  Keyword: 'Purpose contains this word',
  Merchant: 'Merchant name',
};

/** Dialog listing remembered category corrections, with deleting them. */
export function RulesDialog() {
  const canRecord = useHouseholdPermission(HouseholdPermissions.finances.record);
  const queryClient = useQueryClient();
  const { data: rules = [], isPending } = useQuery(categoryRulesQueryOptions());
  const deleteMutation = useMutation({
    ...deleteCategoryRuleMutationOptions(),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.categoryRules.all });
    },
  });

  function onDelete(id: string) {
    deleteMutation.mutate(id, {
      onError: (error) => toast.error(error.name, { description: error.message }),
      onSuccess: () => toast.success('Rule deleted; transactions keep their categories'),
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='outline'>
          <Sparkles /> Rules
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Remembered categories</DialogTitle>
          <DialogDescription>
            Imports give these merchants and counterparties their category automatically. Corrections you make by hand
            always win.
          </DialogDescription>
        </DialogHeader>
        {!isPending && rules.length === 0 ? (
          <p className='text-muted-foreground text-sm'>
            No rules yet. After changing a category, choose “Remember” in the confirmation.
          </p>
        ) : (
          <ul className='divide-y'>
            {rules.map((rule) => (
              <li key={rule.id} className='flex items-center justify-between gap-3 py-2'>
                <span>
                  {rule.label || 'Unnamed'} <span className='text-muted-foreground'>→ {rule.categoryName}</span>
                  <span className='text-muted-foreground block text-xs'>{ruleScopeLabels[rule.scope]}</span>
                </span>
                <Button
                  aria-label={`Delete rule for ${rule.label}`}
                  disabled={!canRecord || deleteMutation.isPending}
                  size='icon-sm'
                  variant='ghost'
                  onClick={() => onDelete(rule.id)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
