import { checklist } from 'driver.js/checklist';

import 'driver.js/dist/checklist.css';
import './guide.css';

import type { GuideTask } from './types';

/** The modal owns focus and layout; Driver owns task rendering, checkmarks and the progress bar. */
export function mountChecklist(
  host: HTMLElement,
  tasks: GuideTask[],
  onTask: (id: string) => void,
  readTasks: () => GuideTask[],
) {
  const widget = checklist({
    id: 'kijk-getting-started',
    title: 'Your checklist',
    className: 'kijk-checklist',
    launcher: false,
    progressText: '{{done}} of {{total}} steps completed',
    completed: tasks.filter((task) => task.done).map((task) => task.id),
    items: tasks.map((task) => ({
      id: task.id,
      title: task.label,
      description: task.description,
      action: () => onTask(task.id),
      completeWhen: () => readTasks().find((current) => current.id === task.id)?.done ?? false,
      allowManualComplete: false,
    })),
    onProgress: ({ done, total }) => {
      const bar = host.querySelector('.driver-checklist-progress-bar');
      bar?.setAttribute('aria-valuenow', String(done));
      bar?.setAttribute('aria-valuemax', String(total));
    },
  });
  widget.show();
  const element = document.querySelector<HTMLElement>('.kijk-checklist');
  if (element) {
    host.append(element);
  }
  const panel = host.querySelector('.driver-checklist-panel');
  panel?.setAttribute('role', 'region');
  const bar = host.querySelector('.driver-checklist-progress-bar');
  bar?.setAttribute('role', 'progressbar');
  bar?.setAttribute('aria-label', 'Getting started progress');
  bar?.setAttribute('aria-valuemin', '0');
  bar?.setAttribute('aria-valuemax', String(tasks.length));
  bar?.setAttribute('aria-valuenow', String(tasks.filter((task) => task.done).length));
  widget.open();
  return widget;
}
