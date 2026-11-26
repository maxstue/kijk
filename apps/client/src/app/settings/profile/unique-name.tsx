import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@kijk/ui/components/input-group';
import { Label } from '@kijk/ui/components/label';
import { CopyIcon } from 'lucide-react';
import { useId } from 'react';
import { toast } from 'sonner';

import { uniqueNameHint } from '@/shared/lib/user-name';

interface Props {
  /** The unique name, for example `Max#4821`. */
  uniqueName: string;
}

/** Shows the unique name with which others invite the user, and copies it. */
export function UniqueName({ uniqueName }: Props) {
  const id = useId();

  async function copy() {
    try {
      await navigator.clipboard.writeText(uniqueName);
      toast.success('Unique name copied');
    } catch {
      toast.error('The unique name could not be copied.');
    }
  }

  return (
    <div className='space-y-2'>
      <Label htmlFor={id}>Unique name</Label>
      <InputGroup>
        <InputGroupInput id={id} readOnly value={uniqueName} aria-describedby={`${id}-hint`} />
        <InputGroupAddon align='inline-end' className='has-[>button]:mr-0'>
          <InputGroupButton aria-label='Copy unique name' size='icon-xs' title='Copy' type='button' onClick={copy}>
            <CopyIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <p id={`${id}-hint`} className='text-muted-foreground text-sm'>
        {uniqueNameHint}
      </p>
    </div>
  );
}
