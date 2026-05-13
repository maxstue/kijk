export type Optional<T> = T | undefined;
export type Nullable<T> = T | null;
export type Nullish<T> = T | undefined | null;

export type Autocomplete<TOptions extends string> = TOptions | (string & {});
