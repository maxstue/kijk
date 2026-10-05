import { Card, CardContent } from '@kijk/ui/components/card';
import { Separator } from '@kijk/ui/components/separator';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';

import { spaceMembersQueryOptions, spaceRolesQueryOptions } from '@/shared/api/spaces/options';
import { SpacePermissions, hasSpacePermission, spacePermissionLabels } from '@/shared/api/spaces/permissions';
import type { SpacePermission } from '@/shared/api/spaces/permissions';

import { SpaceBackLink } from './back-link';
import { useSpaceSettings } from './context';
import { MemberRoleSelect } from './member-role-select';

/** Members page: member list with roles, the user's own permissions and the role overview. */
export function SpaceMembers() {
  const { space } = useSpaceSettings();
  const { data: members } = useSuspenseQuery(spaceMembersQueryOptions(space.id));
  const { data: roles } = useSuspenseQuery(spaceRolesQueryOptions());
  const canAssignRoles = hasSpacePermission(space, SpacePermissions.members.assignRole);

  return (
    <div className='mx-auto w-full max-w-4xl space-y-6'>
      <SpaceBackLink />
      <div>
        <h2 className='text-lg font-medium'>Members</h2>
        <p className='text-muted-foreground text-sm'>People in {space.name} and their roles.</p>
      </div>
      <Separator />

      <Card className='gap-0 py-0'>
        {members.map((member) => (
          <CardContent
            key={member.userId}
            className='flex flex-wrap items-center justify-between gap-4 border-b py-4 last:border-b-0'
          >
            <div className='font-medium'>
              {member.name}
              {member.isCurrentUser && <span className='text-muted-foreground font-normal'> (you)</span>}
            </div>
            {canAssignRoles && !member.isCurrentUser ? (
              <MemberRoleSelect spaceId={space.id} member={member} roles={roles} />
            ) : (
              <span className='bg-muted rounded-md px-2.5 py-1 text-sm'>{member.role.name}</span>
            )}
          </CardContent>
        ))}
      </Card>
      {canAssignRoles && (
        <p className='text-muted-foreground text-sm'>
          You can change the roles of other members. Your own role stays as it is.
        </p>
      )}

      <section className='space-y-3'>
        <div>
          <h3 className='font-medium'>Your role: {space.role.name}</h3>
          <p className='text-muted-foreground text-sm'>What your role allows in this space.</p>
        </div>
        <PermissionList permissions={space.role.permissions} />
      </section>

      <section className='space-y-3'>
        <div>
          <h3 className='font-medium'>Roles</h3>
          <p className='text-muted-foreground text-sm'>Every space uses the same roles.</p>
        </div>
        <div className='grid gap-4 md:grid-cols-3'>
          {roles.map((role) => (
            <Card key={role.id}>
              <CardContent className='space-y-3'>
                <div className='font-medium'>{role.name}</div>
                <PermissionList permissions={role.permissions} />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function PermissionList({ permissions }: { permissions: readonly string[] }) {
  return (
    <ul className='space-y-1.5 text-sm'>
      {permissions.map((permission) => (
        <li key={permission} className='flex items-start gap-2'>
          <Check aria-hidden className='text-muted-foreground mt-0.5 size-4 shrink-0' />
          <span>{spacePermissionLabels[permission as SpacePermission] ?? permission}</span>
        </li>
      ))}
    </ul>
  );
}
