'use client';

import * as React from 'react';
import { Direction } from 'radix-ui';

/** Sets the reading direction (ltr/rtl) for the nested components. */
function DirectionProvider({
  dir,
  direction,
  children,
}: React.ComponentProps<typeof Direction.DirectionProvider> & {
  direction?: React.ComponentProps<typeof Direction.DirectionProvider>['dir'];
}) {
  return <Direction.DirectionProvider dir={direction ?? dir}>{children}</Direction.DirectionProvider>;
}

/** Returns the reading direction from the nearest `DirectionProvider`. */
const useDirection = Direction.useDirection;

export { DirectionProvider, useDirection };
