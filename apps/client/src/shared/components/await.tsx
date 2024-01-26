interface Options<T> {
  promise: Promise<T>;
  children: (result: T) => JSX.Element;
}

/**
 * A component which can await a promise usage: https://buildui.com/recipes/await-component
 *
 * @param options Pass the waitable promise and children
 * @returns An awaited componenent
 */
export async function Await<T>({ promise, children }: Options<T>) {
  const result = await promise;

  return children(result);
}
