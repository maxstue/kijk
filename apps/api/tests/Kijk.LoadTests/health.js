import { check, sleep } from 'k6';
import http from 'k6/http';

const baseUrl = (__ENV.LOAD_TEST_BASE_URL || 'http://localhost:5140').replace(/\/$/, '');
const virtualUsers = Number(__ENV.LOAD_TEST_VUS || 10);
const duration = __ENV.LOAD_TEST_DURATION || '30s';
const maximumP95Duration = Number(__ENV.LOAD_TEST_P95_MS || 500);

if (!/^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/.*)?$/i.test(baseUrl)) {
  throw new Error('LOAD_TEST_BASE_URL must point to a locally running API.');
}

export const options = {
  scenarios: {
    health: {
      duration,
      executor: 'constant-vus',
      gracefulStop: '5s',
      vus: virtualUsers,
    },
  },
  thresholds: {
    checks: ['rate>0.99'],
    http_req_duration: [`p(95)<${maximumP95Duration}`],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const response = http.get(`${baseUrl}/health`, {
    tags: { endpoint: 'GET /health' },
    timeout: '5s',
  });

  check(response, {
    'health endpoint returns 200': (result) => result.status === 200,
    'health endpoint returns JSON': (result) => result.headers['Content-Type']?.includes('application/json') === true,
  });

  sleep(1);
}
