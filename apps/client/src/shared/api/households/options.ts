import { mutationOptions } from '@tanstack/react-query';

import { deleteHousehold, updateHousehold } from './requests';
import type { UpdateHouseholdData } from './types';

export const updateHouseholdMutationOptions = () =>
  mutationOptions({
    mutationFn: ({ data, id }: { data: UpdateHouseholdData; id: string }) => updateHousehold(id, data),
  });

export const deleteHouseholdMutationOptions = () =>
  mutationOptions({ mutationFn: (id: string) => deleteHousehold(id) });
