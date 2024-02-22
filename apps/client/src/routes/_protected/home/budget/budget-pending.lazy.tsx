import { AsyncLoader } from '@/shared/components/ui/loaders/async-loader';

export const pendingComponent = function BudgetPendingComponent() {
  return <AsyncLoader className='h-6 w-6' />;
};
