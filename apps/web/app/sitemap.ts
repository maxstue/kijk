import { baseUrl } from '@/utils/metadata';

import { sourceUtils } from '@/app/source';
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string): string => new URL(path, baseUrl).toString();

  return [
    {
      url: url('/'),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: url('/docs'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    ...sourceUtils.getPages().map<MetadataRoute.Sitemap[number]>((page) => ({
      url: url(page.url),
      lastModified: page.data.exports.lastModified ? new Date(page.data.exports.lastModified) : undefined,
      changeFrequency: 'weekly',
      priority: 0.5,
    })),
  ];
}
