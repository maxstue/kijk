/**
 * Groups a list by the given property and allows to specify a uniqueProperty to check for duplicates.
 *
 * @param listToGroup The list to group.
 * @param property The property to group by.
 * @param uniqueProperty The property to check by.
 * @returns Returns an object with n-amount of lists as type "RT"
 */
export const groupBy = <T, TReturn extends Record<string | number | symbol, Array<T>>>(
  listToGroup: Array<T> | undefined,
  getKey: (item: T) => string,
  getUniqueKey?: (item: T) => string,
) => {
  const grouped: Record<string, Array<T>> = {};

  if (listToGroup) {
    for (const object of listToGroup) {
      const group = getKey(object);

      grouped[group] ??= [];

      if (getUniqueKey) {
        const foundIndex = grouped[group].findIndex((x) => getUniqueKey(x) === getUniqueKey(object));
        if (foundIndex === -1) {
          grouped[group].push(object);
        }
      } else {
        grouped[group].push(object);
      }
    }
  }

  return grouped as TReturn;
};
