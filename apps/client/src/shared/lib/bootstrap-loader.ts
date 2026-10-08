const BOOTSTRAP_LOADER_ID = 'bootstrap-loader';
const HIDDEN_CLASS_NAME = 'bootstrapLoaderHidden';
const FADE_DURATION_MS = 180;

let activeLoaderCount = 0;
let reactIsReady = false;
let dismissAnimationFrame: number | undefined;
let removeTimeout: ReturnType<typeof globalThis.setTimeout> | undefined;

function getBootstrapLoader() {
  return globalThis.document?.getElementById(BOOTSTRAP_LOADER_ID);
}

function cancelDismissal() {
  if (dismissAnimationFrame !== undefined) {
    globalThis.cancelAnimationFrame(dismissAnimationFrame);
    dismissAnimationFrame = undefined;
  }

  if (removeTimeout !== undefined) {
    globalThis.clearTimeout(removeTimeout);
    removeTimeout = undefined;
  }

  getBootstrapLoader()?.classList.remove(HIDDEN_CLASS_NAME);
}

function completeDismissal(loader: HTMLElement) {
  removeTimeout = undefined;

  if (activeLoaderCount === 0) {
    loader.remove();
  } else {
    loader.classList.remove(HIDDEN_CLASS_NAME);
  }
}

function dismissBootstrapLoader() {
  dismissAnimationFrame = undefined;

  const loader = getBootstrapLoader();
  if (activeLoaderCount > 0 || loader === null) {
    return;
  }

  loader.classList.add(HIDDEN_CLASS_NAME);
  removeTimeout = globalThis.setTimeout(() => {
    completeDismissal(loader);
  }, FADE_DURATION_MS);
}

function scheduleDismissal() {
  const dismissalIsBlocked = [
    !reactIsReady,
    activeLoaderCount > 0,
    dismissAnimationFrame !== undefined,
    removeTimeout !== undefined,
  ].some(Boolean);

  if (!dismissalIsBlocked) {
    dismissAnimationFrame = globalThis.requestAnimationFrame(dismissBootstrapLoader);
  }
}

/** Returns whether the static loader from index.html is still in the DOM. */
export function isBootstrapLoaderPresent() {
  return getBootstrapLoader() !== null;
}

/** Keeps the bootstrap loader visible while a React loader is mounted; returns the cleanup that releases it. */
export function registerBootstrapLoader() {
  activeLoaderCount += 1;
  cancelDismissal();

  return () => {
    activeLoaderCount = Math.max(0, activeLoaderCount - 1);
    scheduleDismissal();
  };
}

/** Signals that React rendered so the bootstrap loader can fade out once no loader holds it. */
export function markReactReady() {
  reactIsReady = true;
  scheduleDismissal();
}
