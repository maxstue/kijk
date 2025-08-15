import { createSearchAPI } from 'fumadocs-core/search/server';

import { sourceUtils } from '@/app/source';

export const { GET } = createSearchAPI('advanced', {
  indexes: sourceUtils.getPages().map((page) => ({
    title: page.data.title,
    structuredData: page.data.exports.structuredData,
    id: page.url,
    url: page.url,
  })),
});
