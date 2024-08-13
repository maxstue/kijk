import { notFound } from 'next/navigation';
import { siteConfig } from '@/constants/config';
import { cn } from '@/utils/cn';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { DocsBody, DocsPage } from 'fumadocs-ui/page';
import { Edit } from 'lucide-react';

import { sourceUtils } from '@/app/source';
import { buttonVariants } from '@/components/ui/button';
import type { Page } from '@/app/source';
import type { Metadata } from 'next';

export default function Page({ params }: { params: { slug?: string[] } }) {
  const page = sourceUtils.getPage(params.slug);

  if (page == null) {
    notFound();
  }

  const MDX = page.data.exports.default;

  const path = `apps/web/content/docs/${page.file.path}`;

  const footer = (
    <a
      href={`https://github.com/maxstze/kijk/blob/main/${path}`}
      target='_blank'
      rel='noreferrer noopener'
      className={cn(
        buttonVariants({
          variant: 'secondary',
          size: 'sm',
          className: 'gap-1.5 text-xs',
        }),
      )}
    >
      <Edit className='size-3' />
      Edit on Github
    </a>
  );
  return (
    <DocsPage
      toc={page.data.exports.toc}
      full={page.data.full}
      lastUpdate={page.data.exports.lastModified}
      tableOfContent={{
        footer,
      }}
      tableOfContentPopover={{ footer }}
    >
      <DocsBody>
        <h1 className='text-3xl font-bold text-foreground sm:text-4xl'>{page.data.title}</h1>
        <p className='mb-8 text-lg text-muted-foreground'>{page.data.description}</p>
        <MDX />
        {page.data.index ? <Category page={page} /> : null}
      </DocsBody>
    </DocsPage>
  );
}

function Category({ page }: { page: Page }): React.ReactElement {
  const filtered = sourceUtils
    .getPages()
    .filter((item) => item.file.dirname === page.file.dirname && item.file.name !== 'index');

  return (
    <Cards>
      {filtered.map((item) => (
        <Card
          key={item.url}
          title={item.data.title}
          description={item.data.description ?? 'No Description'}
          href={item.url}
        />
      ))}
    </Cards>
  );
}

export function generateStaticParams() {
  return sourceUtils.getPages().map((page) => ({
    slug: page.slugs,
  }));
}

export function generateMetadata({ params }: { params: { slug?: string[] } }) {
  const page = sourceUtils.getPage(params.slug);

  if (page == null) notFound();

  const title = page.data.title ?? siteConfig.name;
  const description = page.data.description ?? siteConfig.description;

  return {
    title,
    description,
  } satisfies Metadata;
}
