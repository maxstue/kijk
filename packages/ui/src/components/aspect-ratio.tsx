'use client';

import { AspectRatio as AspectRatioPrimitive } from 'radix-ui';

/** Keeps its content at the given `ratio`. */
function AspectRatio({ ...props }: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-slot='aspect-ratio' {...props} />;
}

export { AspectRatio };
