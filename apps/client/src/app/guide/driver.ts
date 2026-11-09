import { driver, type DriveStep, type Driver } from 'driver.js';

import 'driver.js/dist/driver.css';
import './guide.css';

import type { GuideTask } from './types';

interface Options {
  onDestroyed: () => void;
}

interface ChecklistOptions extends Options {
  onTask: (id: string) => void;
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

/** Driver owns the checklist popover; all text is inserted as text nodes. */
export function openChecklist(tasks: GuideTask[], options: ChecklistOptions): Driver {
  const guide = createDriver(options);
  guide.highlight({
    element: visibleTarget('[data-guide="checklist"]'),
    disableActiveInteraction: true,
    popover: {
      title: 'First steps with Kijk',
      description: 'Choose your next step. You can close this introduction at any time.',
      showButtons: ['close'],
      onPopoverRender: (popover) => {
        popover.closeButton.setAttribute('aria-label', 'Close introduction');
        const list = document.createElement('ul');
        list.className = 'kijk-guide-tasks';
        for (const task of tasks) {
          const row = document.createElement('li');
          const label = `${task.done ? '✓ ' : ''}${task.label}${task.optional ? ' (optional)' : ''}`;
          if (!task.done) {
            const action = document.createElement('button');
            action.type = 'button';
            action.textContent = label;
            action.addEventListener('click', () => {
              guide.destroy();
              options.onTask(task.id);
            });
            row.append(action);
          } else {
            row.textContent = label;
          }
          list.append(row);
        }
        popover.description.append(list);
      },
    },
  });
  return guide;
}

interface WalkthroughOptions extends Options {
  canRecord: boolean;
  canPlanLimits: boolean;
  onDashboardExplained: () => void;
  dashboardOnly?: boolean;
}

/** Explains visible UI without clicking targets or submitting forms. */
export function openWalkthrough(options: WalkthroughOptions): Driver {
  const guide = createDriver(options);
  const steps: DriveStep[] = [];
  const add = (selector: string, title: string, description: string, completed?: () => void) => {
    const element = visibleTarget(selector);
    if (!element) {
      return;
    }
    steps.push({
      element,
      disableActiveInteraction: true,
      popover: {
        title,
        description,
        onNextClick: () => {
          completed?.();
          if (guide.hasNextStep()) {
            guide.moveNext();
          } else {
            guide.destroy();
          }
        },
      },
    });
  };
  if (!options.dashboardOnly) {
    add(
      '[data-guide="navigation"]',
      'Find your way around',
      'Open Consumptions to see entries and resources. Use the account menu for settings and Help & introduction. On mobile, open the navigation menu first.',
    );
    if (options.canRecord) {
      add(
        '[data-guide="record"]',
        'Record a value',
        'A meter reading is the cumulative number on your meter. The first absolute reading establishes a baseline; later readings determine consumption. Choose consumption when entering an amount used directly.',
      );
    }
  }
  add(
    '[data-guide="dashboard"]',
    'Understand your dashboard',
    'Choose a period and resource to explore the year. Meter reading shows cumulative readings; Consumption shows the amount used. An empty period does not remove older entries.',
    options.onDashboardExplained,
  );
  if (!options.dashboardOnly && options.canPlanLimits) {
    add(
      '[data-guide="limits"]',
      'Set a limit when you are ready',
      'Limits compare consumption with a threshold for a period. Open Limits to create one. This step is optional and does not prevent completing your introduction.',
    );
  }
  guide.setSteps(steps);
  if (steps.length > 0) {
    guide.drive();
  } else {
    options.onDestroyed();
  }
  return guide;
}
