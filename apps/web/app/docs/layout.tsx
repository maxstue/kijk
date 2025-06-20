import { modes } from '@/utils/mode';
import { RootToggle } from 'fumadocs-ui/components/layout/root-toggle';
import { DocsLayout, DocsLayoutProps } from 'fumadocs-ui/layout';

import { baseOptions } from '@/app/layout.config';
import { sourceUtils } from '@/app/source';
import type { ReactNode } from 'react';

// docs layout configuration
const docsOptions: DocsLayoutProps = {
  ...baseOptions,
  tree: sourceUtils.pageTree,
  nav: {
    ...baseOptions.nav,
    transparentMode: 'none',
    children: undefined,
  },
  sidebar: {
    defaultOpenLevel: 0,
    banner: (
      <RootToggle
        options={modes.map((mode) => ({
          url: `/docs/${mode.param}`,
          icon: (
            <mode.icon
              className='size-9 shrink-0 rounded-md bg-gradient-to-t from-background/80 p-1.5'
              style={{
                backgroundColor: `hsl(var(--${mode.param}-color)/.3)`,
                color: `hsl(var(--${mode.param}-color))`,
              }}
            />
          ),
          title: mode.name,
          description: mode.description,
        }))}
      />
    ),
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <DocsLayout {...docsOptions}>{children}</DocsLayout>;
}
