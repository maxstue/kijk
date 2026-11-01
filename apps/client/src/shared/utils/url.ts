/** Removes trailing slashes in one backward scan while preserving the rest of the URL. */
export function trimTrailingSlashes(url: string) {
  let end = url.length;
  while (end > 0 && url[end - 1] === '/') {
    end--;
  }
  return url.slice(0, end);
}
