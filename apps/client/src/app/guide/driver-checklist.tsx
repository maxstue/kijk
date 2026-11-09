import type { Checklist } from 'driver.js/checklist';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

import type { GuideTask, GuideTopic } from './types';

function loadChecklist() {
  return import('./native-checklist');
}

interface Props {
  tasks: GuideTask[];
  onTask: (id: GuideTopic) => void;
}

/** Adapts Driver's native checklist to our modal; only actual domain progress completes an item. */
export function DriverChecklist({ tasks, onTask }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const instance = useRef<Checklist | null>(null);
  const [failed, setFailed] = useState(false);
  const structure = JSON.stringify(tasks.map(({ id, label }) => ({ id, label })));
  const completed = tasks
    .filter((task) => task.done)
    .map((task) => task.id)
    .join(',');
  const readTasks = useEffectEvent(() => tasks);
  const selectTask = useEffectEvent((id: GuideTopic) => onTask(id));

  useEffect(() => {
    let disposed = false;
    void loadChecklist()
      .then((module) => {
        if (disposed || !host.current) {
          return;
        }
        instance.current = module.mountChecklist(
          host.current,
          readTasks(),
          (id) => selectTask(id as GuideTopic),
          () => readTasks(),
        );
      })
      .catch(() => {
        if (!disposed) {
          setFailed(true);
        }
      });
    return () => {
      disposed = true;
      instance.current?.hide();
      instance.current = null;
    };
  }, [structure]);

  useEffect(() => {
    const widget = instance.current;
    if (!widget) {
      return;
    }
    for (const task of readTasks()) {
      if (task.done) {
        widget.complete(task.id);
      } else {
        widget.uncomplete(task.id);
      }
    }
  }, [completed]);

  return (
    <div ref={host}>
      {failed && <p role='alert'>Could not load checklist. Please reopen Getting started to retry.</p>}
    </div>
  );
}
