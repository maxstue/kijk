import type { Consumption } from '@/shared/types/domain';

import { AnnualSummaryTable } from './annual-summary-table';
import { createAnnualResourceSummaries } from './helpers';
import { allResourceTypes, ConsumptionTypeFilter } from './type-filter';

export interface AnnualViewState {
  resourceId?: string;
  expanded?: string[];
}

interface Props {
  state: AnnualViewState;
  onStateChange: (state: AnnualViewState) => void;
  consumptions: Consumption[];
}

/** Year view: one expandable row per resource with its yearly total and entries, filterable by resource. */
export function ConsumptionAnnualView({ consumptions, state, onStateChange }: Props) {
  const resourceId = state.resourceId ?? allResourceTypes;
  const summaries = createAnnualResourceSummaries(consumptions);
  const resources = summaries.map((summary) => summary.resource);
  const filteredSummaries =
    resourceId === allResourceTypes ? summaries : summaries.filter((summary) => summary.resource.id === resourceId);

  return (
    <div className='space-y-4'>
      <ConsumptionTypeFilter
        resources={resources}
        value={resourceId}
        onSelect={(resourceId) =>
          onStateChange({ ...state, resourceId: resourceId === allResourceTypes ? undefined : resourceId })
        }
      />
      <AnnualSummaryTable
        summaries={filteredSummaries}
        expanded={state.expanded ?? []}
        onExpandedChange={(expanded) => onStateChange({ ...state, expanded })}
      />
    </div>
  );
}
