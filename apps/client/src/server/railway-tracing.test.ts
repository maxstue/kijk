import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';

import { expect, test } from 'vite-plus/test';

test('Node preload exports joined HTTP and fetch spans without private URL data', async () => {
  const exports: Buffer[] = [];
  const collector = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    request.on('end', () => {
      exports.push(Buffer.concat(chunks));
      response.end();
    });
  });
  collector.listen(0, '127.0.0.1');
  await once(collector, 'listening');
  const address = collector.address();
  if (!address || typeof address === 'string') {
    throw new Error('Missing collector port');
  }

  const child = spawn(
    process.execPath,
    [
      '--experimental-loader=@opentelemetry/instrumentation/hook.mjs',
      '--import',
      './instrumentation.mjs',
      '--input-type=module',
      '-e',
      `import { createServer } from 'node:http';
       const server = createServer(async (request, response) => {
         if (request.url.startsWith('/outbound')) return response.end('ok');
         await fetch('http://127.0.0.1:' + server.address().port + '/outbound?token=private-token');
         response.end('ok');
       });
       server.listen(0, '127.0.0.1', () => console.log(server.address().port));
       process.once('SIGTERM', () => server.close());`,
    ],
    {
      cwd: new URL('../..', import.meta.url),
      env: {
        ...process.env,
        OTEL_SERVICE_NAME: 'railway-client-test',
        OTEL_SERVICE_VERSION: 'test-release',
        OTEL_EXPORTER_OTLP_ENDPOINT: `http://127.0.0.1:${address.port}`,
        OTEL_EXPORTER_OTLP_PROTOCOL: 'http/protobuf',
        OTEL_METRICS_EXPORTER: 'none',
        OTEL_LOGS_EXPORTER: 'none',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  const exited = once(child, 'exit');
  let errors = '';
  child.stderr.on('data', (chunk) => (errors += String(chunk)));
  try {
    const port = await new Promise<number>((resolve, reject) => {
      child.once('error', reject);
      child.stdout.once('data', (chunk) => resolve(Number(String(chunk).trim())));
      child.once('exit', () => reject(new Error(errors)));
    });
    const response = await fetch(`http://127.0.0.1:${port}/private-account?token=private-token`, {
      headers: { traceparent: '00-12345678901234567890123456789012-1234567890123456-01' },
    });
    expect(await response.text()).toBe('ok');
    child.kill('SIGTERM');
    const [code] = await exited;
    expect({
      code,
      errors: errors.replace(/.*ExperimentalWarning.*\n|.*register\(\).*\n|--import.*\n|.*trace-warnings.*\n/g, ''),
    }).toEqual({ code: 0, errors: '' });
    const payload = Buffer.concat(exports);
    expect(payload.toString()).toContain('railway-client-test');
    expect(payload.toString()).toContain('test-release');
    expect(payload.toString()).toContain('@opentelemetry/instrumentation-http');
    expect(payload.toString()).toContain('@opentelemetry/instrumentation-undici');
    expect(payload.toString()).not.toContain('private-token');
    expect(payload.toString()).not.toContain('private-account');
    const traceId = Buffer.from('12345678901234567890123456789012', 'hex');
    let joinedSpans = 0;
    for (
      let offset = payload.indexOf(traceId);
      offset !== -1;
      offset = payload.indexOf(traceId, offset + traceId.length)
    ) {
      joinedSpans++;
    }
    expect(joinedSpans).toBeGreaterThanOrEqual(3);
  } finally {
    if (child.exitCode === null) {
      child.kill('SIGKILL');
    }
    collector.closeAllConnections();
    collector.close();
  }
}, 15_000);
