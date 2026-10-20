export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      </div>
    </main>
  );
}
