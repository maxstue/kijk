import { Card } from '@kijk/ui/components/card';
import { Link } from '@tanstack/react-router';
import { ChevronRight, Ruler, Settings2, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { useHouseholdSettings } from './context';

const sections = [
  {
    description: 'Name, description, and household details',
    icon: Settings2,
    label: 'General',
    section: 'general',
  },
  {
    description: 'Members, roles, and what each role allows',
    icon: Users,
    label: 'Members',
    section: 'members',
  },
  {
    description: 'Units available to this household',
    icon: Ruler,
    label: 'Units',
    section: 'units',
  },
] as const satisfies ReadonlyArray<{ description: string; icon: LucideIcon; label: string; section: string }>;

export function HouseholdOverview() {
  const { household } = useHouseholdSettings();

  return (
    <div className='mx-auto w-full max-w-4xl space-y-8'>
      <div className='space-y-1'>
        <h2 className='text-2xl font-semibold tracking-tight'>{household.name}</h2>
        <p className='text-muted-foreground'>{household.description || 'Settings for this household.'}</p>
      </div>

      <Card className='gap-0 overflow-hidden py-0'>
        {sections.map(({ description, icon: Icon, label, section }) => (
          <Link
            key={section}
            className='hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-ring flex min-w-0 items-center gap-4 border-b px-5 py-5 outline-none last:border-b-0 focus-visible:ring-2 focus-visible:ring-inset'
            params={{ householdId: household.id }}
            to={`/settings/households/$householdId/${section}`}
          >
            <span className='bg-muted text-muted-foreground flex size-11 shrink-0 items-center justify-center rounded-lg'>
              <Icon className='size-5' />
            </span>
            <span className='min-w-0 flex-1'>
              <span className='block font-medium'>{label}</span>
              <span className='text-muted-foreground block text-sm'>{description}</span>
            </span>
            <ChevronRight className='text-muted-foreground size-4 shrink-0' />
          </Link>
        ))}
      </Card>
    </div>
  );
}
