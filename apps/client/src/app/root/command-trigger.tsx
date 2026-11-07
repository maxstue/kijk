import { Button } from '@kijk/ui/components/button';
import { cn } from 'cn';

interface CommandTriggerProps {
  isCollapsed?: boolean;
  onOpen: () => void;
}
export function CommandTrigger({ isCollapsed, onOpen }: CommandTriggerProps) {
  return (
    <Button
      variant='outline'
      className={cn(
        'group text-muted-foreground relative h-9 w-full justify-start text-sm',
        isCollapsed ? 'p-1' : 'sm:pr-12',
      )}
      onClick={onOpen}
    >
      {isCollapsed ? undefined : <span className='inline-flex'>Search...</span>}

      <kbd
        className={cn(
          'pointer-events-none absolute top-2 hidden h-5 items-center gap-1 rounded-sm px-1.5 font-mono text-[10px] font-medium opacity-100 select-none sm:flex',
          isCollapsed ? 'right-0' : 'bg-muted group-hover:bg-background right-1.5',
        )}
      >
        <span className='text-xs'>⌘</span>K
      </kbd>
    </Button>
  );
}
