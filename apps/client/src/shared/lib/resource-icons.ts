import { iconNames } from 'lucide-react/dynamic';

export type ResourceIconName = (typeof iconNames)[number];

export const defaultResourceIcon: ResourceIconName = 'circle';

export const resourceIconNames: readonly ResourceIconName[] = iconNames;

const resourceIconNameSet = new Set<string>(iconNames);

export function isResourceIconName(value: string): value is ResourceIconName {
  return resourceIconNameSet.has(value);
}

export function formatResourceIconName(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
