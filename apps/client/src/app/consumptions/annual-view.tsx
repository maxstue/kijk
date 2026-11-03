import { useState } from 'react';

import type { Consumption } from '@/shared/types/domain';

import { AnnualSummaryTable } from './annual-summary-table';
import { createAnnualResourceSummaries } from './helpers';
import { allResourceTypes, ConsumptionTypeFilter } from './type-filter';

interface AnnualViewProps {
  consumptions: Consumption[];
}

/** Year view: one expandable row per resource with its yearly total and entries, filterable by resource. */
export function ConsumptionAnnualView({ consumptions }: AnnualViewProps) {
  const [resourceId, setResourceId] = useState(allResourceTypes);
  const summaries = createAnnualResourceSummaries(consumptions);
  const resources = summaries.map((summary) => summary.resource);
  const filteredSummaries =
    resourceId === allResourceTypes ? summaries : summaries.filter((summary) => summary.resource.id === resourceId);

  return (
    <div className='space-y-4'>
      <ConsumptionTypeFilter resources={resources} value={resourceId} onSelect={setResourceId} />
      <AnnualSummaryTable summaries={filteredSummaries} />
    </div>
  );
}
