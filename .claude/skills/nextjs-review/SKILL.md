---
name: nextjs-review
description: Next.js App Router best-practices checklist (38 common mistakes).
  Use when writing or reviewing Next.js code — pages, layouts, server
  components, client components, server actions, caching, metadata, images,
  or fonts. Also use before committing any PR that touches app/ or lib/.
---

# Next.js Review Checklist

Apply this checklist when writing or reviewing Next.js code in this project.
Flag violations with the item number. Project context: Next.js 16 App Router,
`proxy.ts` (not middleware), Server Actions in `app/actions/`, Clerk auth.

## Server vs Client Components

1. **Never mark a root page/layout `"use client"`.** It drags the whole tree
   to the client. Only interactive *leaf* components get `"use client"`
   (forms, dialogs, buttons with handlers).
2. **No `window`/`document`/event handlers in server components.** Extract
   browser-dependent code into a dedicated client component.
3. **Don't add `"use client"` "just in case".** A form posting to a server
   action doesn't need it. Add it only for state, effects, handlers, or
   browser APIs.
4. **Don't force truly interactive UI into server components** (drag-drop,
   animations, live counters). Constant round-trips = lag. Client components
   are the right tool there.
5. **Context providers:** wrap `{children}` in a small `"use client"`
   provider component; never mark the layout itself as client.

## Server Actions & Data

6. **Every server action is a public HTTP endpoint — protect it.** First
   line: `const { userId } = await auth()`; reject if missing; validate all
   inputs; check row-level access (this repo: verify group membership).
   TypeScript types vanish at runtime: an object passed where an id belongs
   becomes a Prisma *filter* — `deleteMany({ where: { id: { not: "" } } })`
   deleted every expense in a group in one request. Run every client-supplied
   id through `isId()` (`lib/validate.ts`) before it reaches a query.
7. **No `get`/read functions in `"use server"` files.** Everything exported
   from those files becomes an endpoint. Reads live in `lib/queries.ts`;
   only mutations live in `app/actions/`.
8. **No GET API routes for data a server component can fetch itself.**
   `async` server component + Suspense beats `/api/...` + useState.
9. **No mutations inside server components.** Fetch in components, mutate in
   server actions. After mutating: revalidate.
10. **Always revalidate after mutations:** `revalidatePath()` /
    `revalidateTag()` in the action, or the UI shows stale data.
11. **Never call `redirect()` inside try/catch** — it works by throwing. If
    unavoidable, rethrow in the catch block.
12. **`redirect()` (server) vs `router.push()` (client):** server-side
    redirect when no client follow-up is needed; `router.push` when you need
    a toast/local state change around navigation.

## Caching

13. **Memoize per-request fetches with React `cache()`** — e.g. the same
    query used by `generateMetadata` and the page must not run twice.
14. **Tag cached data** (`tags: [...]` on fetch/`unstable_cache`) so you can
    invalidate one slice with `revalidateTag()` instead of purging a route.
15. **`revalidateTag` vs `router.refresh()`:** tag invalidation is for
    static/tagged caches; `refresh()` re-renders dynamic server components
    (cookie/header-driven data).
16. **(If `use cache` is enabled)** `use cache` = shared/static data only;
    `use cache: private` for user-specific data touching cookies/headers.

## Routing, Loading & Errors

17. **Use `loading.tsx`** for route-level loading UI — don't convert server
    components to client just to hold a spinner in useState.
18. **Pair it with `error.tsx`** at the same segment level for a graceful
    fallback.
19. **Suspense goes around the component that *consumes* async data**, one
    level below the fetch — wrapping the awaited call itself won't stream.
20. **Fetch shared data in `layout.tsx`** (nav, current user) once, not in
    every page below it.

## Metadata, Assets & Env

21. **Dynamic metadata uses `generateMetadata()`**, never computed values in
    the static `metadata` export.
22. **Fonts via `next/font`** (this repo: Plus Jakarta Sans + Roboto Mono from
    the claymorphism theme, loaded in `app/layout.tsx` and wired through
    `--font-sans` / `--font-mono` in `@theme inline`), never manual Google
    Fonts CSS imports — avoids layout shift. A tweakcn registry theme only
    *names* fonts; after installing one, re-point every `--font-*` variable
    (including the copies it writes into `:root` / `.dark`) at the loaded
    ones, or dialog titles and mono text fall back silently.
23. **`next/image` needs `sizes`** so small viewports don't download desktop
    assets.
24. **Env vars:** secrets stay unprefixed and server-only. Only
    `NEXT_PUBLIC_*` reaches the client. Never pass a secret to a client
    component as a prop.
25. **Hydration errors:** first check HTML validity (no `<div>` in `<p>`),
    then gate client-only values (dates, random, `window`) behind effects.

## Hygiene

26. **Strip `console.log` from production** — `compiler.removeConsole` with
    `{ exclude: ["error"] }` in `next.config.ts`.
27. **Review AI-generated code before shipping it** — run this checklist on
    it like any other PR.

## Project-specific reminders

28. **Next 16 uses `proxy.ts`, not `middleware.ts`**, and route protection
    lives there (`clerkMiddleware`). Public routes (webhooks) must stay
    outside the `auth.protect()` matcher.
29. **Money is integer cents; identity is the Clerk `userId`** — see
    `.context/2-architecture.md` and `.context/3-database-schema.md`.
30. **Every action button: pending state + toast.** Label flips while the
    server action runs (`useTransition`), and the outcome lands as a sonner
    toast (`toast.success` / `toast.error`). Buttons that submit a form
    ALSO need explicit `type="submit"` — Base UI Button defaults to
    `type="button"` and silently won't submit.
31. **Edit reuses the create path.** One modal/form component serves both
    add and edit (an optional entity prop switches mode); the update action
    shares the create action's full validation — never a separate,
    lighter-validated edit form. Modal state is populated on OPEN so a
    reopen after save shows fresh props, not mount-time values. Related
    child rows (e.g. splits) are rewritten atomically with their parent
    (nested `deleteMany` + `create`), and the update is scoped by the
    parent id (`groupId`) like deletes are. Edit prefill: stored amounts
    are USD, so rebuild entered-currency shares with `reconstructShares`,
    but decide "equally" by replaying the entry pipeline (`wasEqualSplit`),
    never by judging the rebuilt shares — they drift for high-rate
    currencies (equal THB/JPY/INR/KRW/CAD splits reopened as "exact" 44% of
    the time).
32. **Bind server actions instead of cloning client components.** For
    repeated row actions (delete buttons on different entity types), write
    ONE generic client component that takes `action: () => Promise<{error?}>`
    as a prop, and have the server component pass
    `deleteThing.bind(null, parentId, rowId)`. Bound server actions are
    serializable across the RSC boundary; per-entity copies of the same
    button are not a pattern.
33. **Derived numbers must be auditable on screen.** If the UI shows a
    computed value (balances, totals, "who owes whom"), every record that
    feeds it must be visible — and removable — somewhere in the UI. A
    stored record that silently shifts the math (this repo: settlements)
    reads as a bug to the user. Corollary: deleting one record type must
    not silently cascade to another; each fact is removed explicitly.
34. **Cache Components: runtime data needs a Suspense boundary.** Anything
    that reads the request — `auth()`, cookies, `params`, `searchParams`,
    Clerk `<Show>`, `<SignIn>` / `<SignUp>`, `usePathname()` on a dynamic
    route — must sit under `<Suspense>` or a route `loading.tsx`, or
    `next build` fails with "Blocking Route". Dev mode only shows part of
    this: always run `npm run build`.
35. **Don't make a network call per page load for data you already have.**
    `currentUser()` is a request to Clerk's Backend API: call it only when
    our row is missing (`ensureUser`), and let the webhook keep profiles
    fresh. A Clerk blip must not take the dashboard down.
36. **Clock- or browser-dependent UI reads the clock on the client only.**
    For things like the "just added" sparkle use `useSyncExternalStore` with
    a server snapshot of "not yet" and a timer that expires it; never
    `Date.now()` in output the server also renders (hydration mismatch, and
    it never expires without a refresh).
37. **AI features:** the model only reads language. Money comes back as
    text and is re-validated by the same parsers as the manual form; never
    trust its output. Paid calls require sign-in + membership + an input
    cap + a per-user rate limit. Never log user text or SDK parse errors
    (they quote the model's output). Hide the UI when the key is absent, and
    pass the client a boolean, never the key.
38. **Verify, don't assume.** Pure logic lives in `lib/*.ts` with relative
    `.ts` imports so `npm test` (`node --test`, no extra deps) covers it;
    fuzz money math with a seeded PRNG. Check UI in headless Chrome
    (screenshots; the DevTools protocol for clicks). A plain
    `--window-size=390` is not a phone: Chrome enforces a ~500px minimum, so
    test mobile in a 390px iframe. Run `tsc` after the final `next build`:
    stale `.next/types` from a temporary route cause false errors.
