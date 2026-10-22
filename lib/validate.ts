// Server Actions are public endpoints that receive arbitrary JSON: a TypeScript
// `string` parameter is only a promise, not a check. An object passed where an
// id belongs becomes a Prisma FILTER (e.g. { not: "" } matches every row), so
// every client-supplied id must pass through here before it reaches a query.
// No imports: runnable by `npm test`.

export function isId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 128;
}
