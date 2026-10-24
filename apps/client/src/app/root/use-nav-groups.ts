import { mainNavGroups } from '@/app/root/constants';
import { useFeature } from '@/shared/hooks/use-feature';

/** The groups of the main navigation without the areas that a feature flag switches off. */
export function useNavGroups() {
  const finances = useFeature('finances');
  return mainNavGroups.filter((group) => finances || group.label !== 'Finances');
}
