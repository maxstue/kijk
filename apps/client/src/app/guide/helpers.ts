import { getAvailableGuideTopics } from './constants';
import type { GuideProgress, GuideTask, TourCapabilities } from './types';

/** All rows are subtours of the same guide version, in the same order as the full tour. */
export function getGuideTasks(progress: GuideProgress, capabilities: TourCapabilities): GuideTask[] {
  const done = new Set(
    Number(progress.guideCompletedVersion) === Number(progress.guideVersion) ? progress.guideCompletedSteps : [],
  );
  return getAvailableGuideTopics(capabilities).map(({ id, label, description }) => ({
    id,
    label,
    description,
    done: done.has(id),
  }));
}
