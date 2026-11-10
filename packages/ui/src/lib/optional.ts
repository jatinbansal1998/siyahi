/**
 * Every prop of T optional and taking undefined too, where `Partial<T>` under exactOptionalPropertyTypes takes only
 * a missing prop: for settings a page passes some of, such as `locale={{ currency: usd ? "USD" : undefined }}`.
 */
export type Optional<T> = { [K in keyof T]?: T[K] | undefined };
