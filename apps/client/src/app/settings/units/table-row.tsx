import type { Unit } from '@kijk/api/units/types';
import { Badge } from '@kijk/ui/components/badge';
import { TableCell, TableRow } from '@kijk/ui/components/table';

import { UnitRowActions } from './row-actions';

interface UnitTableRowProps {
  unit: Unit;
  spaceId?: string;
  scope: 'space' | 'personal';
  shareableSpaces: Array<{ id: string; name: string }>;
}
export function UnitTableRow({ unit, spaceId, scope, shareableSpaces }: UnitTableRowProps) {
  return (
    <TableRow>
      <TableCell>
        <span className='font-medium'>
          {unit.name} ({unit.symbol})
        </span>
        {unit.conversionType === 'None' && (
          <p className='text-muted-foreground text-xs'>
            {unit.isOwner
              ? 'Legacy unit · define its conversion before using it again'
              : 'Legacy system unit · read-only'}
          </p>
        )}
      </TableCell>
      <TableCell>{unit.conversionType === 'None' ? 'Unknown' : unit.quantityKey}</TableCell>
      <TableCell>
        <Badge variant={unit.creatorType === 'System' ? 'secondary' : 'outline'}>
          {unit.creatorType === 'System' ? 'System' : 'Custom'}
        </Badge>
      </TableCell>
      <TableCell>{unit.isArchived ? 'Archived' : 'Active'}</TableCell>
      <TableCell>
        <UnitRowActions spaceId={spaceId} shareableSpaces={shareableSpaces} scope={scope} unit={unit} />
      </TableCell>
    </TableRow>
  );
}
