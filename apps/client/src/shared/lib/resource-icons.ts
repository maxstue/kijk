import { iconNames } from 'lucide-react/dynamic';

/** Name of a Lucide icon that can be used for resources. */
export type ResourceIconName = (typeof iconNames)[number];

/** Icon used when a resource has no valid icon. */
export const defaultResourceIcon: ResourceIconName = 'circle';

/** All selectable resource icon names. */
export const resourceIconNames: readonly ResourceIconName[] = iconNames;

const resourceIconNameSet = new Set<string>(iconNames);

/** Returns whether `value` is a known resource icon name. */
export function isResourceIconName(value: string): value is ResourceIconName {
  return resourceIconNameSet.has(value);
}

/** Turns an icon name like `arrow-down` into a label like `Arrow Down`. */
export function formatResourceIconName(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
