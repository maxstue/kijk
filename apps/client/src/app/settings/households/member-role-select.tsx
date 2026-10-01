import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { changeHouseholdMemberRoleMutationOptions } from '@/shared/api/households/options';
import type { HouseholdMember, HouseholdRole } from '@/shared/api/households/types';
import { queryKeys } from '@/shared/api/query-keys';

interface Props {
  householdId: string;
  member: HouseholdMember;
  roles: HouseholdRole[];
}

export function MemberRoleSelect({ householdId, member, roles }: Props) {
  const queryClient = useQueryClient();
  const changeRoleMutation = useMutation(changeHouseholdMemberRoleMutationOptions());

  function changeRole(roleId: string) {
    if (roleId === member.role.id) return;
    changeRoleMutation.mutate(
      { householdId, roleId, userId: member.userId },
      {
        onError: (error) => toast.error(error.message),
        onSuccess: (updated) => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.households.members(householdId) });
          toast.success(`${updated.name} is now ${updated.role.name}`);
        },
      },
    );
  }

  return (
    <Select disabled={changeRoleMutation.isPending} value={member.role.id} onValueChange={changeRole}>
      <SelectTrigger aria-label={`Role of ${member.name}`} className='w-36' size='sm'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role.id} value={role.id}>
            {role.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
