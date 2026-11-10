import { driver, type DriveStep, type Driver } from 'driver.js';

import 'driver.js/dist/driver.css';
import './guide.css';

import { getTourStops, type TourCapabilities } from './tour-stops';
import type { GuideDestination, GuideTopic } from './types';

interface Options {
  onDestroyed: () => void;
}

function visibleTarget(selector: string) {
  return [...document.querySelectorAll<HTMLElement>(selector)].find(
    (element) => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden',
  );
}

function createDriver(options: Options): Driver {
  let destroyed = false;
  const notifyDestroyed = () => {
    if (!destroyed) {
      destroyed = true;
      options.onDestroyed();
    }
  };
  const instance = driver({
    animate: !matchMedia('(prefers-reduced-motion: reduce)').matches,
    allowClose: true,
    allowKeyboardControl: true,
    overlayClickBehavior: 'close',
    stagePadding: 6,
    popoverClass: 'kijk-guide',
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Done',
    showProgress: true,
    progressText: '{{current}} of {{total}}',
    onPopoverRender: (popover) => {
      popover.closeButton.setAttribute('aria-label', 'Close introduction');
      popover.nextButton.disabled = true;
      popover.previousButton.disabled = true;
    },
    onHighlighted: () => {
      // Driver ignores navigation during its animation; expose that state to keyboard and pointer users.
      for (const button of document.querySelectorAll<HTMLButtonElement>(
        '.kijk-guide .driver-popover-next-btn, .kijk-guide .driver-popover-prev-btn',
      )) {
        button.disabled = false;
      }
    },
    // Driver skips onDestroyed when closed before its highlight animation initializes the active step.
    onDestroyStarted: (_element, _step, { driver: active }) => {
      active.destroy();
      notifyDestroyed();
    },
    onDestroyed: notifyDestroyed,
  });
  return {
    ...instance,
    destroy: () => {
      instance.destroy();
      notifyDestroyed();
    },
  };
}

interface WalkthroughOptions extends Options, TourCapabilities {
  kind: 'tour' | GuideTopic;
  onStepCompleted: (step: GuideTopic, completedTour?: boolean) => Promise<void>;
  onNavigate: (destination: GuideDestination) => Promise<void>;
  onError: () => void;
}

/** Wait for the real route content, including Suspense, before moving the spotlight. */
function waitForTarget(selector: string, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error('Tour closed'));
      return;
    }
    if (visibleTarget(selector)) {
      resolve();
      return;
    }
    const cleanup = () => {
      observer.disconnect();
      clearTimeout(timeout);
      signal.removeEventListener('abort', abort);
    };
    const abort = () => {
      cleanup();
      reject(new Error('Tour closed'));
    };
    const observer = new MutationObserver(() => {
      if (visibleTarget(selector)) {
        cleanup();
        resolve();
      }
    });
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Tour target unavailable'));
    }, 8000);
    signal.addEventListener('abort', abort, { once: true });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
  });
}

/** Each navigation stop introduces an actual link; Next opens its page before explaining its controls. */
export function openWalkthrough(options: WalkthroughOptions): Driver {
  const lifecycle = new AbortController();
  const guide = createDriver({
    onDestroyed: () => {
      lifecycle.abort();
      options.onDestroyed();
    },
  });
  const stops = getTourStops(options, options.kind, (selector) => Boolean(visibleTarget(selector)));
  let moving = false;
  let index = 0;
  const move = async (next: number) => {
    if (moving || lifecycle.signal.aborted) {
      return;
    }
    moving = true;
    try {
      const stop = stops[next]!;
      const previous = stops[index]!;
      if (next > index && previous.topic !== stop.topic) {
        await options.onStepCompleted(previous.topic);
      }
      if (lifecycle.signal.aborted) {
        return;
      }
      await options.onNavigate(stop.destination);
      await waitForTarget(stop.selector, lifecycle.signal);
      if (!lifecycle.signal.aborted) {
        index = next;
        guide.drive(next);
      }
    } catch {
      if (!lifecycle.signal.aborted) {
        options.onError();
        guide.destroy();
      }
    } finally {
      moving = false;
    }
  };
  const steps: DriveStep[] = stops.map((stop, position) => ({
    element: () => visibleTarget(stop.selector) ?? document.body,
    disableActiveInteraction: true,
    popover: {
      title: stop.title,
      description: stop.description,
      onNextClick: () => {
        if (moving) {
          return;
        }
        if (index === stops.length - 1) {
          moving = true;
          void options
            .onStepCompleted(stops[index]!.topic, options.kind === 'tour')
            .then(() => guide.destroy())
            .catch(() => {
              options.onError();
              guide.destroy();
            });
        } else {
          void move(position + 1);
        }
      },
      onPrevClick: () => {
        if (position > 0) {
          void move(position - 1);
        }
      },
    },
  }));
  guide.setSteps(steps);
  guide.drive();
  return guide;
}
