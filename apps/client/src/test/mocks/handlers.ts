import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('http://localhost:5000/api/spaces/space/limits', () =>
    HttpResponse.json({ items: [], totalCount: 0, page: 1, pageSize: 10 }),
  ),
];
