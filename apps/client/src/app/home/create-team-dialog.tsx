import { Button } from '@kijk/ui/components/button';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@kijk/ui/components/dialog';
import { Input } from '@kijk/ui/components/input';
import { Label } from '@kijk/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kijk/ui/components/select';

interface CreateTeamDialogProps {
  onClose: () => void;
}
export function CreateTeamDialog({ onClose }: CreateTeamDialogProps) {
  return (
    <DialogContent title='Create team'>
      <DialogHeader>
        <DialogTitle>Create team</DialogTitle>
        <DialogDescription>Add a new team to manage products and customers.</DialogDescription>
      </DialogHeader>
      <div>
        <div className='space-y-4 py-2 pb-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Team name</Label>
            <Input id='name' placeholder='Acme Inc.' />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='plan'>Subscription plan</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder='Select a plan' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='free'>
                  <span className='font-medium'>Free</span> -{' '}
                  <span className='text-muted-foreground'>Trial for two weeks</span>
                </SelectItem>
                <SelectItem value='pro'>
                  <span className='font-medium'>Pro</span> -{' '}
                  <span className='text-muted-foreground'>$9/month per user</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button
          variant='outline'
          onClick={() => {
            onClose();
          }}
        >
          Cancel
        </Button>
        <Button type='submit'>Continue</Button>
      </DialogFooter>
    </DialogContent>
  );
}
