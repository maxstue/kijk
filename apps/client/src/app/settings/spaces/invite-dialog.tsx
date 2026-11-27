import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@kijk/api/errors';
import * as spacesOptions from '@kijk/api/spaces/options';
import { SpaceRoleIds, invitableRoleIds } from '@kijk/api/spaces/permissions';
import type { SpaceRole } from '@kijk/api/spaces/types';
import { Button } from '@kijk/ui/components/button';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@kijk/ui/components/dialog';
import { SpinnerIcon } from '@kijk/ui/components/icons';
import { Input } from '@kijk/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/form';

import { type InviteFormValues, inviteSchema, isEmailInvitee } from './schemas';

interface Props {
  spaceId: string;
  spaceName: string;
  roles: SpaceRole[];
  onClose: () => void;
}

/**
 * Dialog that invites one person into a shared space by unique name or e-mail address. Invitations by e-mail always
 * report success, so the dialog never reveals whether an address belongs to a Kijk account.
 */
export function InviteDialog({ spaceId, spaceName, roles, onClose }: Props) {
  const { mutate, isPending } = useMutation(spacesOptions.createInvitationMutationOptions());
  const form = useForm<InviteFormValues>({
    defaultValues: { invitee: '', roleId: SpaceRoleIds.member },
    resolver: zodResolver(inviteSchema),
  });
  const invitableRoles = roles.filter((role) => invitableRoleIds.has(role.id));

  function onSubmit({ invitee, roleId }: InviteFormValues) {
    const byEmail = isEmailInvitee(invitee);
    mutate(
      {
        spaceId,
        data: { email: byEmail ? invitee : null, roleId, uniqueName: byEmail ? null : invitee },
      },
      {
        onError: (error) => {
          // Only invitations by name report a missing person or a conflict; e-mail invitations never do.
          if (ApiError.isApiError(error) && [400, 404, 409].includes(error.status)) {
            form.setError('invitee', { message: error.status === 400 ? error.getErrorsString() : error.message });
            return;
          }
          toast.error(error.message);
        },
        onSuccess: (invitation) => {
          onClose();
          toast.success(`Invitation sent to ${invitation.inviteeLabel}`);
        },
      },
    );
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Invite to {spaceName}</DialogTitle>
        <DialogDescription>
          Members see the shared data of this space, including its history, but never the private data of others. Only
          invite people who expect it.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form className='space-y-6' noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name='invitee'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unique name or e-mail address</FormLabel>
                <FormControl>
                  <Input
                    autoComplete='off'
                    disabled={isPending}
                    maxLength={254}
                    placeholder='Anna#4821 or anna@example.com'
                    spellCheck={false}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  People find the invitation in their inbox in Kijk. People without an account receive an e-mail from
                  Kijk and must sign up with exactly this address.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='roleId'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select
                  disabled={isPending}
                  items={invitableRoles.map((role) => ({ label: role.name, value: role.id }))}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className='w-full sm:w-48'>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {invitableRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>You can make someone an admin later by changing their role.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button disabled={isPending} type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={isPending} type='submit'>
              {isPending ? <SpinnerIcon className='size-5 animate-spin' /> : 'Send invitation'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
