import * as spacesOptions from '@kijk/api/spaces/options';
import type { SpacePermission } from '@kijk/api/spaces/permissions';
import { SpacePermissions, hasSpacePermission, spacePermissionLabels } from '@kijk/api/spaces/permissions';
import { Card, CardContent } from '@kijk/ui/components/card';
import { Dialog } from '@kijk/ui/components/dialog';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { useState } from 'react';

import {
  PageAddButton,
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from '@/shared/components/page-header';

import { SpaceBackLink } from './back-link';
import { useSpaceSettings } from './context';
import { PendingInvitations } from './invitations';
import { InviteDialog } from './invite-dialog';
import { MemberRoleSelect } from './member-role-select';

/**
 * Members page: member list with roles, invitations for admins of shared spaces, the user's own permissions and the
 * role overview.
 */
export function SpaceMembers() {
  const { space } = useSpaceSettings();
  const { data: members } = useSuspenseQuery(spacesOptions.membersQueryOptions(space.id));
  const { data: roles } = useSuspenseQuery(spacesOptions.rolesQueryOptions());
  const canAssignRoles = hasSpacePermission(space, SpacePermissions.members.assignRole);
  // Personal spaces are never shared.
  const canInvite = !space.isPersonal && hasSpacePermission(space, SpacePermissions.members.invite);
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div className='mx-auto w-full max-w-4xl space-y-6'>
      <SpaceBackLink />
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Members</PageHeaderTitle>
          <PageHeaderDescription>{<> People in {space.name} and their roles. </>}</PageHeaderDescription>
        </PageHeaderContent>
        {canInvite && (
          <PageHeaderActions>
            <PageAddButton onClick={() => setShowInvite(true)}>Invite</PageAddButton>
          </PageHeaderActions>
        )}
      </PageHeader>

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

      {canInvite && (
        <>
          <PendingInvitations spaceId={space.id} />
          <Dialog open={showInvite} onOpenChange={setShowInvite}>
            <InviteDialog
              roles={roles}
              spaceId={space.id}
              spaceName={space.name}
              onClose={() => setShowInvite(false)}
            />
          </Dialog>
        </>
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

interface PermissionListProps {
  permissions: readonly string[];
}

function PermissionList({ permissions }: PermissionListProps) {
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
