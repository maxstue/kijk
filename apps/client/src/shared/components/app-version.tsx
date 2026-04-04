import { config } from "@/shared/config";
import { cn } from "@kijk/ui/utils/style";

interface Props {
  className?: string;
}

/**
 * A component that displays the current version of the app. The version is retrieved from the {@link config}.
 * @param props The {@link Props} for the component
 */
export function AppVersion({ className }: Props) {
  return <span className={cn("text-2xs", className)}>v{config.Version}</span>;
}
