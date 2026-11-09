export const GUIDE_VERSION = 1;

export interface GuideTask {
  id: string;
  label: string;
  done: boolean;
  optional?: boolean;
}
