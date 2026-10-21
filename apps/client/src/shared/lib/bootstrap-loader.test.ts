import { afterEach, beforeEach, expect, test, vi } from 'vite-plus/test';

// Stub the DOM boundary; fake timers drive the actual loader lifecycle.
let loader: {
  isConnected: boolean;
  classList: { contains: (value: string) => boolean; add: (value: string) => void; remove: (value: string) => void };
  remove: () => void;
};
let bootstrap: typeof import('./bootstrap-loader');

beforeEach(async () => {
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => setTimeout(() => callback(0), 16));
  vi.stubGlobal('cancelAnimationFrame', (id: ReturnType<typeof setTimeout>) => clearTimeout(id));
  vi.resetModules();
  bootstrap = await import('./bootstrap-loader');
  const classes = new Set<string>();
  loader = {
    isConnected: true,
    classList: {
      contains: (value) => classes.has(value),
      add: (value) => {
        classes.add(value);
      },
      remove: (value) => {
        classes.delete(value);
      },
    },
    remove: () => {
      loader.isConnected = false;
    },
  };
  vi.stubGlobal('document', { getElementById: () => (loader.isConnected ? loader : null) });
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test('keeps the static loader until React is ready, then fades before removing it', () => {
  expect(bootstrap.isBootstrapLoaderPresent()).toBe(true);
  vi.advanceTimersByTime(1000);
  expect(loader.isConnected).toBe(true);
  bootstrap.markReactReady();
  vi.advanceTimersByTime(16);
  expect(loader.classList.contains('bootstrapLoaderHidden')).toBe(true);
  expect(loader.isConnected).toBe(true);
  vi.advanceTimersByTime(180);
  expect(bootstrap.isBootstrapLoaderPresent()).toBe(false);
});

test('waits for every mounted loader to release its hold', () => {
  const releaseFirst = bootstrap.registerBootstrapLoader();
  const releaseSecond = bootstrap.registerBootstrapLoader();
  bootstrap.markReactReady();
  releaseFirst();
  vi.advanceTimersByTime(1000);
  expect(loader.classList.contains('bootstrapLoaderHidden')).toBe(false);
  expect(loader.isConnected).toBe(true);
  releaseSecond();
  vi.advanceTimersByTime(200);
  expect(loader.isConnected).toBe(false);
});

test('does not dismiss if a mounted loader finishes before React becomes ready', () => {
  bootstrap.registerBootstrapLoader()();
  vi.advanceTimersByTime(1000);
  expect(loader.isConnected).toBe(true);
  bootstrap.markReactReady();
  vi.advanceTimersByTime(200);
  expect(loader.isConnected).toBe(false);
});

test('a new loader cancels dismissal before the animation frame', () => {
  bootstrap.markReactReady();
  const release = bootstrap.registerBootstrapLoader();
  vi.advanceTimersByTime(200);
  expect(loader.classList.contains('bootstrapLoaderHidden')).toBe(false);
  expect(loader.isConnected).toBe(true);
  release();
  vi.advanceTimersByTime(200);
  expect(loader.isConnected).toBe(false);
});

test('a new loader cancels an in-flight fade and becomes visible again', () => {
  bootstrap.markReactReady();
  vi.advanceTimersByTime(16);
  expect(loader.classList.contains('bootstrapLoaderHidden')).toBe(true);
  const release = bootstrap.registerBootstrapLoader();
  expect(loader.classList.contains('bootstrapLoaderHidden')).toBe(false);
  vi.advanceTimersByTime(200);
  expect(loader.isConnected).toBe(true);
  release();
  vi.advanceTimersByTime(200);
  expect(loader.isConnected).toBe(false);
});

test('repeated ready notifications schedule only one removal', () => {
  bootstrap.markReactReady();
  bootstrap.markReactReady();
  expect(vi.getTimerCount()).toBe(1);
  vi.advanceTimersByTime(16);
  bootstrap.markReactReady();
  expect(vi.getTimerCount()).toBe(1);
  vi.advanceTimersByTime(180);
  expect(loader.isConnected).toBe(false);
});

test('works after the static loader has already been removed', () => {
  loader.remove();
  expect(bootstrap.isBootstrapLoaderPresent()).toBe(false);
  bootstrap.markReactReady();
  vi.advanceTimersByTime(200);
  expect(vi.getTimerCount()).toBe(0);
});
