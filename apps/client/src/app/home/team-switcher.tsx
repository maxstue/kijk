import { Avatar, AvatarFallback, AvatarImage } from '@kijk/ui/components/avatar';
import { Button } from '@kijk/ui/components/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@kijk/ui/components/command';
import { Dialog, DialogTrigger } from '@kijk/ui/components/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@kijk/ui/components/popover';
import { cn } from 'cn';
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { useState } from 'react';

import { CreateTeamDialog } from './create-team-dialog';

const groups = [
  {
    label: 'Personal Account',
    teams: [
      {
        label: 'Alicia Koch',
        value: 'personal',
      },
    ],
  },
  {
    label: 'Teams',
    teams: [
      {
        label: 'Acme Inc.',
        value: 'acme-inc',
      },
      {
        label: 'Monsters Inc.',
        value: 'monsters',
      },
    ],
  },
];

type Team = (typeof groups)[number]['teams'][number];

interface TeamSwitcherProps extends React.ComponentPropsWithoutRef<typeof PopoverTrigger> {}

/** Team selection popover (static demo data). */
export function TeamSwitcher({ className }: TeamSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [showNewTeamDialog, setShowNewTeamDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team>(groups[0].teams[0]);

  return (
    <Dialog open={showNewTeamDialog} onOpenChange={setShowNewTeamDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              aria-expanded={open}
              aria-label='Select a team'
              className={cn('w-[200px] justify-between', className)}
              role='combobox'
              aria-controls='team-switcher-popover'
              size='sm'
              variant='ghost'
            />
          }
        >
          <Avatar className='mr-2 h-5 w-5'>
            <AvatarImage alt={selectedTeam.label} src={`https://avatar.vercel.sh/${selectedTeam.value}.png`} />
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
          {selectedTeam.label}
          <ChevronsUpDown className='ml-auto h-4 w-4 shrink-0 opacity-50' />
        </PopoverTrigger>
        <PopoverContent className='w-[200px] p-0'>
          <Command>
            <CommandList>
              <CommandInput placeholder='Search team...' />
              <CommandEmpty>No team found.</CommandEmpty>
              {groups.map((group) => (
                <CommandGroup key={group.label} heading={group.label}>
                  {group.teams.map((team) => (
                    <CommandItem
                      key={team.value}
                      className='text-sm'
                      onSelect={() => {
                        setSelectedTeam(team);
                        setOpen(false);
                      }}
                    >
                      <Avatar className='mr-2 h-5 w-5'>
                        <AvatarImage alt={team.label} src={`https://avatar.vercel.sh/${team.value}.png`} />
                        <AvatarFallback>SC</AvatarFallback>
                      </Avatar>
                      {team.label}
                      <Check
                        className={cn(
                          'ml-auto h-4 w-4',
                          selectedTeam.value === team.value ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <DialogTrigger>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      setShowNewTeamDialog(true);
                    }}
                  >
                    <PlusCircle className='mr-2 h-5 w-5' />
                    Create Team
                  </CommandItem>
                </DialogTrigger>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <CreateTeamDialog onClose={() => setShowNewTeamDialog(false)} />
    </Dialog>
  );
}
