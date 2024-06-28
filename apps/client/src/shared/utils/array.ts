/**
 * Groups a list by the given property and allows to specify a uniqueProperty to check for duplicates.
 *
 * @param listToGroup The list to group.
 * @param property The property to group by.
 * @param uniqueProperty The property to check by.
 * @returns Returns an object with n-amount of lists as type "RT"
 */
export const groupBy = <T, RT extends Record<string | number | symbol, T[]>>(
  listToGroup: T[],
  getKey: (item: T) => string,
  getUniqueKey?: (item: T) => string,
) => {
  if (listToGroup) {
    return listToGroup.reduce(
      (previous, obj) => {
        const copyOfPrevious = previous;
        const group = getKey(obj);
        if (!copyOfPrevious[group]) {
          copyOfPrevious[group] = [];
        }

        if (Array.isArray(copyOfPrevious[group])) {
          if (getUniqueKey != null) {
            const foundIndex = previous[group].findIndex((x) => getUniqueKey(x) === getUniqueKey(obj));
            if (foundIndex === -1) {
              copyOfPrevious[group].push(obj);
            }
          } else {
            copyOfPrevious[group].push(obj);
          }
        }

        return copyOfPrevious;
      },
      {} as Record<string, T[]>,
    ) as RT;
  }
  return {} as Record<string, T[]> as RT;
};
