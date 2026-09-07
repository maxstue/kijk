import { http, HttpResponse } from 'msw';

export const handlers = [http.get('http://localhost:5000/api/consumption-limits', () => HttpResponse.json([]))];
