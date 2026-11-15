import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@kijk/ui/components/input-group';
import { useDebouncer } from '@tanstack/react-pacer/debouncer';
import { cn } from 'cn';
import { SearchIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ComponentProps } from 'react';

/** Pause after the last keystroke before a search applies; Enter and the search button apply it right away. */
export const searchDebounceMs = 500;

interface Props extends Pick<ComponentProps<'input'>, 'aria-label' | 'placeholder'> {
  className?: string;
  /** Receives the trimmed search text once typing pauses, on Enter or on the search button. */
  onSearch: (search: string) => void;
  /** The applied search, e.g. from the URL; the field shows it when it changes from outside, such as on a reset. */
  value?: string;
}

/**
 * Search field of server-side lists: applies its text debounced while typing and immediately on Enter or with the
 * search button, which also cancels the pending debounced search.
 */
export function SearchInput({ className, onSearch, value: appliedValue, ...props }: Props) {
  const [value, setValue] = useState(appliedValue ?? '');
  const submitted = useRef(appliedValue ?? '');
  const apply = (search: string) => {
    if (search !== submitted.current) {
      submitted.current = search;
      onSearch(search);
    }
  };
  const { cancel, maybeExecute } = useDebouncer(apply, { wait: searchDebounceMs });

  // URL acknowledgements keep newer typing. Back/Forward and resets replace the draft and abandon pending work.
  useEffect(() => {
    if (appliedValue !== undefined && appliedValue !== submitted.current) {
      cancel();
      submitted.current = appliedValue;
      setValue(appliedValue);
    }
  }, [appliedValue, cancel]);

  return (
    <form
      role='search'
      className={cn('w-full sm:w-72', className)}
      onSubmit={(event) => {
        event.preventDefault();
        cancel();
        apply(value.trim());
      }}
    >
      <InputGroup>
        <InputGroupInput
          type='search'
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            maybeExecute(event.target.value.trim());
          }}
          {...props}
        />
        <InputGroupAddon align='inline-end' className='has-[>button]:mr-0'>
          <InputGroupButton aria-label='Search' size='icon-xs' title='Search' type='submit'>
            <SearchIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
