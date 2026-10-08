/** `T` or `undefined`. */
export type Optional<T> = T | undefined;
/** `T` or `null`. */
export type Nullable<T> = T | null;
/** `T`, `null` or `undefined`. */
export type Nullish<T> = T | undefined | null;

/** A string that suggests `TOptions` but accepts any string. */
export type Autocomplete<TOptions extends string> = TOptions | (string & {});
