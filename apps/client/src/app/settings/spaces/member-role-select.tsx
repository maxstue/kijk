import { changeSpaceMemberRoleMutationOptions } from '@kijk/api/spaces/options';
import type { SpaceMember, SpaceRole } from '@kijk/api/spaces/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Props {
  spaceId: string;
  member: SpaceMember;
  roles: SpaceRole[];
}

/** Select that changes another member's role right away. */
export function MemberRoleSelect({ spaceId, member, roles }: Props) {
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
          toast.success(`${updated.name} is now ${updated.role.name}`);
        },
      },
    );
  }

  return (
    <Select
      disabled={changeRoleMutation.isPending}
      items={roles.map((role) => ({ label: role.name, value: role.id }))}
      value={member.role.id}
      onValueChange={(roleId) => {
        if (roleId) {
          changeRole(roleId);
        }
      }}
    >
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
