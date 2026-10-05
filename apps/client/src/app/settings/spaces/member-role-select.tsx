import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queryKeys } from '@/shared/api/query-keys';
import { changeSpaceMemberRoleMutationOptions } from '@/shared/api/spaces/options';
import type { SpaceMember, SpaceRole } from '@/shared/api/spaces/types';

interface Props {
  spaceId: string;
  member: SpaceMember;
  roles: SpaceRole[];
}

/** Select that changes another member's role right away. */
export function MemberRoleSelect({ spaceId, member, roles }: Props) {
  const queryClient = useQueryClient();
  const changeRoleMutation = useMutation(changeSpaceMemberRoleMutationOptions());

  function changeRole(roleId: string) {
    if (roleId === member.role.id) {
      return;
    }
    changeRoleMutation.mutate(
      { spaceId, roleId, userId: member.userId },
      {
        onError: (error) => toast.error(error.message),
        onSuccess: (updated) => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.spaces.members(spaceId) });
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
