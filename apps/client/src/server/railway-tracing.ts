import { definePlugin } from 'nitro';

export default definePlugin((app) => {
  app.hooks.hook('close', async () => {
    const shutdown = Reflect.get(globalThis, Symbol.for('kijk.railwayTracing.shutdown')) as
      | (() => Promise<void>)
      | undefined;
    await shutdown?.();
  });
});
