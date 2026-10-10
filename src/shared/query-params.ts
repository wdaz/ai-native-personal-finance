/**
 * SPEC-transactions 2.2 and SPEC-recurring-bills 2.2: the rules both list pages read their
 * address by — a repeated parameter reads as its first value, an empty one as absent. One
 * module, so the two parsers cannot drift apart.
 */

/** A `URLSearchParams` (a route) or Next's awaited `searchParams` (a page). */
export type QueryParams =
  URLSearchParams | Readonly<Record<string, string | readonly string[] | undefined>>;

/** The first value of `name`, or `undefined` when it is missing or empty. */
export function firstParam(params: QueryParams, name: string): string | undefined {
  let value: string | null | undefined;
  if (params instanceof URLSearchParams) {
    value = params.get(name);
  } else if (Object.hasOwn(params, name)) {
    const raw = params[name];
    value = typeof raw === "string" ? raw : raw?.[0];
  }
  return value ? value : undefined;
}

export const isOneOf = <T extends string>(list: readonly T[], value: string): value is T =>
  (list as readonly string[]).includes(value);

/**
 * SPEC-transactions 2.3 (v1.0.17): the page's lenient cut of a search longer than `max` —
 * cut, then trimmed again so it never ends in a space. The limit counts UTF-16 units (the
 * field's `maxLength`), and a cut never keeps half a surrogate pair.
 */
export const cutSearch = (q: string, max: number): string =>
  q
    .slice(0, max)
    .replace(/[\uD800-\uDBFF]$/, "")
    .trimEnd();
