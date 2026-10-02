'use client';

import { Collapsible as CollapsiblePrimitive } from 'radix-ui';

/** Section whose content can be shown and hidden. */
function Collapsible({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot='collapsible' {...props} />;
}

/** Toggles the collapsible. */
function CollapsibleTrigger({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return <CollapsiblePrimitive.CollapsibleTrigger data-slot='collapsible-trigger' {...props} />;
}

/** Content shown when the collapsible is open. */
function CollapsibleContent({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return <CollapsiblePrimitive.CollapsibleContent data-slot='collapsible-content' {...props} />;
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
