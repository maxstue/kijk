import { Button } from '@kijk/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@kijk/ui/components/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@kijk/ui/components/tabs';
import { getRouteApi } from '@tanstack/react-router';
import { ChevronDown } from 'lucide-react';
const Route = getRouteApi('/_authenticated/_app/$spaceId/finances/transactions');

export function TransactionViewTabs() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <>
      <Tabs
        className='hidden @min-[32rem]/toolbar:flex'
        value={search.uncategorized ? 'uncategorized' : 'all'}
        onValueChange={(value) =>
          navigate({
            search: (previous) => ({
              ...previous,
              page: undefined,
              uncategorized: value === 'uncategorized' || undefined,
            }),
          })
        }
      >
        <TabsList>
          <TabsTrigger value='all'>All</TabsTrigger>
          <TabsTrigger value='uncategorized'>Uncategorized</TabsTrigger>
        </TabsList>
      </Tabs>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button aria-label='Transaction view' variant='outline' className='@min-[32rem]/toolbar:hidden' />}
        >
          {search.uncategorized ? 'Uncategorized' : 'All'} <ChevronDown />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start'>
          <DropdownMenuRadioGroup
            value={search.uncategorized ? 'uncategorized' : 'all'}
            onValueChange={(value) =>
              navigate({
                search: (previous) => ({
                  ...previous,
                  page: undefined,
                  uncategorized: value === 'uncategorized' || undefined,
                }),
              })
            }
          >
            <DropdownMenuRadioItem value='all'>All transactions</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value='uncategorized'>Uncategorized</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
